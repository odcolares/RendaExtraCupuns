import initSqlJs from "sql.js";
import fs from "fs";

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync("data/offers.db");
  const db = new SQL.Database(buf);
  const r = db.exec("SELECT COUNT(*) as c FROM offers");
  console.log("Total:", r[0].values[0][0]);
  const p = db.exec("SELECT COUNT(*) as c FROM offers WHERE published = 1");
  console.log("Published:", p[0].values[0][0]);
  const t = db.exec("SELECT type, COUNT(*) as c FROM offers GROUP BY type");
  if (t[0]) {
    for (const row of t[0].values) {
      console.log("Type", row[0], ":", row[1]);
    }
  }
  db.close();
}
main().catch(console.error);
