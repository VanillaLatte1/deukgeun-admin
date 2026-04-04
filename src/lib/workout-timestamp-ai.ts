import "server-only";

type TimestampReading = {
  date: string | null;
  time: string | null;
  confidence: number | null;
};

type TimestampExtractionResult = {
  start: TimestampReading;
  end: TimestampReading;
};

type ParsedTimestamp = {
  date: Date;
  sourceText: string;
};

const KOREAN_AM = "\uC624\uC804";
const KOREAN_PM = "\uC624\uD6C4";

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function normalizeTimestampText(text: string) {
  return text
    .replace(/\u200b/g, "")
    .replace(/[OoQD]/g, "0")
    .replace(/[IiLl|!]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[Zz]/g, "2")
    .replace(/[Bb]/g, "8")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidClock(hour: number, minute: number) {
  return Number.isFinite(hour) && Number.isFinite(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function toDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  ampm?: string | null,
) {
  let resolvedHour = hour;
  const upperAmPm = ampm?.toUpperCase();

  if (upperAmPm === "PM" && resolvedHour < 12) resolvedHour += 12;
  if (upperAmPm === "AM" && resolvedHour === 12) resolvedHour = 0;

  if (!isValidClock(resolvedHour, minute)) {
    return null;
  }

  const date = new Date(year, month - 1, day, resolvedHour, minute, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimestamp(dateText: string | null, timeText: string | null, fallbackDate: string): ParsedTimestamp | null {
  const normalizedDate = normalizeTimestampText(dateText ?? "");
  const normalizedTime = normalizeTimestampText(timeText ?? "");
  const combinedText = [normalizedDate, normalizedTime].filter(Boolean).join(" ").trim();
  const [fallbackYear, fallbackMonth, fallbackDay] = fallbackDate.split("-").map(Number);

  if (!fallbackYear || !fallbackMonth || !fallbackDay) {
    return null;
  }

  let year = fallbackYear;
  let month = fallbackMonth;
  let day = fallbackDay;

  const dateSource = combinedText || normalizedDate;
  if (dateSource) {
    const fullDateMatch =
      dateSource.match(/(20\d{2})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})/) ??
      dateSource.match(/(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](20\d{2})/);

    if (fullDateMatch) {
      if (fullDateMatch[1]?.startsWith("20")) {
        year = Number(fullDateMatch[1]);
        month = Number(fullDateMatch[2]);
        day = Number(fullDateMatch[3]);
      } else {
        month = Number(fullDateMatch[1]);
        day = Number(fullDateMatch[2]);
        year = Number(fullDateMatch[3]);
      }
    }
  }

  const amPmPattern = `(AM|PM|${KOREAN_AM}|${KOREAN_PM})`;
  const timeSource = combinedText || normalizedTime;
  const timeMatch =
    timeSource.match(new RegExp(`${amPmPattern}\\s*(\\d{1,2})[:.](\\d{2})`, "i")) ??
    timeSource.match(new RegExp(`(\\d{1,2})[:.](\\d{2})\\s*${amPmPattern}`, "i")) ??
    timeSource.match(/(^|[^\d])(\d{1,2})[:.](\d{2})([^\d]|$)/);

  if (!timeMatch) {
    return null;
  }

  let hour: number;
  let minute: number;
  let ampm: string | null = null;

  if (timeMatch[1] && new RegExp(amPmPattern, "i").test(timeMatch[1])) {
    ampm = timeMatch[1];
    hour = Number(timeMatch[2]);
    minute = Number(timeMatch[3]);
  } else if (timeMatch[3] && new RegExp(amPmPattern, "i").test(timeMatch[3])) {
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
    ampm = timeMatch[3];
  } else {
    hour = Number(timeMatch[2]);
    minute = Number(timeMatch[3]);
  }

  const englishAmPm = ampm === KOREAN_AM ? "AM" : ampm === KOREAN_PM ? "PM" : ampm;
  const date = toDate(year, month, day, hour, minute, englishAmPm);

  if (!date) {
    return null;
  }

  return {
    date,
    sourceText: combinedText || `${fallbackDate} ${normalizedTime}`,
  };
}

function parseJsonObject(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as TimestampExtractionResult;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start < 0 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as TimestampExtractionResult;
    } catch {
      return null;
    }
  }
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function extractTimestamps(startImage: File, endImage: File) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return null;
  }

  const [startDataUrl, endDataUrl] = await Promise.all([
    fileToDataUrl(startImage),
    fileToDataUrl(endImage),
  ]);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You read timestamp overlays from workout proof images. Read only the visible overlay timestamp text. Ignore clocks, wall signs, and background text. The timestamp is usually near the lower-left corner. If you cannot read it, return null. Do not guess.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                'Return JSON only with this exact shape: {"start":{"date":string|null,"time":string|null,"confidence":number|null},"end":{"date":string|null,"time":string|null,"confidence":number|null}}. Korean values like 오전/오후 are allowed. The first image is the start photo and the second image is the end photo.',
            },
            {
              type: "input_image",
              image_url: startDataUrl,
              detail: "high",
            },
            {
              type: "input_image",
              image_url: endDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "workout_timestamp_extraction",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["start", "end"],
            properties: {
              start: {
                type: "object",
                additionalProperties: false,
                required: ["date", "time", "confidence"],
                properties: {
                  date: { type: ["string", "null"] },
                  time: { type: ["string", "null"] },
                  confidence: { type: ["number", "null"] },
                },
              },
              end: {
                type: "object",
                additionalProperties: false,
                required: ["date", "time", "confidence"],
                properties: {
                  date: { type: ["string", "null"] },
                  time: { type: ["string", "null"] },
                  confidence: { type: ["number", "null"] },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI timestamp request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { output_text?: string };
  return parseJsonObject(payload.output_text ?? "");
}

export async function inferWorkoutDurationFromTimestamps(
  startImage: File,
  endImage: File,
  workoutDate: string,
) {
  const extraction = await extractTimestamps(startImage, endImage);
  if (!extraction) {
    return null;
  }

  const startTimestamp = parseTimestamp(extraction.start.date, extraction.start.time, workoutDate);
  const endTimestamp = parseTimestamp(extraction.end.date, extraction.end.time, workoutDate);

  if (!startTimestamp || !endTimestamp) {
    return null;
  }

  const endDate = new Date(endTimestamp.date);
  if (endDate.getTime() < startTimestamp.date.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const durationMinutes = Math.round((endDate.getTime() - startTimestamp.date.getTime()) / 60000);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 12 * 60) {
    return null;
  }

  return {
    durationMinutes,
    startTimestamp,
    endTimestamp: {
      ...endTimestamp,
      date: endDate,
    },
    raw: extraction,
  };
}
