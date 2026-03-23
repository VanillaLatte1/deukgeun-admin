import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { createSupabaseAdmin } from "@/lib/supabase-server";

export type AdminAccount = {
  id: string;
  admin_id: string;
  password_hash: string;
  is_active: boolean;
};

export function hashAdminPassword(password: string) {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

function safeCompare(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export async function verifyAdminCredentials(adminId: string, password: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("id, admin_id, password_hash, is_active")
    .eq("admin_id", adminId)
    .maybeSingle<AdminAccount>();

  if (error || !data || !data.is_active) {
    return false;
  }

  const inputHash = hashAdminPassword(password);
  return safeCompare(data.password_hash, inputHash);
}
