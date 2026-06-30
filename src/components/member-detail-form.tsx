import { FormSelectField } from "@/components/form-select-field";
import { Button } from "@/components/ui/button";

type MemberDetailFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  member?: {
    id: string;
    name: string;
    gender: string | null;
    overall_goal_title: string | null;
    overall_goal_value: string | null;
    overall_goal_achieved: boolean | null;
    penalty_amount: number;
    june_goal_proof_achieved: boolean;
    june_goal_proof_date: string | null;
    june_goal_proof_note: string | null;
  } | null;
  goal?: {
    target_sessions: number;
    target_minutes: number;
  } | null;
};

export function MemberDetailForm({
  action,
  submitLabel,
  member,
  goal,
}: MemberDetailFormProps) {
  return (
    <form action={action} className="member-detail-form">
      {member ? <input type="hidden" name="member_id" value={member.id} /> : null}

      <div className="member-form-notice">
        <strong>전체 항목을 보기 좋게 정리해 입력할 수 있습니다.</strong>
        <span>기본 정보, 주간 목표, 전체 목표를 순서대로 설정해 주세요.</span>
      </div>

      <section className="member-form-section">
        <div className="member-form-section-head">
          <div className="member-form-section-title-row">
            <h3>기본 정보</h3>
            <span className="member-form-step">1</span>
          </div>
          <p>회원명과 성별 같은 기본 프로필을 입력합니다.</p>
        </div>

        <div className="member-form-grid member-form-grid-basic">
          <label>
            이름
            <input type="text" name="name" required defaultValue={member?.name ?? ""} />
          </label>
          <FormSelectField
            label="성별"
            name="gender"
            defaultValue={member?.gender ?? undefined}
            placeholder="선택"
            options={[
              { value: "M", label: "남성" },
              { value: "F", label: "여성" },
            ]}
          />
        </div>
      </section>

      <section className="member-form-section">
        <div className="member-form-section-head">
          <div className="member-form-section-title-row">
            <h3>주간 목표</h3>
            <span className="member-form-step">2</span>
          </div>
          <p>운영 기준이 되는 주간 운동 횟수와 기본 운동 시간을 설정합니다.</p>
        </div>

        <div className="member-form-grid member-form-grid-weekly">
          <FormSelectField
            label="주간 목표 횟수"
            name="target_sessions"
            defaultValue={String(goal?.target_sessions ?? 2)}
            options={[
              { value: "1", label: "1회" },
              { value: "2", label: "2회" },
              { value: "3", label: "3회" },
              { value: "4", label: "4회" },
              { value: "5", label: "5회" },
            ]}
          />
          <label>
            기본 운동 시간(분)
            <input
              type="number"
              min={0}
              name="target_minutes"
              defaultValue={goal?.target_minutes ?? 60}
              required
            />
          </label>
        </div>
      </section>

      <section className="member-form-section member-form-section-emphasis">
        <div className="member-form-section-head">
          <div className="member-form-section-title-row">
            <h3>전체 목표</h3>
            <span className="member-form-step">3</span>
          </div>
          <p>체지방 감량, 골격근량 증가처럼 개인 최종 목표와 도달 상태를 관리합니다.</p>
        </div>

        <div className="member-form-grid member-form-grid-overall">
          <label>
            전체 목표 항목
            <input
              type="text"
              name="overall_goal_title"
              defaultValue={member?.overall_goal_title ?? ""}
              placeholder="예: 체지방량 감량"
            />
          </label>
          <label>
            전체 목표 수치
            <input
              type="text"
              name="overall_goal_value"
              defaultValue={member?.overall_goal_value ?? ""}
              placeholder="예: -3kg"
            />
          </label>
          <FormSelectField
            label="최종 목표 도달 여부"
            name="overall_goal_achieved"
            defaultValue={
              member?.overall_goal_achieved === null || member?.overall_goal_achieved === undefined
                ? ""
                : member.overall_goal_achieved
                  ? "true"
                  : "false"
            }
            placeholder="미설정"
            options={[
              { value: "true", label: "도달" },
              { value: "false", label: "미도달" },
            ]}
            isClearable
          />
        </div>
      </section>

      <section className="member-form-section">
        <div className="member-form-section-head">
          <div className="member-form-section-title-row">
            <h3>상반기 정산</h3>
            <span className="member-form-step">4</span>
          </div>
          <p>본인 설정 벌금액과 6월 목표 도달 증적을 관리합니다.</p>
        </div>

        <div className="member-form-grid member-form-grid-settlement">
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
          <FormSelectField
            label="6월 목표 도달 증적"
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
              min="2026-06-01"
              max="2026-06-30"
              defaultValue={member?.june_goal_proof_date ?? ""}
            />
          </label>
          <label className="span-3">
            증적 메모
            <textarea
              name="june_goal_proof_note"
              defaultValue={member?.june_goal_proof_note ?? ""}
              placeholder="예: 6월 인바디 측정 결과 목표 수치 도달"
              rows={3}
            />
          </label>
        </div>
      </section>

      <div className="member-form-actions">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
