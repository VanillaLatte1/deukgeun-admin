import { FileText, Landmark, Receipt, Target } from "lucide-react";

import { PenaltyDocumentFilterForm } from "@/components/penalty-document-filter-form";
import { getPenaltyDocumentData, WEEKLY_SHORTFALL_FINE_AMOUNT } from "@/lib/data";
import { getActiveSettlementPeriod, type HalfYearKey } from "@/lib/settlement-period";

type PenaltyDocumentsPageProps = {
  searchParams?: Promise<{
    year?: string | string[];
    half?: string | string[];
    weekStart?: string | string[];
    member?: string | string[];
  }>;
};

const FIXED_DEPOSIT_ACCOUNT = "3333349503041 카카오뱅크 모임통장";

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function toSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function toHalfYear(value?: string): HalfYearKey {
  return value === "2" ? "2" : "1";
}

function formatIssueDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatWeekStarts(weekStarts: string[]) {
  return weekStarts.length > 0 ? weekStarts.join(", ") : "없음";
}

export default async function PenaltyDocumentsPage({
  searchParams,
}: PenaltyDocumentsPageProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const activeSettlementPeriod = getActiveSettlementPeriod();
  const defaultHalf: HalfYearKey = activeSettlementPeriod.half;
  const resolvedSearchParams = (await searchParams) ?? {};

  const yearParam = Number(toSingleValue(resolvedSearchParams.year) ?? activeSettlementPeriod.year);
  const selectedYear = Number.isFinite(yearParam) ? yearParam : currentYear;
  const selectedHalf = toHalfYear(toSingleValue(resolvedSearchParams.half) ?? defaultHalf);
  const requestedWeekStart = toSingleValue(resolvedSearchParams.weekStart);
  const selectedAccount = FIXED_DEPOSIT_ACCOUNT;

  const { range, weekStarts, summaries } = await getPenaltyDocumentData(
    selectedYear,
    selectedHalf,
    requestedWeekStart,
  );

  const selectedMemberId =
    toSingleValue(resolvedSearchParams.member) ?? summaries[0]?.member.id ?? "";
  const selectedSummary =
    summaries.find((item) => item.member.id === selectedMemberId) ?? summaries[0] ?? null;
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="page-stack penalty-documents-page">
      <section className="penalty-hero print-hidden">
        <div>
          <span className="dashboard-panel-kicker">Penalty Documents</span>
          <h2>벌금 문서 출력</h2>
          <p className="weekly-exceptions-subcopy">
            반기와 기준 주차를 선택하면 해당 주차까지의 누적 결과로 벌금 고지서를 만들 수 있습니다.
          </p>
        </div>
      </section>

      <section className="panel print-hidden">
        <div className="section-head">
          <div>
            <h3>문서 설정</h3>
            <p className="weekly-exceptions-subcopy">
              기준 주차와 회원을 설정하면 공문 형식의 벌금 고지서를 출력할 수 있습니다.
            </p>
          </div>
        </div>

        <PenaltyDocumentFilterForm
          years={years}
          selectedYear={selectedYear}
          selectedHalf={selectedHalf}
          weekStarts={weekStarts}
          selectedWeekStart={range.selectedWeekStart}
          members={summaries.map((summary) => ({
            id: summary.member.id,
            name: summary.member.name,
          }))}
          selectedMemberId={selectedSummary?.member.id ?? ""}
          selectedAccount={selectedAccount}
        />
      </section>

      {selectedSummary ? (
        <section className="penalty-document-shell">
          <article className="penalty-document">
            <div className="penalty-watermark" aria-hidden="true">
              <img src="/logo.png" alt="" />
            </div>

            <header className="penalty-document-head">
              <div className="penalty-doc-mark">
                <FileText size={18} />
                벌금 고지서
              </div>
              <h1>{selectedSummary.member.name} 회원 벌금 정산 문서</h1>
              <p>
                {range.label} 기준 {range.selectedWeekStart} 주차까지의 운동 인증 결과를 기준으로 작성한 벌금 내역입니다.
              </p>
            </header>

            <div className="penalty-meta-grid">
              <div className="penalty-meta-item">
                <span>문서 발행일</span>
                <strong>{formatIssueDate(currentDate)}</strong>
              </div>
              <div className="penalty-meta-item penalty-meta-item-wide">
                <span>기간</span>
                <strong>
                  {range.from} ~ {range.to}
                </strong>
              </div>
            </div>

            <div className="penalty-summary-grid">
              <div className="penalty-summary-card">
                <span>
                  <Target size={16} /> 목표 횟수
                </span>
                <strong>
                  주 {selectedSummary.weeklyTargetSessions}회 / 총 {selectedSummary.targetSessionsTotal}회
                </strong>
              </div>
              <div className="penalty-summary-card">
                <span>
                  <Receipt size={16} /> 미달성 주간
                </span>
                <strong>{selectedSummary.shortfallWeeks}주</strong>
              </div>
              <div className="penalty-summary-card">
                <span>
                  <Landmark size={16} /> 벌금 총액
                </span>
                <strong>{formatCurrency(selectedSummary.totalFineAmount)}</strong>
              </div>
            </div>

            <section className="penalty-facts-grid">
              <article className="penalty-fact-card">
                <span>운동 인증 횟수</span>
                <strong>{selectedSummary.completedSessionsTotal}회</strong>
              </article>
              <article className="penalty-fact-card">
                <span>주간 제외 처리 주수</span>
                <strong>{selectedSummary.excusedWeeks}주</strong>
              </article>
            </section>

            <table className="penalty-table">
              <tbody>
                <tr>
                  <th>목표 횟수</th>
                  <td>
                    주간 목표 {selectedSummary.weeklyTargetSessions}회 / 누적 목표 총{" "}
                    {selectedSummary.targetSessionsTotal}회
                  </td>
                </tr>
                <tr>
                  <th>미달성 주간</th>
                  <td>
                    총 {selectedSummary.shortfallWeeks}주
                    <span className="penalty-table-note">
                      미달성 주차: {formatWeekStarts(selectedSummary.shortfallWeekStarts)}
                    </span>
                    <span className="penalty-table-note">
                      주간 벌금 {formatCurrency(WEEKLY_SHORTFALL_FINE_AMOUNT)} x {selectedSummary.shortfallWeeks}주 ={" "}
                      {formatCurrency(selectedSummary.weeklyFineAmount)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>벌금 총액</th>
                  <td>{formatCurrency(selectedSummary.totalFineAmount)}</td>
                </tr>
                <tr>
                  <th>최종 목표 달성 여부</th>
                  <td>
                    {selectedSummary.finalGoalAchieved ? "달성" : "미달성"}
                    <span className="penalty-table-note">
                      본인 설정 벌금 {formatCurrency(selectedSummary.penaltyAmount)} x{" "}
                      {formatRate(selectedSummary.finalFineRate)} ={" "}
                      {formatCurrency(selectedSummary.finalFineAmount)}
                    </span>
                    <span className="penalty-table-note">
                      정산 기준: {selectedSummary.finalFineReason}
                    </span>
                    {selectedSummary.hasJuneGoalProof ? (
                      <span className="penalty-table-note">
                        {range.settlementPeriod.proofMonthLabel} 운동 증적일:{" "}
                        {selectedSummary.juneGoalProofDate ?? "날짜 미기입"}
                      </span>
                    ) : null}
                  </td>
                </tr>
                <tr>
                  <th>입금 계좌</th>
                  <td>{selectedAccount}</td>
                </tr>
              </tbody>
            </table>

            <p className="penalty-notice-line">
              득근둑근 운영 지침 및 모임 기준에 따라 반기 벌금을 고지합니다.
            </p>

            <section className="penalty-signoff">
              <div className="penalty-signoff-title">
                <strong>득근둑근</strong>
                <span>운영진</span>
              </div>
              <img className="penalty-stamp" src="/sign.png" alt="득근둑근 운영진 직인" />
            </section>
          </article>
        </section>
      ) : (
        <section className="panel">
          <div className="weekly-exceptions-empty">
            <p className="weekly-exceptions-subcopy">출력할 회원 데이터가 없습니다.</p>
          </div>
        </section>
      )}
    </div>
  );
}
