import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { WeeklyExceptionManager } from "@/components/weekly-exception-manager";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
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

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <CalendarX2 size={18} /> 주간 제외 관리
            </h2>
            <p className="member-page-subcopy">
              특정 주차에서 진행 체크를 제외할 회원을 선택하고, 이미 등록된 대상도 바로 해제할 수
              있습니다.
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
            <p>제외 처리를 적용할 기준 주차를 먼저 선택해 주세요.</p>
          </div>

          <div className="week-chip-list dashboard-week-chip-list">
            {[...weekStarts].reverse().map((weekStart) => (
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
