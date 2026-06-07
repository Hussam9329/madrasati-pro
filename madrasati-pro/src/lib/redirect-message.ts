export function buildErrorRedirect(
  path: string,
  error: string,
  message?: string,
): string {
  const params = new URLSearchParams({ error });

  if (message) {
    params.set("reason", message);
  }

  return `${path}?${params.toString()}`;
}
