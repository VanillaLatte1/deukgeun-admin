import { inferWorkoutDurationFromTimestamps } from "@/lib/workout-timestamp-ai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const workoutDate = String(formData.get("workout_date") ?? "").trim();
    const startImage = formData.get("start_image");
    const endImage = formData.get("end_image");

    if (!workoutDate) {
      return Response.json({ ok: false, message: "운동 날짜를 먼저 선택해 주세요." }, { status: 400 });
    }

    if (!(startImage instanceof File) || startImage.size === 0) {
      return Response.json({ ok: false, message: "시작 이미지를 먼저 올려 주세요." }, { status: 400 });
    }

    if (!(endImage instanceof File) || endImage.size === 0) {
      return Response.json({ ok: false, message: "종료 이미지를 먼저 올려 주세요." }, { status: 400 });
    }

    const result = await inferWorkoutDurationFromTimestamps(startImage, endImage, workoutDate);
    if (!result) {
      return Response.json(
        {
          ok: false,
          message: "타임스탬프를 읽지 못했습니다. 운동 시간을 직접 입력해 주세요.",
        },
        { status: 422 },
      );
    }

    return Response.json({
      ok: true,
      durationMinutes: result.durationMinutes,
      startText: result.startTimestamp.sourceText,
      endText: result.endTimestamp.sourceText,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "시간 계산 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
