"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/modal";

type LoginFormProps = {
  hasError: boolean;
};

export function LoginForm({ hasError }: LoginFormProps) {
  const router = useRouter();
  const [openErrorModal, setOpenErrorModal] = useState(hasError);

  const closeErrorModal = () => {
    setOpenErrorModal(false);
    router.replace("/login");
  };

  return (
    <>
      <form action="/auth/login" method="post" className="form-grid single-col login-form">
        <section className="login-credentials" aria-label="로그인 계정 정보">
          <label className="login-field">
            관리자 아이디
            <input
              name="admin_id"
              type="text"
              required
              autoComplete="username"
              placeholder="아이디를 입력하세요."
            />
          </label>
          <label className="login-field">
            비밀번호
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요."
            />
          </label>
          <button className="primary-btn" type="submit">
            로그인
          </button>
        </section>
      </form>

      <Modal
        open={openErrorModal}
        title="로그인 실패"
        description="아이디 또는 비밀번호가 올바르지 않습니다."
        onClose={closeErrorModal}
        confirmLabel="확인"
        cancelLabel="닫기"
      />
    </>
  );
}
