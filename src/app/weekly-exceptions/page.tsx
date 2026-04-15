import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { WeeklyExceptionManager } from "@/components/weekly-exception-manager";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { COMMUNITY_START_WEEK, getCurrentWeekStart, listMembers, listWeeklyExceptions } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

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
      <section className="panel panel-highlight workouts-page-hero">
        <h2 className="title-with-icon">
          <CalendarX2 size={18} /> 주간 제외 관리
        </h2>
        <p className="weekly-exceptions-subcopy">
          특정 회원을 특정 주차의 진행 체크 분모에서 제외할 수 있습니다.
        </p>
      </section>

      <section className="panel">
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
