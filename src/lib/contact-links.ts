export function normalizeIraqiWhatsappPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  if (digits.startsWith("964")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `964${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("7")) {
    return `964${digits}`;
  }

  return digits;
}

export function getWhatsappUrl(phone?: string | null, message?: string) {
  const normalizedPhone = normalizeIraqiWhatsappPhone(phone);
  if (!normalizedPhone) return null;

  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalizedPhone}${text}`;
}

export function normalizeTelegramHandle(username?: string | null) {
  const raw = username?.trim();
  if (!raw) return null;

  const handle = raw
    .replace(/^tg:\/\/resolve\?domain=/i, "")
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@+/, "")
    .split(/[/?#&]/)[0]
    ?.trim();

  if (!handle || !/^[A-Za-z0-9_]{5,32}$/.test(handle)) {
    return null;
  }

  return handle;
}

export function getTelegramDesktopUrl(username?: string | null) {
  const handle = normalizeTelegramHandle(username);
  return handle ? `tg://resolve?domain=${encodeURIComponent(handle)}` : null;
}

/** Full public URL of a student's guardian link (/p/<token>). */
export function buildGuardianLinkUrl(origin: string, token: string) {
  return `${origin}/p/${token}`;
}

/**
 * WhatsApp text that sends guardian links. Siblings sharing one guardian
 * phone get a single message listing each child's name with its link.
 */
export function buildGuardianLinkMessage(children: { name: string; url: string }[]) {
  const intro = children.length > 1
    ? "روابط متابعة أبنائكم في ثانوية مارينا الأهلية (الحضور والدرجات والأقساط):"
    : "رابط متابعة الطالب في ثانوية مارينا الأهلية (الحضور والدرجات والأقساط):";

  return [
    "السلام عليكم ولي الأمر الكريم،",
    intro,
    "",
    ...children.flatMap((child) => [child.name, child.url, ""]),
    "احفظ الرابط؛ يعرض آخر المعلومات في كل مرة تفتحه.",
  ].join("\n");
}

/** Copies text in the browser, falling back to execCommand where the Clipboard API is blocked. */
export async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  }
}
