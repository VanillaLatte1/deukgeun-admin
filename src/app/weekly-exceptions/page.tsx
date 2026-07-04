import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { WeeklyExceptionManager } from "@/components/weekly-exception-manager";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { Button } from "@/components/ui/button";
import {
  COMMUNITY_START_WEEK,
  getCurrentWeekStart,
  listMembers,
  listWeeklyExceptions,
} from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type WeeklyExceptionsPageProps = {
  searchParams?: Promise<{
    week?: string | string[];
  }>;
};

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStartsFromCommunityToCurrent() {
  const start = parseYmd(COMMUNITY_START_WEEK);
  const end = parseYmd(getCurrentWeekStart());
  const weeks: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    weeks.push(toYmd(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function getWeekNumber(weekStart: string) {
  const start = parseYmd(COMMUNITY_START_WEEK);
  const current = parseYmd(weekStart);
  const diffMs = current.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;
}

export default async function WeeklyExceptionsPage({ searchParams }: WeeklyExceptionsPageProps) {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const weekStarts = getWeekStartsFromCommunityToCurrent();
  const requestedWeekRaw = Array.isArray(resolvedSearchParams.week)
    ? resolvedSearchParams.week[0]
    : resolvedSearchParams.week;
  const requestedWeek = (requestedWeekRaw ?? "").trim();
  const selectedWeek = weekStarts.includes(requestedWeek)
    ? requestedWeek
    : getCurrentWeekStart();

  const [members, exceptions] = await Promise.all([
    listMembers(),
    listWeeklyExceptions(selectedWeek),
  ]);
  const recentWeeks = [...weekStarts].reverse().slice(0, 8);

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <CalendarX2 size={18} /> 주간 제외 관리
            </h2>
            <p className="member-page-subcopy">
              특정 주차에서 목표/벌금 계산을 제외할 회원을 등록하고, 필요할 때 바로 해제합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="panel admin-detail-panel">
        <div className="admin-form-section">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>주차 선택</h3>
              <span className="admin-form-step">0</span>
            </div>
            <p>제외 처리를 적용할 기준 주차를 먼저 선택하세요.</p>
          </div>

          <form method="get" className="admin-form-grid admin-form-grid-filter records-filter-compact">
            <label>
              기준 주차
              <select name="week" defaultValue={selectedWeek}>
                {[...weekStarts].reverse().map((weekStart) => (
                  <option key={weekStart} value={weekStart}>
                    {weekStart} ({getWeekNumber(weekStart)}주차)
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-form-actions admin-form-actions-inline">
              <Button type="submit" className="inline-btn form-action-button">
                주차 변경
              </Button>
            </div>
          </form>

          <div className="week-chip-list compact-week-chip-list">
            {recentWeeks.map((weekStart) => (
              <Link
                key={weekStart}
                href={`/weekly-exceptions?week=${weekStart}`}
                className={`week-chip ${weekStart === selectedWeek ? "active" : ""}`}
              >
                {weekStart}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WeeklyExceptionManager
        weekStart={selectedWeek}
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
        }))}
        exceptions={exceptions}
      />
    </div>
  );
}
