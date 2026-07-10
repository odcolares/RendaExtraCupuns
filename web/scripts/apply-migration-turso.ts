/**
 * Aplica as migrations SQL ao Turso via libSQL client.
 *
 * Uso: npx ts-node -P tsconfig.json scripts/apply-migration-turso.ts
 * (ou: npx tsx scripts/apply-migration-turso.ts)
 */

import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const url = process.env.DATABASE_URL || "libsql://rendaextra-cupuns-odcolares.aws-us-east-1.turso.io";
  const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODM2OTU5NDksImlkIjoiMDE5ZjRjOTAtMWMwMS03YWQ4LTkyZDgtYjg0MzU2ZjczM2E2Iiwia2lkIjoicFhxaDlIcVVyVEJkNVM3Um5wdnlBSjY4eWhYZEpONjF4V1JsdFhfMENoNCIsInJpZCI6IjAzZGEzZjNmLTdmMTAtNDYxOS1hMzc4LWI4ZTJjZGE0OTE4NSJ9.YApj-s2yjMb9owFeu2EemHMhK0BEMAnukrlJROwBouerm4Ol6zm-o_hZuvbYFw0CZaqeEqEKWFKgMp6UQaCTAQ";

  console.log(`Conectando a ${url}...`);

  const client = createClient({ url, authToken });

  try {
    // Test connection
    const result = await client.execute("SELECT 1");
    console.log("✅ Conexão OK");

    // Read migrations in order
    const migrationsDir = path.resolve(__dirname, "../prisma/migrations");
    const dirs = fs.readdirSync(migrationsDir)
      .filter(d => d.startsWith("2026"))
      .sort();

    for (const dir of dirs) {
      const sqlFile = path.join(migrationsDir, dir, "migration.sql");
      if (!fs.existsSync(sqlFile)) continue;

      console.log(`\n📄 Aplicando migration: ${dir}`);
      const sql = fs.readFileSync(sqlFile, "utf-8");

      // Split by statements and execute each
      const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.execute(stmt + ";");
        } catch (err: any) {
          // Ignore "already exists" errors
          if (err.message?.includes("already exists")) {
            console.log(`  ⚠️  Já existe: ${stmt.substring(0, 60)}...`);
          } else {
            throw err;
          }
        }
      }
      console.log(`  ✅ Migration ${dir} aplicada`);
    }

    // Verify tables
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log("\n📊 Tabelas criadas:");
    for (const row of tables.rows) {
      console.log(`  - ${row.name}`);
    }

  } finally {
    client.close();
  }

  console.log("\n✅ Migrations concluídas!");
}

main().catch(err => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
