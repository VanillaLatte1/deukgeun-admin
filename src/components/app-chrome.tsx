"use client";

import { Menu, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import PageTransition from "@/components/page-transition";
import SidebarMenu from "@/components/sidebar-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AppChromeProps = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const routeMeta = pathname.startsWith("/members")
    ? { eyebrow: "People", title: "회원 관리" }
    : pathname.startsWith("/workout-records")
      ? { eyebrow: "Records", title: "인증 기록" }
      : pathname.startsWith("/workouts")
        ? { eyebrow: "Workout", title: "운동 인증" }
        : pathname.startsWith("/weekly-exceptions")
          ? { eyebrow: "Exceptions", title: "주간 제외" }
          : pathname.startsWith("/penalty-documents")
            ? { eyebrow: "Settlement", title: "벌금 문서" }
            : { eyebrow: "Overview", title: "대시보드" };

  if (isLoginPage) {
    return <PageTransition>{children}</PageTransition>;
  }

  return (
    <>
      <div className="bg-layer" />
      <div className="app-shell">
        <aside className="sidebar desktop-sidebar">
          <div className="sidebar-brand">
            <div className="logo-badge">
              <Image src="/logo.png" alt="득근둑근 로고" className="logo-image" width={80} height={40} priority />
            </div>
            <div className="sidebar-brand-copy">
              <strong>득근둑근</strong>
              <span>운영 백오피스</span>
            </div>
          </div>
          <SidebarMenu />
          <p className="sidebar-footnote">건강한 루틴을 더 간결하게</p>
        </aside>

        <section className="main-area">
          <header className="mobile-topbar">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="mobile-menu-trigger"
                    aria-label="메뉴 열기"
                  />
                }
              >
                <Menu size={18} />
              </SheetTrigger>
              <SheetContent side="left" className="mobile-sheet" showCloseButton>
                <SheetHeader className="mobile-sheet-head">
                  <div className="mobile-sheet-brand">
                    <div className="logo-badge mobile-sheet-logo">
                      <Image src="/logo.png" alt="득근둑근 로고" className="logo-image" width={80} height={40} />
                    </div>
                    <div>
                      <SheetTitle>득근둑근 Backoffice</SheetTitle>
                      <SheetDescription>관리자 메뉴</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <div className="mobile-sheet-body">
                  <SidebarMenu
                    className="mobile-menu-list"
                    itemClassName="mobile-menu-card"
                    closeOnSelect
                  />
                  <form action="/auth/logout" method="post" className="mobile-logout-form">
                    <button className="logout-btn mobile-logout-btn" type="submit">
                      로그아웃
                    </button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>

            <div className="mobile-topbar-brand">
              <div className="logo-badge mobile-topbar-logo">
                <Image src="/logo.png" alt="득근둑근 로고" className="logo-image" width={80} height={40} />
              </div>
            </div>
          </header>

          <header className="main-header">
            <div className="main-header-copy">
              <span>{routeMeta.eyebrow}</span>
              <strong>{routeMeta.title}</strong>
            </div>
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
