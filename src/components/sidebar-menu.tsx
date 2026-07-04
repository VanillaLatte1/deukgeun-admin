"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarX2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";

import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  {
    href: "/weekly-exceptions",
    title: "주간 제외 관리",
    icon: CalendarX2,
  },
  {
    href: "/penalty-documents",
    title: "벌금 문서 출력",
    icon: FileText,
  },
];

type SidebarMenuProps = {
  className?: string;
  itemClassName?: string;
  showText?: boolean;
  closeOnSelect?: boolean;
};

export default function SidebarMenu({
  className,
  itemClassName,
  showText = true,
  closeOnSelect = false,
}: SidebarMenuProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("menu-list", className)} aria-label="주요 메뉴">
      {menus.map((menu) => {
        const Icon = menu.icon;
        const isActive =
          pathname === menu.href ||
          (menu.href !== "/" && pathname.startsWith(menu.href));
        const linkClassName = cn("menu-card", isActive && "active", itemClassName);
        const linkBody = (
          <>
            <span className="menu-icon-wrap">
              <Icon size={18} />
            </span>
            {showText ? (
              <span className="menu-text">
                <span className="menu-title">{menu.title}</span>
              </span>
            ) : null}
          </>
        );

        if (closeOnSelect) {
          return (
            <SheetClose
              key={menu.href}
              render={<Link href={menu.href} />}
              className={linkClassName}
              aria-label={menu.title}
              title={menu.title}
            >
              {linkBody}
            </SheetClose>
          );
        }

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={linkClassName}
            aria-label={menu.title}
            title={menu.title}
          >
            {linkBody}
          </Link>
        );
      })}
    </nav>
  );
}
