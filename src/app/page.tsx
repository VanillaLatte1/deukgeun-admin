import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CircleDashed,
  Clock3,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { COMMUNITY_START_WEEK, getCurrentWeekStart, getDashboardData } from "@/lib/data";
import { getProgressStatus, statusLabel, type ProgressStatus } from "@/lib/progress";
import { isSupabaseReady } from "@/lib/supabase-server";
import { getWorkoutPolicy } from "@/lib/workout-policy";

type SortKey = "name_asc" | "name_desc" | "target_desc" | "done_desc";

type HomeProps = {
  searchParams?: Promise<{
    week?: string | string[];
    sort?: string | string[];
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

function toSortKey(raw: string): SortKey {
  if (raw === "name_desc" || raw === "target_desc" || raw === "done_desc") {
    return raw;
  }
  return "name_asc";
}

export default async function Home({ searchParams }: HomeProps) {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel />;
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

  const sortRaw = Array.isArray(resolvedSearchParams.sort)
    ? resolvedSearchParams.sort[0]
    : resolvedSearchParams.sort;
  const selectedSort = toSortKey((sortRaw ?? "").trim());

  const data = await getDashboardData(selectedWeek);

  const sortedMemberStats = [...data.memberStats].sort((a, b) => {
    if (selectedSort === "name_desc") {
      return b.member.name.localeCompare(a.member.name, "ko");
    }
    if (selectedSort === "target_desc") {
      return b.targetSessions - a.targetSessions;
    }
    if (selectedSort === "done_desc") {
      return b.doneSessions - a.doneSessions;
    }
    return a.member.name.localeCompare(b.member.name, "ko");
  });

  const completeCount = data.memberStats.filter(
    (item) => getProgressStatus(item.doneSessions, item.targetSessions) === "complete",
  ).length;
  const inProgressCount = data.memberStats.filter(
    (item) => getProgressStatus(item.doneSessions, item.targetSessions) === "in_progress",
  ).length;
  const completeMembers = data.memberStats
    .filter((item) => getProgressStatus(item.doneSessions, item.targetSessions) === "complete")
    .map((item) => item.member.name);
  const inProgressMembers = data.memberStats
    .filter((item) => getProgressStatus(item.doneSessions, item.targetSessions) === "in_progress")
    .map((item) => item.member.name);
  const recentCompact = data.recent.slice(0, 6);
  const completionRate = data.totals.goals > 0
    ? Math.round((completeCount / data.totals.goals) * 100)
    : 0;

  return (
    <div className="page-stack dashboard-page">
      <section className="dashboard-hero">
        <article className="dashboard-hero-main">
          <span className="dashboard-kicker">Dashboard Overview</span>
          <h2>메인 대시보드</h2>
          <p className="dashboard-hero-copy">
            이번 주 운동 진행 현황과 최근 인증 흐름을 한 화면에서 빠르게 확인할 수 있어요.
          </p>
          <div className="dashboard-week-row">
            <div className="dashboard-week-card">
              <span className="dashboard-week-icon">
                <CalendarDays size={16} />
              </span>
              <div>
                <strong>{selectedWeek}</strong>
                <p>{getWeekNumber(selectedWeek)}주차 운영 현황</p>
              </div>
            </div>
            <div className="dashboard-rate-card">
              <span className="dashboard-week-icon alt">
                <TrendingUp size={16} />
              </span>
              <div>
                <strong>{completionRate}%</strong>
                <p>완료 전환율</p>
              </div>
            </div>
          </div>
          <div className="week-chip-list dashboard-week-chip-list">
            {[...weekStarts].reverse().map((weekStart) => {
              const active = weekStart === selectedWeek;
              return (
                <Link
                  key={weekStart}
                  href={`/?week=${weekStart}&sort=${selectedSort}`}
                  className={`week-chip ${active ? "active" : ""}`}
                >
                  {weekStart} ({getWeekNumber(weekStart)}주차)
                </Link>
              );
            })}
          </div>
        </article>

        <article className="dashboard-hero-side">
          <div className="dashboard-side-top">
            <span className="dashboard-mini-badge">
              <Sparkles size={14} /> Weekly Snapshot
            </span>
            <strong>{data.totals.workouts}</strong>
            <p>이번 주 인증 건수</p>
          </div>
          <div className="dashboard-side-metrics">
            <div>
              <span>완료</span>
              <strong>{completeCount}명</strong>
            </div>
            <div>
              <span>진행 중</span>
              <strong>{inProgressCount}명</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <p className="dashboard-stat-label">
            <Users size={16} /> 총 등록 회원
          </p>
          <strong>{data.totals.members}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p className="dashboard-stat-label">
            <Target size={16} /> 목표 설정 회원
          </p>
          <strong>{data.totals.goals}</strong>
        </article>
        <article className="dashboard-stat-card accent">
          <p className="dashboard-stat-label">
            <Activity size={16} /> 이번 주 인증
          </p>
          <strong>{data.totals.workouts}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p className="dashboard-stat-label">
            <Clock3 size={16} /> 누적 운동 시간(분)
          </p>
          <strong>{data.totals.minutes}</strong>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-panel-kicker">Progress Table</span>
              <h3>회원별 달성 현황</h3>
            </div>
            <div className="section-head-actions">
              <div className="sort-chip-list">
                <Link
                  href={`/?week=${selectedWeek}&sort=name_asc`}
                  className={`sort-chip ${selectedSort === "name_asc" ? "active" : ""}`}
                >
                  이름순
                </Link>
                <Link
                  href={`/?week=${selectedWeek}&sort=done_desc`}
                  className={`sort-chip ${selectedSort === "done_desc" ? "active" : ""}`}
                >
                  달성 많은순
                </Link>
                <Link
                  href={`/?week=${selectedWeek}&sort=target_desc`}
                  className={`sort-chip ${selectedSort === "target_desc" ? "active" : ""}`}
                >
                  목표 높은순
                </Link>
              </div>
            </div>
          </div>
          <table className="table dashboard-table">
            <thead>
              <tr>
                <th>회원</th>
                <th>목표 회차</th>
                <th>완료 회차</th>
                <th>기본 운동 시간(분)</th>
                <th>누적 운동 시간(분)</th>
                <th>진행 상태</th>
              </tr>
            </thead>
            <tbody>
              {sortedMemberStats.map((item) => {
                const status = getProgressStatus(item.doneSessions, item.targetSessions);
                return (
                  <tr key={item.member.id}>
                    <td>{item.member.name}</td>
                    <td>{item.targetSessions}</td>
                    <td>{item.doneSessions}</td>
                    <td>{item.targetMinutes}</td>
                    <td>{item.doneMinutes}</td>
                    <td>
                      <span className={`badge status-${status}`}>{statusLabel(status)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>

        <div className="dashboard-side-grid">
          <article className="dashboard-panel dashboard-summary-panel">
            <div className="dashboard-panel-head">
              <div>
                <span className="dashboard-panel-kicker">Status Overview</span>
                <h3>전체 인원 현황</h3>
              </div>
            </div>
            <div className="dashboard-status-stack">
              <div className="dashboard-status-card">
                <div className="dashboard-status-head">
                  <p className="muted stat-head">
                    <BadgeCheck size={15} /> 완료
                  </p>
                  <strong>{completeCount}명</strong>
                </div>
                <p className="dashboard-status-copy">
                  {completeMembers.length > 0 ? completeMembers.join(", ") : "해당 회원이 없습니다."}
                </p>
              </div>
              <div className="dashboard-status-card">
                <div className="dashboard-status-head">
                  <p className="muted stat-head">
                    <CircleDashed size={15} /> 진행 중
                  </p>
                  <strong>{inProgressCount}명</strong>
                </div>
                <p className="dashboard-status-copy">
                  {inProgressMembers.length > 0
                    ? inProgressMembers.join(", ")
                    : "해당 회원이 없습니다."}
                </p>
              </div>
            </div>
          </article>

          <article className="dashboard-panel dashboard-recent-panel">
            <div className="dashboard-panel-head">
              <div>
                <span className="dashboard-panel-kicker">Recent Activity</span>
                <h3>최근 인증 처리 내역</h3>
              </div>
            </div>
            <div className="recent-compact dashboard-recent-list">
              {recentCompact.map((workout) => {
                const policy = getWorkoutPolicy(workout.exercise_type);
                const status: ProgressStatus =
                  workout.duration_minutes >= policy.minimumValidMinutes
                    ? "complete"
                    : "in_progress";
                return (
                  <div className="recent-compact-item dashboard-recent-item" key={workout.id}>
                    <p className="recent-compact-top">
                      <strong>{workout.members?.name ?? "-"}</strong>
                      <span>{workout.workout_date}</span>
                    </p>
                    <p className="recent-compact-meta">
                      {workout.session_no}회 / {workout.duration_minutes}분
                      <span className={`badge status-${status}`}>{statusLabel(status)}</span>
                    </p>
                  </div>
                );
              })}
              {recentCompact.length === 0 ? (
                <p className="muted">표시할 인증 내역이 없습니다.</p>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
