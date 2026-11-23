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
  const latestState = createState.submittedAt >= deleteState.submittedAt ? createState : deleteState;

  return (
    <>
      <section className="panel admin-detail-panel">
        <form action={createAction} className="admin-detail-form">
          <section className="admin-detail-form">
            <div className="admin-form-section-head">
              <div className="admin-form-section-title-row">
                <h3>{weekStart} 주차 제외 대상 등록</h3>
              </div>
              <p>회원과 사유를 입력하면 해당 주차의 목표/벌금 계산에서 제외됩니다.</p>
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

          {latestState.message ? (
            <p className={latestState.ok ? "admin-form-feedback" : "error"} role="status" aria-live="polite">{latestState.message}</p>
          ) : null}

          <div className="admin-form-actions">
            <Button type="submit" size="lg" disabled={createPending || availableMembers.length === 0}>
              {createPending ? "처리 중..." : "제외 처리"}
            </Button>
          </div>
        </form>
      </section>

      <section className="panel admin-detail-panel">
        <div className="admin-detail-form">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>등록된 제외 대상</h3>
              <span className="result-count">{exceptions.length}명</span>
            </div>
            <p>이미 제외된 회원은 아래 목록에서 바로 해제할 수 있습니다.</p>
          </div>

          {exceptions.length > 0 ? (
            <div className="table-scroll">
              <table className="table exception-table" aria-label={`${weekStart} 주차 제외 대상`}>
                <thead>
                  <tr><th scope="col">회원</th><th scope="col">제외 사유</th><th scope="col">관리</th></tr>
                </thead>
                <tbody>
                  {exceptions.map((item) => (
                    <tr key={`${item.member_id}-${item.week_start}`}>
                      <td>{item.members?.name ?? "-"}</td>
                      <td>{item.reason?.trim() || "사유 없음"}</td>
                      <td>
                        <form action={deleteAction}>
                          <input type="hidden" name="member_id" value={item.member_id} />
                          <input type="hidden" name="week_start" value={item.week_start} />
                          <Button type="submit" variant="outline" disabled={deletePending} aria-label={`${item.members?.name ?? "회원"} 제외 해제`}>
                            해제
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
              <div className="weekly-exceptions-empty">
                <p className="weekly-exceptions-subcopy">선택한 주차에 제외 처리된 회원이 없습니다.</p>
              </div>
          )}
        </div>
      </section>
    </>
  );
}
