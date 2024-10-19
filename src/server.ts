import express from "express";
import dotenv from "dotenv";
import { connectDB } from "../database/postgres/postgres-connection";
import router from "./routes/energyBillRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(router);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer();
