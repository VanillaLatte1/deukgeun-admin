import { createWorker, PSM } from "tesseract.js";

type ParsedTimestamp = {
  date: Date;
  sourceText: string;
};

type OcrDurationResult = {
  durationMinutes: number;
  startTimestamp: ParsedTimestamp;
  endTimestamp: ParsedTimestamp;
};

type OcrVariant = {
  image: Blob | Buffer;
  label: string;
};

function normalizeOcrText(text: string) {
  return text
    .replace(/[Oo]/g, "0")
    .replace(/[IiLl|]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ampm?: string,
) {
  let resolvedHour = hour;
  const upperAmPm = ampm?.toUpperCase();

  if (upperAmPm === "PM" && resolvedHour < 12) resolvedHour += 12;
  if (upperAmPm === "AM" && resolvedHour === 12) resolvedHour = 0;

  return new Date(year, month - 1, day, resolvedHour, minute, second, 0);
}

function parseTimeText(text: string, fallbackDate: string): ParsedTimestamp | null {
  const normalized = normalizeOcrText(text);

  const fullDateTimePatterns = [
    /(20\d{2})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\s*(AM|PM)?\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i,
    /(20\d{2})(\d{2})(\d{2})\s*(AM|PM)?\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i,
    /(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](20\d{2})\s*(AM|PM)?\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i,
  ];

  for (const pattern of fullDateTimePatterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const usesTrailingYear = pattern === fullDateTimePatterns[2];
    const date = usesTrailingYear
      ? toDate(
          Number(match[3]),
          Number(match[1]),
          Number(match[2]),
          Number(match[5]),
          Number(match[6]),
          Number(match[7] ?? 0),
          match[4],
        )
      : toDate(
          Number(match[1]),
          Number(match[2]),
          Number(match[3]),
          Number(match[5]),
          Number(match[6]),
          Number(match[7] ?? 0),
          match[4],
        );

    if (!Number.isNaN(date.getTime())) {
      return { date, sourceText: match[0] };
    }
  }

  const [fallbackYear, fallbackMonth, fallbackDay] = fallbackDate.split("-").map(Number);
  if (!fallbackYear || !fallbackMonth || !fallbackDay) {
    return null;
  }

  const timePatterns = [
    /(AM|PM)\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i,
    /(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*(AM|PM)/i,
    /(^|[^\d])(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?([^\d]|$)/,
  ];

  for (const pattern of timePatterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    let hour: number;
    let minute: number;
    let second: number;
    let ampm: string | undefined;

    if (pattern === timePatterns[0]) {
      ampm = match[1];
      hour = Number(match[2]);
      minute = Number(match[3]);
      second = Number(match[4] ?? 0);
    } else if (pattern === timePatterns[1]) {
      hour = Number(match[1]);
      minute = Number(match[2]);
      second = Number(match[3] ?? 0);
      ampm = match[4];
    } else {
      hour = Number(match[2]);
      minute = Number(match[3]);
      second = Number(match[4] ?? 0);
    }

    const date = toDate(
      fallbackYear,
      fallbackMonth,
      fallbackDay,
      hour,
      minute,
      second,
      ampm,
    );

    if (!Number.isNaN(date.getTime())) {
      return { date, sourceText: match[0].trim() };
    }
  }

  return null;
}

async function createBrowserVariants(file: File): Promise<OcrVariant[]> {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  const variantsSpec = [
    { label: "full", x: 0, y: 0, w: width, h: height, scale: 2.2 },
    { label: "bottom-30", x: 0, y: Math.floor(height * 0.7), w: width, h: Math.ceil(height * 0.3), scale: 3 },
    { label: "bottom-22", x: 0, y: Math.floor(height * 0.78), w: width, h: Math.ceil(height * 0.22), scale: 3.2 },
    { label: "top-25", x: 0, y: 0, w: width, h: Math.ceil(height * 0.25), scale: 2.8 },
  ];

  const outputs: OcrVariant[] = [];
  for (const variant of variantsSpec) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(variant.w * variant.scale));
    canvas.height = Math.max(1, Math.floor(variant.h * variant.scale));
    const context = canvas.getContext("2d");
    if (!context) continue;

    context.filter = "grayscale(1) contrast(1.8) brightness(1.15)";
    context.drawImage(
      bitmap,
      variant.x,
      variant.y,
      variant.w,
      variant.h,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (blob) {
      outputs.push({ image: blob, label: variant.label });
    }
  }

  bitmap.close();
  return outputs;
}

async function createImageVariants(file: File) {
  if (typeof window !== "undefined" && typeof createImageBitmap === "function") {
    return createBrowserVariants(file);
  }

  return [
    {
      image: Buffer.from(await file.arrayBuffer()),
      label: "server-raw",
    },
  ];
}

async function recognizeTimestampText(file: File) {
  const worker = await createWorker("eng");

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: "0123456789:-./ APMapm",
      preserve_interword_spaces: "1",
    });

    const variants = await createImageVariants(file);

    for (const variant of variants) {
      const {
        data: { text },
      } = await worker.recognize(variant.image);
      const normalized = normalizeOcrText(text);
      if (parseTimeText(normalized, "2026-01-01")) {
        return normalized;
      }
    }

    const {
      data: { text },
    } = await worker.recognize(Buffer.from(await file.arrayBuffer()));
    return normalizeOcrText(text);
  } finally {
    await worker.terminate();
  }
}

export async function inferWorkoutDurationFromImages(
  startImage: File,
  endImage: File,
  workoutDate: string,
): Promise<OcrDurationResult | null> {
  const [startText, endText] = await Promise.all([
    recognizeTimestampText(startImage),
    recognizeTimestampText(endImage),
  ]);

  const startTimestamp = parseTimeText(startText, workoutDate);
  const endTimestamp = parseTimeText(endText, workoutDate);

  if (!startTimestamp || !endTimestamp) {
    return null;
  }

  let endDate = new Date(endTimestamp.date);
  if (endDate.getTime() < startTimestamp.date.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const durationMinutes = Math.round((endDate.getTime() - startTimestamp.date.getTime()) / 60000);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  return {
    durationMinutes,
    startTimestamp,
    endTimestamp: {
      ...endTimestamp,
      date: endDate,
    },
  };
}
