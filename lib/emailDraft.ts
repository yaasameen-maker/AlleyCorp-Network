import type { Investor, WarmthTier } from "@/app/data/mockData";
import { formatMonthsAgo } from "./dates";

export interface EmailDraftContent {
  subject: string;
  body: string;
  greeting: string;
  hasContactName: boolean;
  hasContactEmail: boolean;
}

function primaryCompany(investor: Investor): string | undefined {
  const participated = investor.coInvestments.filter((c) => c.fundParticipated);
  const list = participated.length > 0 ? participated : investor.coInvestments;
  return list[0]?.portfolioCompany.name;
}

function greeting(investor: Investor): { text: string; hasName: boolean } {
  if (investor.contactFirstName) {
    return { text: `Hi ${investor.contactFirstName},`, hasName: true };
  }
  return { text: "Hi there,", hasName: false };
}

function buildByTier(investor: Investor, tier: WarmthTier, greet: string): EmailDraftContent {
  const company = primaryCompany(investor);
  const companyPhrase = company ? ` on ${company}` : "";
  const recency = investor.lastSignalDate
    ? formatMonthsAgo(investor.lastSignalDate)
    : "some time";

  switch (tier) {
    case "Stale":
      return {
        greeting: greet,
        hasContactName: !!investor.contactFirstName,
        hasContactEmail: !!investor.contactEmail,
        subject: company
          ? `Reconnecting — AlleyCorp & ${investor.fund.name} (${company})`
          : `Reconnecting — AlleyCorp & ${investor.fund.name}`,
        body: `${greet}

It's been a while since we last connected${companyPhrase} — our last signal was ${recency}. AlleyCorp co-invested alongside ${investor.fund.name} previously, and we'd like to stay aligned ahead of the next round in this space.

Would you have 20 minutes in the next couple of weeks to catch up?

Best,
[Your name]
AlleyCorp`,
      };

    case "Warm":
      return {
        greeting: greet,
        hasContactName: !!investor.contactFirstName,
        hasContactEmail: !!investor.contactEmail,
        subject: company
          ? `Staying in touch — ${company} & AlleyCorp`
          : `Staying in touch — AlleyCorp & ${investor.fund.name}`,
        body: `${greet}

We co-invested${companyPhrase ? ` in ${company}` : ""} and want to keep the relationship active. Last signal was ${recency} — I'd love a quick sync on how you're thinking about the category and where AlleyCorp can be helpful.

Open to a brief call this month?

Best,
[Your name]
AlleyCorp`,
      };

    case "Hot":
      return {
        greeting: greet,
        hasContactName: !!investor.contactFirstName,
        hasContactEmail: !!investor.contactEmail,
        subject: company
          ? `Deal flow / AlleyCorp Deep Tech event — ${company}`
          : `Deal flow & AlleyCorp Deep Tech — ${investor.fund.name}`,
        body: `${greet}

We've had strong alignment co-investing${companyPhrase ? ` around ${company}` : ""} and would like to keep you close to AlleyCorp deal flow. We're hosting a Deep Tech partner dinner next month — would ${investor.fund.name} like an invite?

Also happy to share what we're seeing in the portfolio ahead of the next round.

Best,
[Your name]
AlleyCorp`,
      };

    case "Cold":
    default:
      return {
        greeting: greet,
        hasContactName: !!investor.contactFirstName,
        hasContactEmail: !!investor.contactEmail,
        subject: `Introduction — AlleyCorp Deep Tech & ${investor.fund.name}`,
        body: `${greet}

AlleyCorp leads Seed and Series A in deep tech. We haven't co-invested yet, but your focus overlaps several companies in our portfolio${company ? ` — ${company} is one angle` : ""}.

Would you be open to a short intro call to compare notes?

Best,
[Your name]
AlleyCorp`,
      };
  }
}

export function buildEmailDraft(investor: Investor): EmailDraftContent {
  const { text, hasName } = greeting(investor);
  const draft = buildByTier(investor, investor.warmthTier, text);
  return { ...draft, hasContactName: hasName, hasContactEmail: !!investor.contactEmail };
}

export function formatEmailForCopy(subject: string, body: string, toEmail?: string): string {
  const toLine = toEmail ? `To: ${toEmail}\n` : "";
  return `${toLine}Subject: ${subject}\n\n${body}`;
}
