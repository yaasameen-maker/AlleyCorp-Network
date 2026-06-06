import { listStaleRelationships } from "./db.js";
import type { DigestItem, Relationship } from "./types.js";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSummary(rel: Relationship): string {
  const coInvSignal = rel.signals?.find((s) => s.type === "co_investment");
  const company = rel.portfolioCompany?.name ?? coInvSignal?.value ?? "a portfolio company";
  return `${rel.fund?.name} is Stale — last co-invested in ${company}. Reconnect before they lead another round.`;
}

export async function generateDigest(): Promise<DigestItem[]> {
  const stale = await listStaleRelationships();
  const now = new Date().toISOString();
  return stale.map((rel) => ({
    type: "STALE_ALERT",
    fundName: rel.fund?.name ?? rel.fundId,
    summary: buildSummary(rel),
    deepLinkPath: `/investors/${toSlug(rel.fund?.name ?? rel.fundId)}`,
    generatedAt: now,
  }));
}
