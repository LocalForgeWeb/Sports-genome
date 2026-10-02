import { drizzle } from "drizzle-orm/mysql2";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      // The error from a malformed URL quotes the URL, password included; log only its class.
      console.warn("[Database] Failed to connect:", error instanceof Error ? error.name : "unknown error");
      _db = null;
    }
  }
  return _db;
}

// TODO: add feature queries here as your schema grows.
