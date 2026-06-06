// Lauren Young confirmed Deep Tech portfolio — May 2026 (see PORTFOLIO.md in RIP-Alley).

export type PortfolioStatus = "active" | "alumni";
export type AlleyCorpRole = "Lead" | "Co-lead" | "Participant";

export interface PortfolioCompanyRecord {
  id: string;
  name: string;
  url: string;
  sector: string;
  stage: string;
  alleyCorpRole: AlleyCorpRole;
  status: PortfolioStatus;
}

export const portfolioCompanyRecords: PortfolioCompanyRecord[] = [
  { id: "6", name: "Glacier", url: "endwaste.io", sector: "Climate", stage: "Series A", alleyCorpRole: "Lead", status: "active" },
  { id: "1", name: "Valar Atomics", url: "valaratomics.com", sector: "Energy", stage: "Seed", alleyCorpRole: "Co-lead", status: "active" },
  { id: "2", name: "Eyebot", url: "eyebot.tech", sector: "Robotics", stage: "Series A", alleyCorpRole: "Co-lead", status: "active" },
  { id: "7", name: "Cargo Robotics", url: "withcargo.com", sector: "Robotics", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "3", name: "Portal Space Systems", url: "portalsystems.space", sector: "Space", stage: "Seed", alleyCorpRole: "Co-lead", status: "active" },
  { id: "8", name: "Appetronix", url: "appetronix.com", sector: "Food Tech", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "5", name: "Civ Robotics", url: "civrobotics.com", sector: "Robotics", stage: "Series A", alleyCorpRole: "Co-lead", status: "active" },
  { id: "9", name: "Koop Technologies", url: "koop.ai", sector: "Logistics", stage: "Seed", alleyCorpRole: "Participant", status: "active" },
  { id: "10", name: "Renovate Robotics", url: "renovaterobotics.com", sector: "Construction", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "11", name: "Mapless AI", url: "mapless.ai", sector: "Autonomy", stage: "Seed", alleyCorpRole: "Participant", status: "active" },
  { id: "12", name: "Earth Force", url: "earthforce.io", sector: "Climate", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "13", name: "Aon 3D", url: "aon3d.com", sector: "Manufacturing", stage: "Series A", alleyCorpRole: "Co-lead", status: "active" },
  { id: "14", name: "Avatar", url: "avatarsystems.com", sector: "Robotics", stage: "Seed", alleyCorpRole: "Participant", status: "active" },
  { id: "15", name: "Root Access", url: "rootaccess.ai", sector: "AI / ML", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "4", name: "Halo Braid", url: "halobraid.com", sector: "Manufacturing", stage: "Seed", alleyCorpRole: "Co-lead", status: "active" },
  { id: "16", name: "dolaGon", url: "dolagon.com", sector: "Agriculture", stage: "Seed", alleyCorpRole: "Participant", status: "active" },
  { id: "17", name: "ARIX Technologies", url: "arix-tech.com", sector: "Industrial", stage: "Seed", alleyCorpRole: "Lead", status: "active" },
  { id: "18", name: "Spaero Bio", url: "spaero.bio", sector: "Life Sciences", stage: "Series B", alleyCorpRole: "Lead", status: "alumni" },
  { id: "19", name: "Dexai Robotics", url: "dexai.com", sector: "Robotics", stage: "Series A", alleyCorpRole: "Co-lead", status: "alumni" },
  { id: "20", name: "Aescape", url: "aescape.co", sector: "Wellness", stage: "Series B", alleyCorpRole: "Participant", status: "alumni" },
];

export const activePortfolioCompanies = portfolioCompanyRecords.filter((c) => c.status === "active");
export const alumniPortfolioCompanies = portfolioCompanyRecords.filter((c) => c.status === "alumni");

/** Legacy shape used by co-investment records in mockData. */
export function toLegacyCompany(record: PortfolioCompanyRecord) {
  return { id: record.id, name: record.name, url: record.url };
}

export const legacyPortfolioCompanies = portfolioCompanyRecords
  .filter((c) => ["1", "2", "3", "4", "5"].includes(c.id))
  .sort((a, b) => Number(a.id) - Number(b.id))
  .map(toLegacyCompany);
