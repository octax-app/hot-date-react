import { useEffect, useRef } from "react";
import "../hot-date";
import { applyFormat } from "./format";

export interface HotDateProps {
  value?: string | null;
  onChange?: (value: string | [string, string] | null) => void;
  onCommit?: (value: string | [string, string] | null) => void;
  onClear?: () => void;
  format?: string;
  dateType?: "point" | "range";
  startDate?: string;
  endDate?: string;
  noStyle?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  timezone?: string;
  locale?: string;
  weekStart?: "sunday" | "monday";
  disabled?: boolean;
  required?: boolean;
  name?: string;
  showExamples?: boolean;
  showHint?: boolean;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "hot-date": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        name?: string;
        placeholder?: string;
        timezone?: string;
        locale?: string;
        "week-start"?: string;
        "allow-past"?: string;
        "no-style"?: string;
        "start-date"?: string;
        "end-date"?: string;
        "hide-examples"?: string;
        "hide-hint"?: string;
        mode?: string;
        disabled?: boolean;
        required?: boolean;
        value?: string;
      };
    }
  }
}

type HotDateEl = HTMLElement & {
  value: string | null;
  rawInput: string;
};

export function HotDate({
  value,
  onChange,
  onCommit,
  onClear,
  format,
  dateType = "point",
  startDate,
  endDate,
  noStyle,
  className,
  style,
  placeholder,
  timezone,
  locale,
  weekStart,
  disabled,
  required,
  name,
  showExamples,
  showHint,
}: HotDateProps) {
  const ref = useRef<HotDateEl>(null);

  // showExamples/showHint default to false when noStyle, true otherwise
  const effectiveShowExamples = showExamples ?? !noStyle;
  const effectiveShowHint = showHint ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // For boolean attributes, use null to remove, non-null to add
    const setAttr = (attr: string, present: boolean) => {
      if (present) el.setAttribute(attr, "");
      else el.removeAttribute(attr);
    };
    const setVal = (attr: string, val: string | undefined | null) => {
      if (val != null) el.setAttribute(attr, val);
      else el.removeAttribute(attr);
    };

    setVal("placeholder", placeholder);
    setVal("timezone", timezone);
    setVal("locale", locale);
    setVal("week-start", weekStart);
    setVal("start-date", startDate);
    setVal("end-date", endDate);
    setVal("mode", dateType);
    setAttr("no-style", !!noStyle);
    setAttr("disabled", !!disabled);
    setAttr("required", !!required);
    setAttr("hide-examples", !effectiveShowExamples);
    setAttr("hide-hint", !effectiveShowHint);
    setVal("name", name);
  }, [placeholder, timezone, locale, weekStart, startDate, endDate, dateType, noStyle, disabled, required, name, effectiveShowExamples, effectiveShowHint]);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === undefined) return;
    el.value = value ?? null;
    // Also update the visible text input so the date shows
    el.rawInput = value ?? "";
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleChange = (e: Event) => {
      const detail = (e as CustomEvent<{ value: string | null }>).detail;
      onChange?.(applyFormat(detail.value, format));
    };

    const handleCommit = (e: Event) => {
      const detail = (e as CustomEvent<{ value: string | null }>).detail;
      onCommit?.(applyFormat(detail.value, format));
    };

    const handleClear = () => onClear?.();

    el.addEventListener("value-change", handleChange);
    el.addEventListener("value-commit", handleCommit);
    el.addEventListener("clear", handleClear);

    return () => {
      el.removeEventListener("value-change", handleChange);
      el.removeEventListener("value-commit", handleCommit);
      el.removeEventListener("clear", handleClear);
    };
  }, [onChange, onCommit, onClear, format]);

  return (
    <hot-date
      ref={ref as unknown as React.RefObject<HTMLElement>}
      class={className}
      style={style}
    />
  );
}
