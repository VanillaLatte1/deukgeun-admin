export const WORKOUT_TYPE_GENERAL = "general";
export const WORKOUT_TYPE_RUNNING = "running";

export type WorkoutType = typeof WORKOUT_TYPE_GENERAL | typeof WORKOUT_TYPE_RUNNING;

export type WorkoutPolicy = {
  type: WorkoutType;
  label: string;
  defaultDurationMinutes: number;
  minimumValidMinutes: number;
  requiredImageCount: 1 | 2;
};

export const WORKOUT_POLICIES: Record<WorkoutType, WorkoutPolicy> = {
  [WORKOUT_TYPE_GENERAL]: {
    type: WORKOUT_TYPE_GENERAL,
    label: "일반 운동",
    defaultDurationMinutes: 60,
    minimumValidMinutes: 1,
    requiredImageCount: 2,
  },
  [WORKOUT_TYPE_RUNNING]: {
    type: WORKOUT_TYPE_RUNNING,
    label: "러닝",
    defaultDurationMinutes: 30,
    minimumValidMinutes: 30,
    requiredImageCount: 1,
  },
};

export function toWorkoutType(value: string): WorkoutType {
  return value === WORKOUT_TYPE_RUNNING ? WORKOUT_TYPE_RUNNING : WORKOUT_TYPE_GENERAL;
}

export function getWorkoutPolicy(value: string): WorkoutPolicy {
  return WORKOUT_POLICIES[toWorkoutType(value)];
}
