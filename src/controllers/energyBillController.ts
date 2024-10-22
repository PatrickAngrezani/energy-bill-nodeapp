import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { extractDataFromPDF } from "../services/pdfExtractor";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

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

    const newEnergyBill = await prisma.energy_Bill.create({
      data: {
        ucName: extractedData.ucName,
        installationNumber: Number(extractedData.installationNumber),
        distributor: extractedData.distributor,
        accountNumber: extractedData.accountNumber,
        month: extractedData.month,
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
    const filteredBills = await prisma.energy_Bill.findMany({
      where: {
        accountNumber: String(clientNumber),
        month: String(month),
        year: Number(year),
      },
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
