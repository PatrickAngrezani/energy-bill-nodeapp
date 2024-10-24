import fs from "fs";
import pdfParse from "pdf-parse";

export const extractDataFromPDF = async (pdfPath: string) => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);

    const extractedText = data.text;
    const regex = /kWh\s+\S+\s+\S+\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})/g;

    let match;
    let values = [];

    while ((match = regex.exec(extractedText)) !== null) {
      const valor = match[1].replace(/\./g, "").replace(",", ".");
      if (!isNaN(Number(valor))) {
        values.push(Number(valor));
      }
    }

    const eletricEnergyR$ = values[0];
    const sceeEnergyR$ = values[1];
    const compensatedEnergyMoney = values[2];

    const GDEconomyPositive = Math.abs(compensatedEnergyMoney);

    const accountNumber =
      extractedText.match(/Nº DO CLIENTE\s+Nº DA INSTALAÇÃO\s+(\d+)\s+/)?.[1] ||
      "Unknown";
    const month =
      extractedText.match(
        /Referente a\s+Vencimento\s+Valor a pagar \(R\$\)\s+([A-Z]{3}\/\d{4})/
      )?.[1] || "Unknown";
    const year = month.split("/")[1];
    const valueMatch = extractedText.match(/\d{2}\/\d{2}\/\d{4}\s+(\d+,\d{2})/);
    const dueDateMatch = extractedText.match(
      /[A-Z]{3}\/\d{4}\s+(\d{2})\/(\d{2})\/(\d{4})/
    );
    const kwhConsuption =
      extractedText.match(/Energia ElétricakWh\s+(\d+)/)?.[1] || "0";
    const sceeeEnergy =
      extractedText.match(/Energia SCEE s\/ ICMSkWh\s+([\d.]+)/)?.[1] || "0";
    const compensatedEnergyQuantity =
      extractedText.match(/Energia compensada GD IkWh\s+([\d.]+)/)?.[1] || "0";
    const publicLightingContribution =
      extractedText
        .match(/Contrib Ilum Publica Municipal\s+(\d+,\d+)/)?.[1]
        .replace(",", ".") || "0";

    let installationNumber;
    const installationNumberMatch = extractedText.match(
      /(?:\d{10})\s+(\d{10})/
    );
    if (installationNumberMatch !== null) {
      installationNumber = installationNumberMatch[1];
    }

    const parsedSceeeEnergy = parseFloat(
      sceeeEnergy.replace(/\./g, "").replace(",", ".")
    );
    const parsedCompensatedEnergyQuantity = parseFloat(
      compensatedEnergyQuantity.replace(/\./g, "").replace(",", ".")
    );

    const dueDate = dueDateMatch
      ? `${dueDateMatch[3]}-${dueDateMatch[2]}-${dueDateMatch[1]}`
      : null;
    const totalValue = valueMatch ? valueMatch[1].replace(",", ".") : "0";
    const eletricEnergyConsume = Number(kwhConsuption) + Number(sceeeEnergy);

    const totalValueNoGD = removeGDOnValue(
      eletricEnergyR$,
      sceeEnergyR$,
      Number(publicLightingContribution)
    );

    const ucName = getUCName(extractedText);
    const distributor = getDistributorName(extractedText);

    return {
      ucName,
      installationNumber,
      distributor,
      accountNumber,
      month,
      year,
      totalValue,
      totalValueNoGD,
      dueDate,
      kwhConsuption,
      parsedSceeeEnergy,
      eletricEnergyConsume,
      parsedCompensatedEnergyQuantity,
      GDEconomyPositive,
      publicLightingContribution,
    };
  } catch (error) {
    console.error("Error extracting data from PDF:", error);
    throw new Error("Error extracting data from PDF");
  }
};

function removeGDOnValue(
  eletricEnergyR$: number,
  sceeEnergy: number,
  publicLightingContribution: number
): Number {
  const valueWithoutGD: number =
    eletricEnergyR$ + sceeEnergy + publicLightingContribution;
  return Number(valueWithoutGD.toFixed(2));
}

function getUCName(extractedText: String) {
  const lines = extractedText.split("\n");
  const ucName = lines[37].trim();

  return ucName;
}
function getDistributorName(extractedText: string) {
  const lines = extractedText.split("\n");
  const distributorLine = lines[63].trim();

  const distributor = distributorLine.split("CNPJ")[0].trim();

  return distributor;
}
