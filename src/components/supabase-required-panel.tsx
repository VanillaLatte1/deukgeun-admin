import type { ReactNode } from "react";

type SupabaseRequiredPanelProps = {
  title?: ReactNode;
  showEnvGuide?: boolean;
};

export function SupabaseRequiredPanel({
  title = "Supabase 연결이 필요합니다",
  showEnvGuide = true,
}: SupabaseRequiredPanelProps) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {showEnvGuide ? (
        <p>
          <code>.env.local</code>에 <code>NEXT_PUBLIC_SUPABASE_URL</code>과
          <code> SUPABASE_SERVICE_ROLE_KEY</code>를 설정하세요.
        </p>
      ) : null}
    </section>
  );
}
