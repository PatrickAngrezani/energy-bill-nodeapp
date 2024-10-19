import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

let client: Client;

export const connectDB = async () => {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await client.connect();
      console.log("client connected");
    } catch (error) {
      console.error("Error connecting to PostgreSQL:", error);
      process.exit(1);
    }
  }
};

export { client };
