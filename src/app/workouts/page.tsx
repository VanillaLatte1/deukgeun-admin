import { ClipboardCheck } from "lucide-react";

import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { WorkoutEntryForm } from "@/components/workout-entry-form";
import { getCurrentWeekStart, listMembers, listWeeklyExceptions, listWorkoutSessionSlots } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

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
      <section className="panel panel-highlight workouts-page-hero">
        <h2 className="title-with-icon">
          <ClipboardCheck size={18} /> 운동 인증 등록
        </h2>
      </section>

      <section className="panel workouts-page-form">
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
