export function shortenString(str: string, limit: number): string {
  if (str.length > limit) {
    const slice = str.slice(0, limit - 1);
    return `${slice}…`;
  }
  return str;
}

export function getLastMonth() {
  const now = new Date();
  const startOfMonth = Number(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0).setHours(23, 59, 59, 999);
  return [startOfMonth, endOfMonth];
}

export function getThisMonth() {
  const [_, startOfMonth] = getLastMonth();
  return [startOfMonth, Date.now()];
}
