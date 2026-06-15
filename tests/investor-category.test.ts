import { describe, expect, it } from "vitest";
import { mockInvestors } from "../app/data/mockData";
import { getInvestorCategory, isVipInvestor } from "../app/lib/investorCategory";

describe("investorCategory", () => {
  it("marks co-investors with participation as VIP", () => {
    const riot = mockInvestors.find((i) => i.fund.name === "Riot Ventures");
    expect(riot).toBeDefined();
    expect(isVipInvestor(riot!)).toBe(true);
    expect(getInvestorCategory(riot!).id).toBe("co_investor_vip");
  });

  it("classifies cold funds without co-investments as market prospect", () => {
    const a16z = mockInvestors.find((i) => i.fund.name === "a16z American Dynamism");
    expect(a16z).toBeDefined();
    expect(getInvestorCategory(a16z!).id).toBe("market_prospect");
    expect(isVipInvestor(a16z!)).toBe(false);
  });

  it("classifies warm co-investors as active or VIP", () => {
    const flybridge = mockInvestors.find((i) => i.fund.name === "Flybridge");
    expect(flybridge).toBeDefined();
    const cat = getInvestorCategory(flybridge!);
    expect(["active_relationship", "co_investor_vip"]).toContain(cat.id);
  });
});
