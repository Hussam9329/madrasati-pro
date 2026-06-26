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
