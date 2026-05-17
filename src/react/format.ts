// Supported tokens: YYYY YY MMMM MMM MM DD M D (case-insensitive)
const TOKEN_RE = /YYYY|YY|MMMM|MMM|MM|DD|M|D/gi;

function getMonthNames(locale: string, style: "short" | "long"): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(locale, { month: style })
  );
}

function monthNameToNum(name: string, locale?: string): number | null {
  const lower = name.toLowerCase();
  if (locale) {
    for (const style of ["short", "long"] as const) {
      const idx = getMonthNames(locale, style).findIndex((m) => m.toLowerCase() === lower);
      if (idx !== -1) return idx + 1;
    }
  }
  const enShort = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const enLong  = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const si = enShort.indexOf(lower);
  if (si !== -1) return si + 1;
  const li = enLong.indexOf(lower);
  return li === -1 ? null : li + 1;
}

// Parse a formatted date string back to ISO (YYYY-MM-DD) using the format pattern.
// Returns null if the string doesn't match the pattern.
export function parseFormatToIso(formatted: string, format: string, locale?: string): string | null {
  if (!formatted || !format) return null;

  const upper = format.toUpperCase();
  const TOKENS = ["YYYY", "YY", "MMMM", "MMM", "MM", "DD", "M", "D"] as const;
  const groupNames: string[] = [];
  let regexStr = "^";
  let i = 0;

  while (i < upper.length) {
    const token = TOKENS.find((t) => upper.startsWith(t, i));
    if (token) {
      groupNames.push(token);
      if (token === "YYYY") regexStr += "(\\d{4})";
      else if (token === "YY") regexStr += "(\\d{2})";
      else if (token === "MMMM" || token === "MMM") regexStr += "([A-Za-zÀ-ɏ]+)";
      else regexStr += "(\\d{1,2})";
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

  let monthNum: number | null = null;
  const mmRaw = get("MM") ?? get("M");
  if (mmRaw) {
    monthNum = parseInt(mmRaw, 10);
  } else {
    const mmmRaw = get("MMMM") ?? get("MMM");
    if (mmmRaw) monthNum = monthNameToNum(mmmRaw, locale);
  }

  const dayRaw = get("DD") ?? get("D");

  if (!yearRaw || monthNum === null || !dayRaw) return null;

  return `${yearRaw}-${String(monthNum).padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
}

function formatSingleDate(isoDate: string, format: string, locale?: string): string {
  const [year, month, day] = isoDate.split("-");
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  return format.replace(TOKEN_RE, (token) => {
    switch (token.toUpperCase()) {
      case "YYYY": return year;
      case "YY":   return year.slice(-2);
      case "MMMM": return new Date(parseInt(year, 10), monthNum - 1, dayNum).toLocaleString(locale ?? "en", { month: "long" });
      case "MMM":  return new Date(parseInt(year, 10), monthNum - 1, dayNum).toLocaleString(locale ?? "en", { month: "short" });
      case "MM":   return month;
      case "M":    return String(monthNum);
      case "DD":   return day;
      case "D":    return String(dayNum);
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
  locale?: string,
): string | [string, string] {
  if (!canonical) return "";

  if (canonical.includes("/")) {
    const [start, end] = canonical.split("/");
    const fmt = format ?? "YYYY-MM-DD";
    return [formatSingleDate(start, fmt, locale), formatSingleDate(end, fmt, locale)];
  }

  return format ? formatSingleDate(canonical, format, locale) : canonical;
}
