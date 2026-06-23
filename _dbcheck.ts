import { initDatabase, closeDatabase } from "./src/database/index";

async function main() {
  await initDatabase();
  const { getAllOffers, countOffers } = await import("./src/database/offers");
  const offers = getAllOffers();
  console.log("Total:", offers.length);
  for (const o of offers) {
    const t = o as any;
    console.log(`ID=${t.id} | name=${(t.name||"").substring(0,50)} | orig=${(t.original_url||"").substring(0,50)} | aff=${(t.affiliate_link||"(none)").substring(0,50)} | pub=${t.published} | img=${!!t.image_url} | plat=${t.platform} | created=${t.created_at}`);
  }
  await closeDatabase();
}
main().catch(console.error);
