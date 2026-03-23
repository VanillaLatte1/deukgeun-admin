"use client";

import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import PageTransition from "@/components/page-transition";
import SidebarMenu from "@/components/sidebar-menu";

type AppChromeProps = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <PageTransition>{children}</PageTransition>;
  }

  return (
    <>
      <div className="bg-layer" />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo-wrap">
            <div className="logo-badge">
              <img src="/logo.png" alt="득근둑근 로고" className="logo-image" />
            </div>
          </div>
          <SidebarMenu />
        </aside>

        <section className="main-area">
          <header className="main-header">
            <div className="header-account">
              <span className="account-chip">
                <ShieldCheck size={15} />
                ADMIN
              </span>
              <form action="/auth/logout" method="post">
                <button className="logout-btn" type="submit">
                  로그아웃
                </button>
              </form>
            </div>
          </header>
          <main className="content">
            <PageTransition>{children}</PageTransition>
          </main>
        </section>
      </div>
    </>
  );
}

