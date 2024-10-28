import { it, expect } from "@jest/globals";
import { extractDataFromPDF } from "../services/pdfExtractor";
import dotenv from "dotenv";

dotenv.config();

it("Correctly extracts data from the PDF file", (done) => {
  extractDataFromPDF("src/tests/files/3001116735-01-2024.pdf")
    .then((data) => {
      expect(data).toBeDefined();
      expect(data.accountNumber).toBe("7204076116");
      expect(data.month).toBe("JAN/2024");
      expect(data.kwhConsuption).toBe("50");
      expect(data.parsedCompensatedEnergyQuantity).toBe(456);
      done();
    })
    .catch((error) => {
      done(error);
    });
});
