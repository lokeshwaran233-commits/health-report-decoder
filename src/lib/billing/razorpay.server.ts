// Server-only helpers for Razorpay REST API + signature verification.
// Do NOT import this file from client code (filename ends in .server.ts).

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function getKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in project secrets.",
    );
  }
  return { keyId, keySecret };
}

function basicAuthHeader(keyId: string, keySecret: string) {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getKeys();
  const res = await fetch(`${RAZORPAY_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay order create failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

// HMAC-SHA256 using WebCrypto (Workers-compatible).
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** Verify the signature returned by Razorpay Checkout after a successful payment. */
export async function verifyCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  const { keySecret } = getKeys();
  const expected = await hmacSha256Hex(
    keySecret,
    `${params.razorpayOrderId}|${params.razorpayPaymentId}`,
  );
  return timingSafeEqualHex(expected, params.razorpaySignature.toLowerCase());
}

/** Verify the X-Razorpay-Signature header on incoming webhooks. */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqualHex(expected, signature.toLowerCase());
}

export function getPublicKeyId(): string {
  return getKeys().keyId;
}
