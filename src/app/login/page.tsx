import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (await verifyAdminSessionCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/");
  }

  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <section className="login-wrap">
      <article className="login-panel">
        <section className="login-hero" aria-label="브랜드 로고">
          <div className="logo-wrap login-logo-wrap">
            <Image src="/logo.png" alt="득근둑근 로고" className="logo-image" width={220} height={110} priority />
          </div>
          <div className="login-brand-copy">
            <span>득근둑근 관리자</span>
            <h1>운영은 단단하게,<br />관리는 가볍게.</h1>
            <p>회원 목표부터 운동 인증, 정산 문서까지 한곳에서 빠르게 관리하세요.</p>
            <div className="login-feature-list" aria-label="주요 기능">
              <span><BarChart3 size={15} /> 주간 현황</span>
              <span><Sparkles size={15} /> 인증 관리</span>
              <span><ShieldCheck size={15} /> 운영자 전용</span>
            </div>
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

