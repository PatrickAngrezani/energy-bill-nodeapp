import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { extractDataFromPDF } from "../services/pdfExtractor";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Readable } from "stream";
import { ParsedQs } from "qs";

dotenv.config();

const prisma = new PrismaClient();
const s3 = new S3Client({ region: process.env.AWS_REGION });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const createEnergyBill = async (req: Request, res: Response) => {
  const {
    ucName,
    installationNumber,
    distributor,
    accountNumber,
    year,
    issueDate,
    publicLightingContribuition,
    totalValue,
    totalValueWithoutGD,
    dueDate,
    kwhConsuption,
    sceeeEnergy,
    compensatedEnergyQuantity,
    compensatedEnergyQuantityMoney,
  } = req.body;

  try {
    const newEnergyBill = await prisma.energy_Bill.create({
      data: {
        ucName,
        installationNumber,
        distributor,
        accountNumber,
        month: String(new Date(issueDate)),
        year,
        totalValue,
        totalValueWithoutGD,
        dueDate,
        kwhConsuption,
        compensatedEnergyQuantity,
        compensatedEnergyQuantityMoney,
        publicLightingContribuition,
        sceeeEnergy,
      },
    });

    res.status(201).json(newEnergyBill);
  } catch (error) {
    res.status(500).json({ error: "Error creating the invoice" });
  }
};

export const getEnergyBills = async (req: Request, res: Response) => {
  try {
    const energyBills = await prisma.energy_Bill.findMany();

    const formattedBills = energyBills.map((bill) => ({
      ...bill,
      installationNumber: bill.installationNumber?.toString(),
    }));

    res.json({ energyBills: formattedBills });
  } catch (error) {
    console.error("Error fetching energy bills:", error);
    res.status(500).json({ error: "Error fetching the invoices" });
  }
};

export const getEnergyBillById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const energyBill = await prisma.energy_Bill.findUnique({
      where: { id: Number(id) },
    });

    if (!energyBill) res.status(404).json({ error: "Energy bill not found" });

    const formattedBill = {
      ...energyBill,
      installationNumber: energyBill?.installationNumber?.toString(),
    };

    res.json(formattedBill);
  } catch (error) {
    res.status(500).json({ error: "Error fetching the invoice" });
  }
};

export const updateEnergyBill = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    ucName,
    accountNumber,
    distributor,
    issueDate,
    year,
    publicLightingContribuition,
    totalValue,
    totalValueWithoutGD,
    dueDate,
    kwhConsuption,
    sceeeEnergy,
    compensatedEnergyQuantity,
    compensatedEnergyQuantityMoney,
  } = req.body;

  try {
    const updatedEnergyBill = await prisma.energy_Bill.update({
      where: { id: Number(id) },
      data: {
        ucName,
        accountNumber,
        distributor,
        year,
        month: String(new Date(issueDate)),
        totalValue,
        totalValueWithoutGD,
        dueDate,
        kwhConsuption,
        compensatedEnergyQuantity,
        compensatedEnergyQuantityMoney,
        publicLightingContribuition,
        sceeeEnergy,
      },
    });

    res.json(updatedEnergyBill);
  } catch (error) {
    res.status(500).json({ error: "Error updating the energy bill" });
  }
};

export const deleteEnergyBill = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.energy_Bill.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Invoice deleted succesfully" });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ error: "Energy bill not found" });
      return;
    }
    res.status(500).json({ error: "Error deleting energy bill:" });
  }
};

const uploadToS3 = async (filePath: string, fileName: string) => {
  const fileStream = fs.createReadStream(filePath);
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
    ContentType: "application/pdf",
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const data = await s3.send(command);
    return data;
  } catch (err) {
    console.error("Error uploading to S3:", err);
    throw err;
  }
};

export const processEnergyBillPDF = async (
  req: MulterRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "Please, send a PDF file" });
    return;
  }

  const pdfPath = path.join(__dirname, "..", "..", req.file.path);

  try {
    const extractedData = await extractDataFromPDF(pdfPath);
    const month = extractedData.month.split("/")[0];

    const fileName = `invoices/${extractedData.installationNumber}-${month}-${extractedData.year}.pdf`;
    await uploadToS3(pdfPath, fileName);

    const newEnergyBill = await prisma.energy_Bill.create({
      data: {
        ucName: extractedData.ucName,
        installationNumber: Number(extractedData.installationNumber),
        distributor: extractedData.distributor,
        accountNumber: extractedData.accountNumber,
        month,
        year: Number(extractedData.year),
        totalValue: Number(extractedData.totalValue),
        totalValueWithoutGD: Number(extractedData.totalValueNoGD),
        dueDate: extractedData.dueDate,
        kwhConsuption: Number(extractedData.kwhConsuption),
        sceeeEnergy: Number(extractedData.parsedSceeeEnergy),
        eletricEnergyConsume: Number(extractedData.eletricEnergyConsume),
        compensatedEnergyQuantity: Number(
          extractedData.parsedCompensatedEnergyQuantity
        ),
        compensatedEnergyQuantityMoney: Number(extractedData.GDEconomyPositive),
        publicLightingContribuition: Number(
          extractedData.publicLightingContribution
        ),
        s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
      },
    });

    fs.unlinkSync(pdfPath);

    const formattedBill = {
      ...newEnergyBill,
      installationNumber: newEnergyBill.installationNumber?.toString(),
    };

    res.status(201).json(formattedBill);
  } catch (error) {
    console.error("Error extracting data fron PDF:", error);
    throw new Error("Error extracting data from PDF");
  }
};

export const getFilteredBills = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { clientNumber, month, year } = req.query;

  try {
    let where;
    where = verifyParams(clientNumber, month, year, where);

    const filteredBills = await prisma.energy_Bill.findMany({
      where,
    });

    if (filteredBills.length === 0) {
      res.status(404).json({ error: "No found Invoices" });
      return;
    }

    const formattedBills = filteredBills.map((bill) => ({
      ...bill,
      installationNumber: bill.installationNumber?.toString(),
    }));

    res.json({ energyBills: formattedBills });
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({ error: "Error getting invoices" });
  }
};

export const downloadEnergyBill = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { clientNumber, month, year } = req.query;

  try {
    const invoice = await prisma.energy_Bill.findFirst({
      where: {
        accountNumber: String(clientNumber),
        month: String(month),
        year: Number(year),
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Energy bill not found" });
      return;
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `invoices/${invoice.installationNumber}-${month}-${year}.pdf`,
    };

    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    if (data.Body) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice-${clientNumber}-${month}-${year}.pdf"`
      );
      res.setHeader("Content-Type", "application/pdf");

      const stream = data.Body as Readable;
      stream.pipe(res);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    res.status(500).json({ error: "Error downloading the file" });
  }
};

function verifyParams(
  clientNumber?: string | ParsedQs | string[] | ParsedQs[],
  month?: string | ParsedQs | string[] | ParsedQs[],
  year?: string | ParsedQs | string[] | ParsedQs[],
  where: any = {}
) {
  if (clientNumber && typeof clientNumber === "string")
    where.accountNumber = String(clientNumber);
  if (month && typeof month === "string") where.month = String(month);
  if (year && typeof year === "string") where.year = Number(year);

  return where;
}
