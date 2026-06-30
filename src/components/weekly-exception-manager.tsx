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
      <section className="panel admin-detail-panel">
        <form action={createAction} className="admin-detail-form">
          <div className="admin-form-notice">
            <strong>{weekStart} 주차의 제외 대상을 여기서 관리합니다.</strong>
            <span>해당 주차에서 진행 체크를 빼야 하는 회원만 선택해서 등록해 주세요.</span>
          </div>

          <section className="admin-form-section">
            <div className="admin-form-section-head">
              <div className="admin-form-section-title-row">
                <h3>제외 대상 등록</h3>
                <span className="admin-form-step">1</span>
              </div>
              <p>회원과 사유를 입력하면 바로 해당 주차 제외 처리에 반영됩니다.</p>
            </div>

            <input type="hidden" name="week_start" value={weekStart} />

            <div className="admin-form-grid admin-form-grid-exception">
              <label>
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
                제외 사유
                <input type="text" name="reason" placeholder="예: 출장, 감기, 개인 일정" />
              </label>
            </div>
          </section>

          {feedback ? (
            <p className={isSuccess ? "admin-form-feedback" : "error"}>{feedback}</p>
          ) : null}

          <div className="admin-form-actions">
            <Button type="submit" size="lg" disabled={createPending || availableMembers.length === 0}>
              {createPending ? "처리 중..." : "제외 처리"}
            </Button>
          </div>
        </form>
      </section>

      <section className="panel admin-detail-panel">
        <div className="admin-form-section">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>등록된 제외 대상</h3>
              <span className="admin-form-step">{exceptions.length}</span>
            </div>
            <p>이미 제외된 회원은 아래 목록에서 바로 해제할 수 있습니다.</p>
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
                      <Button type="submit" variant="outline" disabled={deletePending}>
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
        </div>
      </section>
    </>
  );
}
