import { Router } from "express";
import {
  createEnergyBill,
  getEnergyBills,
  getEnergyBillById,
  updateEnergyBill,
  deleteEnergyBill,
  processEnergyBillPDF,
  getFilteredBills,
  downloadEnergyBill,
} from "../controllers/energyBillController";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.post("/energy-bill", createEnergyBill);
router.get("/energy-bills", getEnergyBills);
router.get("/energy-bill/:id", getEnergyBillById);
router.get("/energy-bill", getFilteredBills);
router.put("/energy-bill/:id", updateEnergyBill);
router.delete("/energy-bill/:id", deleteEnergyBill);
router.post(
  "/energy-bill/upload-pdf",
  upload.single("pdf"),
  processEnergyBillPDF
);
router.get("/invoice/download", downloadEnergyBill);

export default router;
