"use client";

import { useActionState, useMemo } from "react";

import {
  deleteWeeklyExceptionAction,
  type WeeklyExceptionActionState,
  upsertWeeklyExceptionAction,
} from "@/app/weekly-exceptions/actions";
import { Button } from "@/components/ui/button";
import type { WeeklyException } from "@/lib/data";

type MemberOption = {
  id: string;
  name: string;
};

type WeeklyExceptionManagerProps = {
  members: MemberOption[];
  weekStart: string;
  exceptions: WeeklyException[];
};

const initialState: WeeklyExceptionActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

export function WeeklyExceptionManager({
  members,
  weekStart,
  exceptions,
}: WeeklyExceptionManagerProps) {
  const [createState, createAction, createPending] = useActionState(
    upsertWeeklyExceptionAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteWeeklyExceptionAction,
    initialState,
  );

  const usedMemberIds = useMemo(
    () => new Set(exceptions.map((item) => item.member_id)),
    [exceptions],
  );
  const availableMembers = useMemo(
    () => members.filter((member) => !usedMemberIds.has(member.id)),
    [members, usedMemberIds],
  );
  const feedback = createState.message || deleteState.message;
  const isSuccess = createState.ok || deleteState.ok;

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h3>제외 등록</h3>
            <p className="weekly-exceptions-subcopy">
              {weekStart} 주차에서 진행 체크를 빼야 하는 회원을 등록합니다.
            </p>
          </div>
        </div>

        <form action={createAction} className="form-grid weekly-exception-form">
          <input type="hidden" name="week_start" value={weekStart} />

          <label className="weekly-exception-member-field">
            제외 회원
            <select name="member_id" required defaultValue="">
              <option value="" disabled>
                회원 선택
              </option>
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            사유
            <input type="text" name="reason" placeholder="예: 허리 통증, 출장, 감기" />
          </label>

          <Button type="submit" disabled={createPending || availableMembers.length === 0}>
            {createPending ? "처리 중..." : "제외 처리"}
          </Button>
        </form>

        {feedback ? (
          <p className={isSuccess ? "weekly-exceptions-subcopy" : "error"}>{feedback}</p>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3>등록된 제외 회원</h3>
            <p className="weekly-exceptions-subcopy">
              이미 제외 처리된 회원은 여기에서 바로 해제할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="dashboard-status-stack">
          {exceptions.length > 0 ? (
            exceptions.map((item) => (
              <div className="dashboard-status-card" key={`${item.member_id}-${item.week_start}`}>
                <div className="dashboard-status-head">
                  <strong>{item.members?.name ?? "-"}</strong>
                  <form action={deleteAction}>
                    <input type="hidden" name="member_id" value={item.member_id} />
                    <input type="hidden" name="week_start" value={item.week_start} />
                    <Button type="submit" disabled={deletePending}>
                      해제
                    </Button>
                  </form>
                </div>
                <p className="dashboard-status-copy">{item.reason?.trim() || "사유 없음"}</p>
              </div>
            ))
          ) : (
            <div className="weekly-exceptions-empty">
              <p className="weekly-exceptions-subcopy">이번 주 제외 처리된 회원이 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
