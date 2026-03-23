"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, ClipboardList, LayoutDashboard, UsersRound } from "lucide-react";

const menus = [
  {
    href: "/",
    title: "대시보드",
    icon: LayoutDashboard,
  },
  {
    href: "/members",
    title: "회원/목표 관리",
    icon: UsersRound,
  },
  {
    href: "/workouts",
    title: "운동 인증 등록",
    icon: ClipboardCheck,
  },
  {
    href: "/workout-records",
    title: "인증 기록 관리",
    icon: ClipboardList,
  },
];

export default function SidebarMenu() {
  const pathname = usePathname();

  return (
    <nav className="menu-list">
      {menus.map((menu) => {
        const Icon = menu.icon;
        const isActive =
          pathname === menu.href ||
          (menu.href !== "/" && pathname.startsWith(menu.href));

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`menu-card${isActive ? " active" : ""}`}
            aria-label={menu.title}
            title={menu.title}
          >
            <span className="menu-icon-wrap">
              <Icon size={18} />
            </span>
            <span className="menu-text" aria-hidden="true">
              <span className="menu-title">{menu.title}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
