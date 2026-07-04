"use client";

import { useState } from "react";

import { FormSelectField } from "@/components/form-select-field";
import type { SettlementPeriod } from "@/lib/settlement-period";

type MemberGoalSettlementFieldsProps = {
  settlementPeriod: SettlementPeriod;
  member?: {
    overall_goal_achieved: boolean | null;
    penalty_amount: number;
    june_goal_proof_achieved: boolean;
    june_goal_proof_date: string | null;
    june_goal_proof_note: string | null;
  } | null;
};

function getInitialFinalGoalValue(member: MemberGoalSettlementFieldsProps["member"]) {
  if (member?.overall_goal_achieved === null || member?.overall_goal_achieved === undefined) {
    return "false";
  }

  return member.overall_goal_achieved ? "true" : "false";
}

export function MemberGoalSettlementFields({
  settlementPeriod,
  member,
}: MemberGoalSettlementFieldsProps) {
  const [finalGoalValue, setFinalGoalValue] = useState(getInitialFinalGoalValue(member));
  const shouldShowSettlement = finalGoalValue === "false";

  return (
    <>
      <section className="member-form-section member-form-section-emphasis">
        <div className="member-form-section-head">
          <div className="member-form-section-title-row">
            <h3>최종 목표 판정</h3>
            <span className="member-form-step">3</span>
          </div>
          <p>목표의 세부 내용은 입력하지 않고, 최종 달성 여부와 본인 설정 벌금액만 저장합니다.</p>
        </div>

        <div className="member-form-grid member-form-grid-overall-status">
          <FormSelectField
            label="최종 목표 달성 여부"
            name="overall_goal_achieved"
            defaultValue={finalGoalValue}
            placeholder="미달성"
            options={[
              { value: "true", label: "달성" },
              { value: "false", label: "미달성" },
            ]}
            onValueChange={setFinalGoalValue}
          />
          <label>
            본인 설정 벌금액
            <input
              type="number"
              min={0}
              step={1000}
              name="penalty_amount"
              defaultValue={member?.penalty_amount ?? 100000}
              required
            />
          </label>
        </div>
      </section>

      {shouldShowSettlement ? (
        <section className="member-form-section">
          <div className="member-form-section-head">
            <div className="member-form-section-title-row">
              <h3>{settlementPeriod.shortLabel} 정산</h3>
              <span className="member-form-step">4</span>
            </div>
            <p>
              최종 목표 미달성 인원이 {settlementPeriod.proofMonthLabel} 안에 한 번이라도
              운동했는지 기록합니다.
            </p>
          </div>

          <div className="member-form-grid member-form-grid-settlement">
            <FormSelectField
              label={`${settlementPeriod.proofMonthLabel} 운동 증적`}
              name="june_goal_proof_achieved"
              defaultValue={member?.june_goal_proof_achieved ? "true" : "false"}
              options={[
                { value: "false", label: "없음" },
                { value: "true", label: "있음" },
              ]}
            />
            <label>
              증적 날짜
              <input
                type="date"
                name="june_goal_proof_date"
                min={settlementPeriod.proofStartsAt}
                max={settlementPeriod.proofEndsAt}
                defaultValue={member?.june_goal_proof_date ?? ""}
              />
            </label>
            <label className="span-3">
              증적 메모
              <textarea
                name="june_goal_proof_note"
                defaultValue={member?.june_goal_proof_note ?? ""}
                placeholder={`예: ${settlementPeriod.proofMonthLabel} 중 운동 참여 확인`}
                rows={3}
              />
            </label>
          </div>
        </section>
      ) : null}
    </>
  );
}
