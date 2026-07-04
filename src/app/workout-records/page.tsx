import Link from "next/link";
import { CalendarDays, ClipboardList, RotateCcw } from "lucide-react";

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
  const recentWeeks = [...weekStarts].reverse().slice(0, 8);

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <ClipboardList size={18} /> 인증 기록 관리
            </h2>
            <p className="member-page-subcopy">
              주차와 회원을 선택해 인증 기록을 조회하고, 날짜/회차/증빙 이미지를 바로 수정합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="panel admin-detail-panel">
        <div className="admin-detail-form">
          <div className="admin-form-notice">
            <strong>조회 조건을 바꾸면 아래 기록이 바로 해당 조건으로 정리됩니다.</strong>
            <span>최근 주차는 빠른 버튼으로, 오래된 주차는 셀렉트에서 선택하세요.</span>
          </div>

          <section className="admin-form-section">
            <div className="admin-form-section-head">
              <div className="admin-form-section-title-row">
                <h3>조회 조건</h3>
                <span className="admin-form-step">1</span>
              </div>
              <p>현재 조회 중인 주차와 회원 필터입니다.</p>
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

            <form method="get" className="admin-form-grid admin-form-grid-filter records-filter-compact">
              <label>
                주차
                <select name="week" defaultValue={selectedWeek}>
                  {[...weekStarts].reverse().map((weekStart) => (
                    <option key={weekStart} value={weekStart}>
                      {weekStart} ({getWeekNumber(weekStart)}주차)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                회원
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
                <Button variant="ghost" className="inline-btn" nativeButton={false} render={<Link href="/workout-records" />}>
                  <RotateCcw size={15} />
                  초기화
                </Button>
              </div>
            </form>

            <div className="week-chip-list compact-week-chip-list" aria-label="최근 주차 바로가기">
              {recentWeeks.map((weekStart) => {
                const active = weekStart === selectedWeek;
                const memberParam = selectedMemberId ? `&member=${selectedMemberId}` : "";
                return (
                  <Link
                    key={weekStart}
                    href={`/workout-records?week=${weekStart}${memberParam}`}
                    className={`week-chip ${active ? "active" : ""}`}
                  >
                    {weekStart}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="panel">
        <div className="section-head records-head">
          <h3>인증 기록</h3>
          <p className="weekly-exceptions-subcopy">{workouts.length}건 조회됨</p>
        </div>
        <WorkoutManageTable workouts={workouts} />
      </section>
    </div>
  );
}
