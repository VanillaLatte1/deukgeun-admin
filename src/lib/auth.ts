export const ADMIN_COOKIE_NAME = "workout_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET 또는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  }

  return secret;
}

function toBase64Url(bytes: ArrayBuffer) {
  return Buffer.from(bytes).toString("base64url");
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAdminSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdminSessionCookieValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = String(expiresAt);
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(payload),
  );

  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifyAdminSessionCookie(value?: string) {
  if (!value) return false;

  const [expiresAtText, signatureText, extra] = value.split(".");
  if (!expiresAtText || !signatureText || extra) return false;

  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  if (expiresAt > now + ADMIN_SESSION_MAX_AGE_SECONDS + 60) return false;

  try {
    return await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      Buffer.from(signatureText, "base64url"),
      new TextEncoder().encode(expiresAtText),
    );
  } catch {
    return false;
  }
}
