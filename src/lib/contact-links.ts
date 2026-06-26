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
