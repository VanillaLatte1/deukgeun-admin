export type HalfYearKey = "1" | "2";

export type SettlementPeriod = {
  year: number;
  half: HalfYearKey;
  label: string;
  shortLabel: string;
  startsAt: string;
  endsAt: string;
  workoutProofEndsAt: string;
  proofMonth: number;
  proofMonthLabel: string;
  proofStartsAt: string;
  proofEndsAt: string;
  finalDeadline: string;
};

const ACTIVE_SETTLEMENT_YEAR = 2026;
const ACTIVE_SETTLEMENT_HALF: HalfYearKey = "1";
const FIRST_HALF_2026_WORKOUT_PROOF_END = "2026-06-27";

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getSettlementPeriod(year: number, half: HalfYearKey): SettlementPeriod {
  const isFirstHalf = half === "1";
  const shortLabel = isFirstHalf ? "상반기" : "하반기";
  const proofMonth = isFirstHalf ? 6 : 12;
  const proofMonthLastDay = lastDayOfMonth(year, proofMonth);
  const startsAt = isFirstHalf ? ymd(year, 1, 1) : ymd(year, 7, 1);
  const endsAt = isFirstHalf ? ymd(year, 6, 30) : ymd(year, 12, 31);
  const workoutProofEndsAt =
    year === 2026 && isFirstHalf ? FIRST_HALF_2026_WORKOUT_PROOF_END : endsAt;

  return {
    year,
    half,
    label: `${year}년 ${shortLabel}`,
    shortLabel,
    startsAt,
    endsAt,
    workoutProofEndsAt,
    proofMonth,
    proofMonthLabel: `${proofMonth}월`,
    proofStartsAt: ymd(year, proofMonth, 1),
    proofEndsAt: ymd(year, proofMonth, proofMonthLastDay),
    finalDeadline: ymd(year, proofMonth, proofMonthLastDay),
  };
}

export function getActiveSettlementPeriod() {
  return getSettlementPeriod(ACTIVE_SETTLEMENT_YEAR, ACTIVE_SETTLEMENT_HALF);
}

export function getSettlementPeriodForDate(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const half: HalfYearKey = baseDate.getMonth() < 6 ? "1" : "2";
  return getSettlementPeriod(year, half);
}

export function formatKoreanMonthDay(ymdText: string) {
  const [, month, day] = ymdText.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}
