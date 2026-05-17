import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ParseResult } from "../lib/parser/parser-types";
import { HotDateElement } from "../hot-date";
import { applyFormat, formatDisplayValue, parseFormatToIso } from "./format";

if (typeof customElements !== "undefined") {
  customElements.get("hot-date") || customElements.define("hot-date", HotDateElement);
}

export interface ClassNameProps {
  active?: boolean;
  disabled?: boolean;
  focused?: boolean;
  error?: boolean;
  success?: boolean;
}

export type ClassNameValue =
  | string
  | ((props: ClassNameProps) => string);

export interface ClassNamesConfig {
  input?: ClassNameValue;
  ghost?: ClassNameValue;
  hint?: ClassNameValue;
}

function toIsoDate(date: Date | string | undefined): string | undefined {
  if (date === undefined) return undefined;
  if (typeof date === "string") return date;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
type WEEK_START_MAP = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export interface HotDateProps {
  value?: string | [string, string] | null;
  defaultValue?: string | [string, string] | null;
  onChange?: (value: string | [string, string]) => void;
  onCommit?: (value: string | [string, string]) => void;
  onClear?: () => void;
  onError?: (error: string | undefined) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;
  onInput?: (rawValue: string) => void;
  onPaste?: (e: ClipboardEvent) => void;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onMouseMove?: (e: MouseEvent) => void;
  format?: string;
  dateType?: "point" | "range" | "combined";
  startDate?: Date | string;
  endDate?: Date | string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  timezone?: string;
  locale?: string;
  weekStart?: WEEK_START_MAP;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  name?: string;
  showHint?: boolean;
  error?: boolean;
  success?: boolean;
  classNames?: ClassNamesConfig;
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
        "start-date"?: string;
        "end-date"?: string;
        "hide-examples"?: string;
        "hide-hint"?: string;
        "display-value"?: string;
        format?: string;
        mode?: string;
        disabled?: boolean;
        required?: boolean;
        value?: string;
        "part-class-input"?: string;
        "part-class-ghost"?: string;
        "part-class-hint"?: string;
      };
    }
  }
}

type HotDateEl = HTMLElement & {
  value: string | null;
  blur(): void;
  clear(): void;
  forceDisplayMode?: (canonical: string | null) => void;
};

export interface HotDateHandle {
  /** Focus the input. */
  focus(): void;
  /** Blur the input. */
  blur(): void;
  /** Clear the current value and raw input. */
  clear(): void;
  /** The current committed ISO value, or null if empty. */
  readonly value: string | null;
}

