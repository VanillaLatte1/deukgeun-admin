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
  priority: number;
};

type RecognitionCandidate = {
  parsed: ParsedTimestamp | null;
  normalizedText: string;
  confidence: number;
  variant: OcrVariant;
  score: number;
};

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

let browserWorkerPromise: Promise<TesseractWorker> | null = null;

function normalizeOcrText(text: string) {
  return text
    .replace(/[OoQD]/g, "0")
    .replace(/[IiLl|!]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[Zz]/g, "2")
    .replace(/[Bb]/g, "8")
    .replace(/[，,]/g, ".")
    .replace(/[；;]/g, ":")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidClock(hour: number, minute: number, second: number) {
  return (
    Number.isFinite(hour) &&
    Number.isFinite(minute) &&
    Number.isFinite(second) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59
  );
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

  if (!isValidClock(resolvedHour, minute, second)) {
    return null;
  }

  const date = new Date(year, month - 1, day, resolvedHour, minute, second, 0);
  return Number.isNaN(date.getTime()) ? null : date;
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

    if (date) {
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

    if (date) {
      return { date, sourceText: match[0].trim() };
    }
  }

  return null;
}

function scoreParsedTimestamp(
  parsed: ParsedTimestamp | null,
  normalizedText: string,
  confidence: number,
  variant: OcrVariant,
) {
  let score = confidence + variant.priority * 8;

  if (!parsed) {
    if (/\d{1,2}[:.]\d{2}/.test(normalizedText)) score += 10;
    return score;
  }

  score += 35;

  if (/20\d{2}/.test(parsed.sourceText)) score += 10;
  if (/(AM|PM)/i.test(parsed.sourceText)) score += 4;
  if (/[:.]\d{2}[:.]\d{2}/.test(parsed.sourceText)) score += 4;
  if (parsed.date.getHours() >= 4 && parsed.date.getHours() <= 23) score += 4;

  return score;
}

function preprocessCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  {
    contrastBoost,
    threshold,
    invert,
  }: {
    contrastBoost: number;
    threshold?: number;
    invert?: boolean;
  },
) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    let value = (gray - 128) * contrastBoost + 128;
    value = Math.max(0, Math.min(255, value));

    if (typeof threshold === "number") {
      value = value >= threshold ? 255 : 0;
    }

    if (invert) {
      value = 255 - value;
    }

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
}

async function createBrowserVariants(file: File): Promise<OcrVariant[]> {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  const variantsSpec = [
    { label: "bottom-left-28-tight", x: 0.02, y: 0.7, w: 0.48, h: 0.24, scale: 3.8, priority: 8, threshold: 176 },
    { label: "bottom-left-22", x: 0.03, y: 0.74, w: 0.44, h: 0.2, scale: 4, priority: 7, threshold: 172 },
    { label: "bottom-left-18", x: 0.04, y: 0.78, w: 0.4, h: 0.16, scale: 4.2, priority: 7, threshold: 168 },
    { label: "bottom-18-tight", x: 0.08, y: 0.82, w: 0.84, h: 0.14, scale: 3.8, priority: 6, threshold: 178 },
    { label: "bottom-22", x: 0.04, y: 0.78, w: 0.92, h: 0.18, scale: 3.4, priority: 5, threshold: 170 },
    { label: "bottom-30", x: 0, y: 0.7, w: 1, h: 0.3, scale: 3.1, priority: 4, threshold: 165 },
    { label: "top-22", x: 0, y: 0, w: 1, h: 0.22, scale: 3, priority: 3, threshold: 168 },
    { label: "center-30", x: 0.08, y: 0.35, w: 0.84, h: 0.3, scale: 2.8, priority: 2 },
    { label: "full", x: 0, y: 0, w: 1, h: 1, scale: 2.2, priority: 1 },
  ];

  const outputs: OcrVariant[] = [];

  for (const variant of variantsSpec) {
    const sourceX = Math.floor(width * variant.x);
    const sourceY = Math.floor(height * variant.y);
    const sourceW = Math.max(1, Math.floor(width * variant.w));
    const sourceH = Math.max(1, Math.floor(height * variant.h));

    for (const mode of [
      { suffix: "soft", threshold: undefined, invert: false, contrastBoost: 1.9 },
      { suffix: "binary", threshold: variant.threshold, invert: false, contrastBoost: 2.4 },
    ]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(sourceW * variant.scale));
      canvas.height = Math.max(1, Math.floor(sourceH * variant.scale));

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) continue;

      context.filter = "grayscale(1) brightness(1.12)";
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      preprocessCanvas(context, canvas.width, canvas.height, mode);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (blob) {
        outputs.push({
          image: blob,
          label: `${variant.label}-${mode.suffix}`,
          priority: variant.priority,
        });
      }
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
      priority: 1,
    },
  ];
}

async function initializeWorker(worker: TesseractWorker) {
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    tessedit_char_whitelist: "0123456789:-./ APMapm",
    preserve_interword_spaces: "1",
  });

  return worker;
}

async function getWorker() {
  if (typeof window === "undefined") {
    const worker = await createWorker("eng");
    return initializeWorker(worker);
  }

  if (!browserWorkerPromise) {
    browserWorkerPromise = createWorker("eng").then((worker) => initializeWorker(worker));
  }

  return browserWorkerPromise;
}

async function recognizeTimestampText(file: File, fallbackDate: string) {
  const worker = await getWorker();
  const shouldTerminate = typeof window === "undefined";

  try {
    const variants = await createImageVariants(file);
    const candidates: RecognitionCandidate[] = [];

    for (const variant of variants) {
      const {
        data: { text, confidence },
      } = await worker.recognize(variant.image);

      const normalizedText = normalizeOcrText(text);
      const parsed = parseTimeText(normalizedText, fallbackDate);

      candidates.push({
        parsed,
        normalizedText,
        confidence,
        variant,
        score: scoreParsedTimestamp(parsed, normalizedText, confidence, variant),
      });
    }

    candidates.sort((left, right) => right.score - left.score);
    const bestParsedCandidate = candidates.find((candidate) => candidate.parsed);

    if (bestParsedCandidate) {
      return {
        text: bestParsedCandidate.normalizedText,
        parsed: bestParsedCandidate.parsed,
      };
    }

    const fallbackCandidate = candidates[0];
    return {
      text: fallbackCandidate?.normalizedText ?? "",
      parsed: fallbackCandidate ? parseTimeText(fallbackCandidate.normalizedText, fallbackDate) : null,
    };
  } finally {
    if (shouldTerminate) {
      await worker.terminate();
    }
  }
}

export async function inferWorkoutDurationFromImages(
  startImage: File,
  endImage: File,
  workoutDate: string,
): Promise<OcrDurationResult | null> {
  const [startResult, endResult] = await Promise.all([
    recognizeTimestampText(startImage, workoutDate),
    recognizeTimestampText(endImage, workoutDate),
  ]);

  const startTimestamp = startResult.parsed ?? parseTimeText(startResult.text, workoutDate);
  const endTimestamp = endResult.parsed ?? parseTimeText(endResult.text, workoutDate);

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
  };
}
