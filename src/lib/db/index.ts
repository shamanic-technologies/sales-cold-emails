import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.SALES_COLD_EMAILS_DATABASE_URL;

export function isDbMockMode(): boolean {
  return !DATABASE_URL;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    if (!DATABASE_URL) {
      throw new Error("SALES_COLD_EMAILS_DATABASE_URL is not set");
    }
    const sql = neon(DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
