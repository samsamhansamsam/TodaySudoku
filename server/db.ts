import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create postgres client
const connectionString = process.env.DATABASE_URL as string;
const client = postgres(connectionString);

// Create drizzle client
export const db = drizzle(client);