// Supported tokens: YYYY YY MM DD M D (case-insensitive)
const TOKEN_RE = /YYYY|YY|MM|DD|yyyy|yy|mm|dd|M|D|m|d/g;

function formatSingleDate(isoDate: string, format: string): string {
  const [year, month, day] = isoDate.split("-");
  return format.replace(TOKEN_RE, (token) => {
    switch (token.toUpperCase()) {
      case "YYYY": return year;
      case "YY":   return year.slice(-2);
      case "MM":   return month;
      case "M":    return String(parseInt(month, 10));
      case "DD":   return day;
      case "D":    return String(parseInt(day, 10));
      default:     return token;
    }
  });
}

export function applyFormat(
  canonical: string | null,
  format?: string,
): string | [string, string] | null {
  if (!canonical) return null;

  if (canonical.includes("/")) {
    const [start, end] = canonical.split("/");
    const fmt = format ?? "YYYY-MM-DD";
    return [formatSingleDate(start, fmt), formatSingleDate(end, fmt)];
  }

  return format ? formatSingleDate(canonical, format) : canonical;
}
