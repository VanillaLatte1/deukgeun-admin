export type ProgressStatus = "complete" | "in_progress" | "excused";

export function getProgressStatus(done: number, target: number): ProgressStatus {
  if (target < 0) return "excused";
  if (target <= 0) return "in_progress";
  return done >= target ? "complete" : "in_progress";
}

export function statusLabel(status: ProgressStatus) {
  if (status === "complete") return "완료";
  if (status === "excused") return "제외";
  return "진행 중";
}
