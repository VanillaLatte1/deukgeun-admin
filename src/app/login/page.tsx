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
        <section className="login-hero" aria-label="브랜드 소개">
          <div className="login-hero-copy">
            <p className="login-kicker">DEUKGEUN BACKOFFICE</p>
            <h1>운영진 업무를 더 빠르고 선명하게 관리하세요.</h1>
            <p>
              회원 관리, 운동 인증 등록, 기록 확인까지 한 화면에서 안정적으로
              처리할 수 있는 관리자 전용 백오피스입니다.
            </p>
          </div>
          <div className="logo-wrap login-logo-wrap">
            <img src="/logo.png" alt="득근둑근 로고" className="logo-image" />
          </div>
        </section>

        <section className="login-form-panel" aria-label="로그인 입력 영역">
          <div className="login-form-head">
            <p className="login-form-kicker">관리자 로그인</p>
            <strong>아이디와 비밀번호를 입력해 주세요.</strong>
          </div>
          <LoginForm hasError={hasError} />
        </section>
      </article>
    </section>
  );
}