export const HotDate = forwardRef<HotDateHandle, HotDateProps>(function HotDate({
  value,
  defaultValue,
  onChange,
  onCommit,
  onClear,
  onError,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onInput,
  onPaste,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onMouseMove,
  format,
  dateType = "point",
  startDate,
  endDate,
  className,
  style,
  placeholder,
  timezone,
  locale,
  weekStart,
  disabled,
  required,
  autoFocus,
  tabIndex,
  name,
  showHint,
  error,
  success,
  classNames,
}: HotDateProps, ref) {
  const elRef = useRef<HotDateEl>(null);
  const [isActive, setIsActive] = useState<boolean>(Array.isArray(value) ? !!value[0] : !!value);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const lastError = useRef<string | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    focus: () => elRef.current?.focus(),
    blur: () => elRef.current?.blur(),
    clear: () => elRef.current?.clear(),
    get value() { return elRef.current?.value ?? null; },
  }), []);

  const effectiveShowHint = showHint ?? true;

  useEffect(() => {
    const el = elRef.current;
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
    setVal("start-date", toIsoDate(startDate));
    setVal("end-date", toIsoDate(endDate));
    setVal("mode", dateType === "combined" ? "any" : dateType);
    setVal("format", format);
    setAttr("disabled", !!disabled);
    setAttr("required", !!required);
    setAttr("hide-hint", !effectiveShowHint);
    setVal("name", name);
    if (tabIndex !== undefined) el.setAttribute("tabindex", String(tabIndex));
    else el.removeAttribute("tabindex");
  }, [placeholder, timezone, locale, weekStart, startDate, endDate, dateType, format, disabled, required, name, effectiveShowHint, tabIndex]);

  // autoFocus on mount
  const autoFocusRef = useRef(autoFocus);
  useEffect(() => {
    if (autoFocusRef.current) elRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Converts the public value prop shape to the web component's internal "YYYY-MM-DD[/YYYY-MM-DD]" format.
  const toCanonicalIso = (v: string | [string, string] | null | undefined): string | null => {
    if (!v || (Array.isArray(v) && !v[0])) return null;
    if (Array.isArray(v)) {
      const start = format ? (parseFormatToIso(v[0], format, locale) ?? v[0]) : v[0];
      const end   = format ? (parseFormatToIso(v[1], format, locale) ?? v[1]) : v[1];
      return `${start}/${end}`;
    }
    return format ? (parseFormatToIso(v, format, locale) ?? v) : v;
  };

  // One-time mount effect for uncontrolled defaultValue
  const defaultValueRef = useRef(defaultValue);
  useEffect(() => {
    const el = elRef.current;
    const isoValue = toCanonicalIso(defaultValueRef.current);
    if (!el || !isoValue) return;
    el.value = isoValue;
    setIsActive(true);
    el.setAttribute("display-value", formatDisplayValue(isoValue));
    el.forceDisplayMode?.(isoValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el || value === undefined) return;
    const isoValue = toCanonicalIso(value);
    el.value = isoValue;
    setIsActive(!!isoValue);
    if (isoValue) {
      el.setAttribute("display-value", formatDisplayValue(isoValue));
      if (!isFocused) el.forceDisplayMode?.(isoValue);
    } else {
      el.removeAttribute("display-value");
      if (!isFocused) el.forceDisplayMode?.(null);
    }
  }, [value, format, isFocused]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    // Keyboard/paste events don't reliably bubble out of shadow DOM in all environments,
    // so we attach directly to the inner <input> via the open shadow root.
    const shadowInput = el.shadowRoot?.querySelector<HTMLInputElement>("input") ?? null;

    const handleChange = (e: Event) => {
      const detail = (e as CustomEvent<{ value: string | null }>).detail;
      setIsActive(!!detail.value);
      onChange?.(applyFormat(detail.value, format, locale));
    };

    const handleCommit = (e: Event) => {
      const detail = (e as CustomEvent<{ value: string | null }>).detail;
      onCommit?.(applyFormat(detail.value, format, locale));
    };

    const handleClear = () => {
      setIsActive(false);
      onClear?.();
    };

    const handleFocusIn = (e: Event) => {
      setIsFocused(true);
      onFocus?.(e as FocusEvent);
    };
    const handleFocusOut = (e: Event) => {
      setIsFocused(false);
      onBlur?.(e as FocusEvent);
    };
    const handleKeyDown = (e: Event) => onKeyDown?.(e as KeyboardEvent);
    const handleKeyUp = (e: Event) => onKeyUp?.(e as KeyboardEvent);
    const handleRawInput = (e: Event) => {
      const detail = (e as CustomEvent<{ rawInput: string }>).detail;
      onInput?.(detail.rawInput);
    };
    const handleParseChange = (e: Event) => {
      const { status, parseResult } = (e as CustomEvent<{ status: string; parseResult: ParseResult }>).detail;
      const next = (status === "invalid" && parseResult.rawInput)
        ? (parseResult.errors[0] ?? "Invalid date")
        : undefined;
      if (next !== lastError.current) {
        lastError.current = next;
        onError?.(next);
      }
    };
    const handlePaste = (e: Event) => onPaste?.(e as ClipboardEvent);
    const handleClick = (e: Event) => onClick?.(e as MouseEvent);
    const handleMouseEnter = (e: Event) => onMouseEnter?.(e as MouseEvent);
    const handleMouseLeave = (e: Event) => onMouseLeave?.(e as MouseEvent);
    const handleMouseDown = (e: Event) => onMouseDown?.(e as MouseEvent);
    const handleMouseUp = (e: Event) => onMouseUp?.(e as MouseEvent);
    const handleMouseMove = (e: Event) => onMouseMove?.(e as MouseEvent);

    // Custom events are dispatched from the host element itself
    el.addEventListener("value-change", handleChange);
    el.addEventListener("value-commit", handleCommit);
    el.addEventListener("clear", handleClear);
    el.addEventListener("focusin", handleFocusIn);
    el.addEventListener("focusout", handleFocusOut);
    el.addEventListener("raw-input-change", handleRawInput);
    el.addEventListener("parse-change", handleParseChange);
    // Mouse events fire on the host element boundary (mouseenter/leave) or bubble from shadow (click etc.)
    el.addEventListener("click", handleClick);
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mousemove", handleMouseMove);
    // Keyboard + paste go directly on the shadow input — these don't reliably reach the host
    shadowInput?.addEventListener("keydown", handleKeyDown);
    shadowInput?.addEventListener("keyup", handleKeyUp);
    shadowInput?.addEventListener("paste", handlePaste);

    return () => {
      el.removeEventListener("value-change", handleChange);
      el.removeEventListener("value-commit", handleCommit);
      el.removeEventListener("clear", handleClear);
      el.removeEventListener("focusin", handleFocusIn);
      el.removeEventListener("focusout", handleFocusOut);
      el.removeEventListener("raw-input-change", handleRawInput);
      el.removeEventListener("parse-change", handleParseChange);
      el.removeEventListener("click", handleClick);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mousemove", handleMouseMove);
      shadowInput?.removeEventListener("keydown", handleKeyDown);
      shadowInput?.removeEventListener("keyup", handleKeyUp);
      shadowInput?.removeEventListener("paste", handlePaste);
    };
  }, [onChange, onCommit, onClear, onError, onFocus, onBlur, onKeyDown, onKeyUp, onInput, onPaste, onClick, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, onMouseMove, format, locale]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const resolve = (val: ClassNameValue | undefined): string | null => {
      if (!val) return null;
      return typeof val === "function"
        ? val({ active: isActive, disabled: !!disabled, focused: isFocused, error: !!error, success: !!success })
        : val;
    };

    const sync = (attr: string, val: ClassNameValue | undefined) => {
      const resolved = resolve(val);
      if (resolved) el.setAttribute(attr, resolved);
      else el.removeAttribute(attr);
    };

    sync("part-class-input", classNames?.input);
    sync("part-class-ghost", classNames?.ghost);
    sync("part-class-hint", classNames?.hint);
  }, [classNames, isActive, isFocused, disabled, error, success]);

  return (
    <hot-date
      ref={elRef as unknown as React.RefObject<HTMLElement>}
      class={className}
      style={style}
    />
  );
});
