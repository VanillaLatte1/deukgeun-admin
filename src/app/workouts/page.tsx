import { ClipboardCheck } from "lucide-react";

import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { WorkoutEntryForm } from "@/components/workout-entry-form";
import {
  getCurrentWeekStart,
  listMembers,
  listWeeklyExceptions,
  listWorkoutSessionSlots,
} from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  const defaultWorkoutDate = new Date().toISOString().slice(0, 10);
  const currentWeekStart = getCurrentWeekStart();
  const [members, existingSessionSlots, weeklyExceptions] = await Promise.all([
    listMembers(),
    listWorkoutSessionSlots(),
    listWeeklyExceptions(currentWeekStart),
  ]);

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <ClipboardCheck size={18} /> 운동 인증 등록
            </h2>
            <p className="member-page-subcopy">
              회원 선택부터 인증 이미지 업로드까지 한 흐름으로 정리한 등록 화면입니다.
            </p>
          </div>
        </div>
      </section>

      <section className="panel admin-detail-panel">
        <WorkoutEntryForm
          members={members}
          defaultWorkoutDate={defaultWorkoutDate}
          existingSessionSlots={existingSessionSlots}
          excusedMemberIds={weeklyExceptions.map((item) => item.member_id)}
        />
      </section>
    </div>
  );
}
