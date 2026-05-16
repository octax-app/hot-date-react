// Supported tokens: YYYY YY MM DD M D (case-insensitive)
const TOKEN_RE = /YYYY|YY|MM|DD|yyyy|yy|mm|dd|M|D|m|d/g;

// Parse a formatted date string back to ISO (YYYY-MM-DD) using the format pattern.
// Returns null if the string doesn't match the pattern.
export function parseFormatToIso(formatted: string, format: string): string | null {
  if (!formatted || !format) return null;

  // Build a regex from the format string, capturing token groups in order
  const upper = format.toUpperCase();
  const TOKENS = ["YYYY", "YY", "MM", "DD", "M", "D"] as const;
  const groupNames: string[] = [];
  let regexStr = "^";
  let i = 0;

  while (i < upper.length) {
    const token = TOKENS.find((t) => upper.startsWith(t, i));
    if (token) {
      groupNames.push(token);
      regexStr +=
        token === "YYYY" ? "(\\d{4})"
        : token === "YY"   ? "(\\d{2})"
        : "(\\d{1,2})";
      i += token.length;
    } else {
      regexStr += upper[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }
  regexStr += "$";

  const match = formatted.match(new RegExp(regexStr, "i"));
  if (!match) return null;

  const get = (name: string) => {
    const idx = groupNames.indexOf(name);
    return idx >= 0 ? match[idx + 1] : null;
  };

  const yearRaw = get("YYYY") ?? (get("YY") ? `20${get("YY")}` : null);
  const monthRaw = get("MM") ?? get("M");
  const dayRaw   = get("DD") ?? get("D");

  if (!yearRaw || !monthRaw || !dayRaw) return null;

  return `${yearRaw}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
}

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

const displayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  // Use UTC to avoid timezone shifting the date
  return displayFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatDisplayValue(canonical: string | null): string {
  if (!canonical) return "";
  if (canonical.includes("/")) {
    const [start, end] = canonical.split("/");
    return `${formatDisplayDate(start)} — ${formatDisplayDate(end)}`;
  }
  return formatDisplayDate(canonical);
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
