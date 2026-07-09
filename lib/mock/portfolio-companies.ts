// lib/mock/portfolio-companies.ts
// The 20-company portfolio list (17 active + 3 alumni), sourced from the
// team's own PORTFOLIO.md — already-public, non-sensitive company names
// and websites. Used by app/portfolio/page.tsx when DATABASE_URL is unset.
export interface MockPortfolioCompany {
  id: string;
  name: string;
  website: string;
  status: "active" | "alumni";
}

export const MOCK_PORTFOLIO_COMPANIES: MockPortfolioCompany[] = [
  { id: "mock-pc-glacier", name: "Glacier", website: "https://www.endwaste.io", status: "active" },
  { id: "mock-pc-valar-atomics", name: "Valar Atomics", website: "https://www.valaratomics.com", status: "active" },
  { id: "mock-pc-eyebot", name: "Eyebot", website: "https://www.eyebot.tech", status: "active" },
  { id: "mock-pc-cargo-robotics", name: "Cargo Robotics", website: "https://www.withcargo.com", status: "active" },
  { id: "mock-pc-portal-space-systems", name: "Portal Space Systems", website: "https://www.portalsystems.space", status: "active" },
  { id: "mock-pc-appetronix", name: "Appetronix", website: "https://www.appetronix.com", status: "active" },
  { id: "mock-pc-civ-robotics", name: "Civ Robotics", website: "https://www.civrobotics.com", status: "active" },
  { id: "mock-pc-koop-technologies", name: "Koop Technologies", website: "https://www.koop.ai", status: "active" },
  { id: "mock-pc-renovate-robotics", name: "Renovate Robotics", website: "https://www.renovaterobotics.com", status: "active" },
  { id: "mock-pc-mapless-ai", name: "Mapless AI", website: "https://www.mapless.ai", status: "active" },
  { id: "mock-pc-earth-force", name: "Earth Force", website: "https://www.earthforce.io", status: "active" },
  { id: "mock-pc-aon-3d", name: "Aon 3D", website: "https://www.aon3d.com", status: "active" },
  { id: "mock-pc-avatar", name: "Avatar", website: "https://www.avatarsystems.com", status: "active" },
  { id: "mock-pc-root-access", name: "Root Access", website: "https://www.rootaccess.ai", status: "active" },
  { id: "mock-pc-halo-braid", name: "Halo Braid", website: "https://www.halobraid.com", status: "active" },
  { id: "mock-pc-dolagon", name: "dolaGon", website: "https://www.dolagon.com", status: "active" },
  { id: "mock-pc-arix-technologies", name: "ARIX Technologies", website: "https://www.arix-tech.com", status: "active" },
  { id: "mock-pc-spaero-bio", name: "Spaero Bio", website: "https://www.spaero.bio", status: "alumni" },
  { id: "mock-pc-dexai-robotics", name: "Dexai Robotics", website: "https://www.dexai.com", status: "alumni" },
  { id: "mock-pc-aescape", name: "Aescape", website: "https://www.aescape.co", status: "alumni" },
];
