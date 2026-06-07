import { Resend } from "resend";
import { generateDigest } from "./digest.js";
import type { DigestItem } from "./types.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.DIGEST_FROM_EMAIL ?? "digest@alleycorp.vc";
const TO   = process.env.DIGEST_RECIPIENT_EMAIL ?? "";
const BASE = (process.env.APP_URL ?? "").replace(/\/$/, "");

function renderItem(item: DigestItem): string {
  const url = `${BASE}${item.deepLinkPath}`;
  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;font-size:15px;color:#111827;">${item.fundName}</div>
        <div style="margin:4px 0 10px;font-size:14px;color:#374151;">${item.summary}</div>
        <a href="${url}" style="font-size:13px;color:#6366f1;text-decoration:none;">
          View profile →
        </a>
      </td>
    </tr>`;
}

function buildHtml(items: DigestItem[], date: string): string {
  const rows = items.map(renderItem).join("");
  const count = items.length;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>AlleyCorp Network Digest</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:32px 32px 16px;">
              <div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">
                AlleyCorp Network · ${date}
              </div>
              <h1 style="margin:8px 0 4px;font-size:22px;color:#111827;">
                ${count} relationship${count === 1 ? "" : "s"} need attention
              </h1>
              <p style="margin:0;font-size:14px;color:#6b7280;">
                These co-investors have gone Stale. Reconnect before their next deal.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                AlleyCorp Network Intelligence · Daily digest ·
                <a href="${BASE}" style="color:#6366f1;text-decoration:none;">Open dashboard</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface SendDigestResult {
  sent: boolean;
  count: number;
  messageId?: string;
  error?: string;
}

export async function sendDigest(): Promise<SendDigestResult> {
  if (!TO) {
    return { sent: false, count: 0, error: "DIGEST_RECIPIENT_EMAIL is not set" };
  }

  const items = await generateDigest();

  if (items.length === 0) {
    return { sent: false, count: 0 };
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `${items.length} co-investor${items.length === 1 ? "" : "s"} need attention — ${date}`,
    html: buildHtml(items, date),
  });

  if (error) {
    return { sent: false, count: items.length, error: error.message };
  }

  return { sent: true, count: items.length, messageId: data?.id };
}
