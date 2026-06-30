import Link from "next/link";
import { CalendarDays, ClipboardList } from "lucide-react";

import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { WorkoutManageTable } from "@/components/workout-manage-table";
import { Button } from "@/components/ui/button";
import {
  COMMUNITY_START_WEEK,
  getCurrentWeekStart,
  listMembers,
  listWorkoutsForWeek,
} from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type WorkoutRecordsPageProps = {
  searchParams?: Promise<{ week?: string | string[]; member?: string | string[] }>;
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

export default async function WorkoutRecordsPage({ searchParams }: WorkoutRecordsPageProps) {
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

  const members = await listMembers();
  const requestedMemberRaw = Array.isArray(resolvedSearchParams.member)
    ? resolvedSearchParams.member[0]
    : resolvedSearchParams.member;
  const requestedMember = (requestedMemberRaw ?? "").trim();
  const selectedMemberId = members.some((member) => member.id === requestedMember)
    ? requestedMember
    : "";

  const workouts = await listWorkoutsForWeek(selectedWeek, selectedMemberId || undefined);

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <ClipboardList size={18} /> 인증 기록 관리
            </h2>
            <p className="member-page-subcopy">
              기준 주차와 회원 필터를 먼저 고른 뒤, 해당 주차의 인증 기록을 한 번에 관리합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="panel admin-detail-panel">
        <div className="admin-detail-form">
          <div className="admin-form-notice">
            <strong>조회 조건을 먼저 정하면 아래 테이블이 바로 갱신됩니다.</strong>
            <span>주차 선택 후 회원까지 좁혀보면 특정 회원 기록만 빠르게 점검할 수 있습니다.</span>
          </div>

          <section className="admin-form-section">
            <div className="admin-form-section-head">
              <div className="admin-form-section-title-row">
                <h3>기준 주차</h3>
                <span className="admin-form-step">1</span>
              </div>
              <p>현재 보고 싶은 인증 주차를 선택해 주세요.</p>
            </div>

            <div className="week-badge-wrap">
              <div className="week-badge">
                <span className="week-badge-row">
                  <CalendarDays size={16} />
                  <strong className="week-badge-date">{selectedWeek}</strong>
                </span>
                <span className="week-badge-sub">{getWeekNumber(selectedWeek)}주차 인증 내역</span>
              </div>
            </div>

            <div className="week-chip-list">
              {[...weekStarts].reverse().map((weekStart) => {
                const active = weekStart === selectedWeek;
                const memberParam = selectedMemberId ? `&member=${selectedMemberId}` : "";
                return (
                  <Link
                    key={weekStart}
                    href={`/workout-records?week=${weekStart}${memberParam}`}
                    className={`week-chip ${active ? "active" : ""}`}
                  >
                    {weekStart} ({getWeekNumber(weekStart)}주차)
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="admin-form-section">
            <div className="admin-form-section-head">
              <div className="admin-form-section-title-row">
                <h3>회원 필터</h3>
                <span className="admin-form-step">2</span>
              </div>
              <p>특정 회원만 보고 싶을 때만 선택해 주세요. 비워두면 전체 회원이 조회됩니다.</p>
            </div>

            <form method="get" className="admin-form-grid admin-form-grid-filter">
              <input type="hidden" name="week" value={selectedWeek} />

              <label>
                회원 선택
                <select name="member" defaultValue={selectedMemberId} aria-label="회원 선택">
                  <option value="">전체 회원</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-form-actions admin-form-actions-inline">
                <Button type="submit" variant="outline" className="inline-btn">
                  검색
                </Button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <section className="panel">
        <div className="section-head records-head">
          <h3>인증 기록</h3>
        </div>
        <WorkoutManageTable workouts={workouts} />
      </section>
    </div>
  );
}
