import type { AttendanceScanResult } from "@/types/attendance";

export type ScanFeedbackKind = "success" | "warning" | "error";

/**
 * How a scan response should be presented. A checkout for a student with no
 * check-in that day is saved, but it usually means the morning check-in was
 * missed, so it is flagged as a warning instead of a plain success.
 */
export function getScanFeedbackKind(
  result: AttendanceScanResult,
  mode: "check-in" | "check-out",
): ScanFeedbackKind {
  if (!result.ok) return "error";
  if (mode === "check-out" && !result.checkInAt) return "warning";
  return "success";
}

export const MISSING_CHECK_IN_WARNING =
  "انتبه: هذا الطالب ليس له تسجيل دخول اليوم. إذا كان حاضرًا من الصباح فقد فاته تسجيل الدخول.";

let audioContext: AudioContext | null = null;

/**
 * Short audible cue so a failed or suspicious scan is noticed during the
 * morning rush (staff often look at the student, not the screen).
 */
export function playScanFeedbackSound(kind: ScanFeedbackKind) {
  if (kind === "success" || typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext ??= new AudioContextClass();
    const context = audioContext;
    if (context.state === "suspended") void context.resume();

    const beeps = kind === "error" ? [0, 0.22, 0.44] : [0];
    for (const offset of beeps) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = kind === "error" ? 320 : 660;
      gain.gain.value = 0.15;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const start = context.currentTime + offset;
      oscillator.start(start);
      oscillator.stop(start + 0.16);
    }
  } catch {
    // Sound is a convenience only; the on-screen message is always shown.
  }
}

/** Parse the scan API response; a non-JSON reply (timeout, crash page) is a failure. */
export async function readScanResponse(response: Response): Promise<AttendanceScanResult | null> {
  try {
    return (await response.json()) as AttendanceScanResult;
  } catch {
    return null;
  }
}
