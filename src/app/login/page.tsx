import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value === "ok") {
    redirect("/");
  }

  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <section className="login-wrap">
      <article className="login-panel">
        <section className="login-hero" aria-label="브랜드 로고">
          <div className="logo-wrap login-logo-wrap">
            <img src="/logo.png" alt="득근둑근 로고" className="logo-image" />
          </div>
        </section>

        <section className="login-form-panel" aria-label="로그인 입력 영역">
          <div className="login-form-head">
            <p className="login-form-kicker">관리자 로그인</p>
            <strong>로그인</strong>
          </div>
          <LoginForm hasError={hasError} />
        </section>
      </article>
    </section>
  );
}

