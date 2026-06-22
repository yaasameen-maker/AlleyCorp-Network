import type Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_investor",
    description:
      "Look up a specific investor or fund by name. Returns their warmth tier, active signals, co-investment history with AlleyCorp portfolio companies, and suggested next action. Use this when asked about a specific fund or investor (e.g. 'What should I know about General Catalyst?' or 'Show me the full picture on Trimble Ventures').",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "The fund or investor name to look up (e.g. 'Lux Capital', 'General Catalyst')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "search_relationships",
    description:
      "Search the AlleyCorp deep tech investor universe. Use for any question about investors, relationships, or funds — including by location (city or region), stage (Seed, Series A, etc.), warmth tier, event/invite context, fund name, portfolio company, or market-prospect status. Examples: 'Who are deep tech investors in LA?', 'Which funds do Series A?', 'Who should we invite to our event?', 'Which funds co-invested in robotics?', 'Are there top deep tech funds we haven't co-invested with yet?'",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The search intent in natural language: can include a city/region (e.g. 'Los Angeles', 'New York'), a stage (e.g. 'Series A', 'Seed'), a warmth tier, a fund name, a portfolio company, or relationship context like 'invite' or 'reconnect'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_stale_relationships",
    description:
      "Returns all co-investors currently in the Stale warmth tier — funds that co-invested with AlleyCorp at an earlier round but have not returned at subsequent rounds, or whose signals have decayed. Use this when asked about relationships that need attention, reconnection, or risk being lost (e.g. 'Who should we reconnect with before they lead another round without us?' or 'Which co-investors are going cold?').",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_warmth_signals",
    description:
      "Returns all warmth signals for a specific investor by their relationship ID. Signals are the individual data points (co-investments, event attendance, press mentions, LinkedIn connections) that make up their warmth tier score. Use this after get_investor to show the evidence behind a warmth classification.",
    input_schema: {
      type: "object",
      properties: {
        investor_id: {
          type: "string",
          description: "The unique ID of the investor relationship record",
        },
      },
      required: ["investor_id"],
    },
  },
];
