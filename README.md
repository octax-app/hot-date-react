# hot-date-react

React wrapper for [**@stolinski/hot-date**](https://github.com/stolinski/hot-date) — a natural language date input web component. Type anything: "next friday", "tomorrow to after tomorrow", "between jan 1 and feb 28", and get a clean ISO date back.

## Demo

**[Live demo →](https://packages.octax.cloud/hot-date-react)**

## Install

```bash
npm install @octax-app/hot-date-react
```

> **Peer dependencies:** React ≥ 18

## Quick Start

```tsx
import { HotDate } from '@octax-app/hot-date-react';

function MyForm() {
  return (
    <HotDate
      placeholder="e.g. next friday, tomorrow"
      onChange={(value) => console.log(value)}
    />
  );
}
```

## Usage Examples

### Point date (default)

```tsx
<HotDate
  dateType="point"
  onChange={(value) => console.log(value)}
  // value: "2026-06-13"
/>
```

### Range picker

```tsx
<HotDate
  dateType="range"
  onChange={(value) => console.log(value)}
  // value: ["2026-06-01", "2026-06-30"]
/>
```

### Combined (point + range)

```tsx
<HotDate
  dateType="combined"
  onChange={(value) => console.log(value)}
  // "tomorrow"           → "2026-05-18"
  // "this week"          → ["2026-05-12", "2026-05-18"]
  // "jan to feb"         → ["2026-01-01", "2026-02-28"]
/>
```

`combined` accepts both single dates and ranges. `onChange` returns a `string` for point dates and `[string, string]` for ranges — the same shapes as the dedicated modes.

### Custom output format

```tsx
<HotDate
  format="MM/DD/YYYY"
  onChange={(value) => console.log(value)}
  // value: "06/13/2026"
/>
```

Tokens are case-insensitive: `YYYY`/`yyyy`, `MM`/`mm`, `DD`/`dd`, `YY`/`yy`, `M`/`m`, `D`/`d`, `MMM` (short month name e.g. `Jan`), `MMMM` (full month name e.g. `January`). Month name tokens respect the `locale` prop.

For ranges, `onChange` returns `[formattedStart, formattedEnd]`.

When the input loses focus after a value is committed, the field displays the formatted value. When focused again, it restores the raw natural-language input for editing.

### Date constraints

Both `Date` objects and `"YYYY-MM-DD"` strings are accepted. The output value is always a string.

```tsx
// Using JS Date objects
<HotDate
  startDate={new Date()}
  endDate={new Date(Date.now() + 30 * 86400000)}
  onChange={(value) => console.log(value)} // value: "2026-06-13" (string)
/>

// Using ISO strings
<HotDate
  startDate="2026-01-01"
  endDate="2026-12-31"
  onChange={(value) => console.log(value)}
/>
```

Dates outside the `startDate`/`endDate` window are rejected at the parser level.

### Bring your own CSS

The component renders as a plain browser input by default — no decorative styles are applied. Use `className` and `::part()` to style it, or pass Tailwind classes via `classNames`.

```tsx
<HotDate className="my-picker" />
```

```css
/* Use ::part() to style shadow DOM elements */
.my-picker::part(input) {
  border: 2px solid #6366f1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-family: monospace;
}
.my-picker::part(ghost) {
  padding: 0.5rem 0.75rem;
}
```

### Tailwind dark mode

`dark:` variants work out of the box. The component mirrors all classes from `<html>` into the shadow root on every render and whenever they change, so Tailwind's `.dark .dark\:*` selectors resolve correctly inside the shadow DOM.

```tsx
<HotDate
  classNames={{
    input: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600",
  }}
/>
```

Toggling `document.documentElement.classList.toggle('dark')` at runtime is picked up immediately.

### Per-part class names (Tailwind-friendly)

Use `classNames` to apply classes directly to shadow DOM elements. External stylesheets — including Tailwind — are automatically mirrored into the shadow root, so utility classes work out of the box.

Each key accepts a **string** or a **function** that receives the current component state as an object:

```tsx
<HotDate
  classNames={{
    input: ({ active, focused, error }) =>
      `border rounded px-3 py-2 w-full
       ${focused ? "ring-2 ring-indigo-500" : ""}
       ${active ? "border-green-500" : "border-gray-300"}
       ${error ? "border-red-500" : ""}`,
    ghost: "text-gray-400",
    hint: "opacity-50",
  }}
  error={hasError}
/>
```

The function signature for any `classNames` entry:

```ts
(props: {
  active: boolean;    // true when input has a resolved valid date
  disabled: boolean;  // true when the disabled prop is set
  focused: boolean;   // true when the input currently has focus
  error: boolean;     // true when the error prop is set
  success: boolean;   // true when the success prop is set
}) => string
```

The keys map to shadow DOM parts:

| Key | Part | Element |
| --- | --- | --- |
| `input` | `part="input"` | The `<input>` element |
| `ghost` | `part="ghost"` | The suggestion overlay |
| `hint` | `part="hint"` | The `Tab` hint chip |

### Controlled value

`value` accepts the same shapes that `onChange` returns — so you can pass the value straight back without converting.

```tsx
// Point date
const [date, setDate] = useState<string>("");

<HotDate
  dateType="point"
  value={date || null}
  onChange={(v) => setDate(v as string)}
/>
```

```tsx
// Range — pass the [start, end] array directly back as value
const [range, setRange] = useState<string | [string, string]>("");

<HotDate
  dateType="range"
  value={range || null}
  onChange={setRange}
/>
// After blur shows: "2026-01-01 — 2026-01-31"
```

When `value` is provided the input renders in display mode — showing the formatted date or range — while unfocused. Clicking into it restores the natural-language input for editing. On blur it returns to display mode automatically.

> `onChange` never returns `null`. It returns `""` when no date is selected, a `string` for point dates, and `[string, string]` for ranges.

### Uncontrolled with a default value

```tsx
// Point
<HotDate defaultValue="2026-06-13" onChange={(v) => console.log(v)} />

// Range
<HotDate
  dateType="range"
  defaultValue={["2026-01-01", "2026-01-31"]}
  onChange={(v) => console.log(v)}
/>
```

`defaultValue` sets the initial value on mount and immediately enters display mode, but the component is uncontrolled after that — React does not drive subsequent updates.

### Imperative ref

```tsx
import { useRef } from 'react';
import { HotDate, type HotDateHandle } from '@octax-app/hot-date-react';

const ref = useRef<HotDateHandle>(null);

<HotDate ref={ref} />

// Imperatively control the input:
ref.current?.focus();
ref.current?.blur();
ref.current?.clear();
console.log(ref.current?.value); // string | null
```

### Event callbacks

```tsx
<HotDate
  onFocus={(e) => console.log('focused', e)}
  onBlur={(e) => console.log('blurred', e)}
  onKeyDown={(e) => console.log('key', e.key)}
  onInput={(rawValue) => console.log('typing', rawValue)}
  onPaste={(e) => console.log('pasted')}
  onClick={(e) => console.log('clicked')}
  onMouseEnter={(e) => console.log('mouse in')}
  onMouseLeave={(e) => console.log('mouse out')}
  onError={(err) => console.log(err)} // "Date is outside the allowed range." | undefined
/>
```

### Error handling

`onError` fires whenever the typed input is invalid — out of range, wrong mode, or unparseable. It fires with `undefined` when the error clears (user types a valid date or empties the field). Only fires when the error state actually changes, not on every keystroke.

```tsx
<HotDate
  endDate={new Date()}              // today is the latest allowed date
  onError={(err) => {
    if (err) setErrorMsg(err);      // e.g. "Date is outside the allowed range."
    else setErrorMsg("");           // cleared
  }}
  onChange={(value) => {
    // value is "" when nothing is selected, "YYYY-MM-DD" when valid
    setValue(value as string);
  }}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| [string, string] \| null` | — | Controlled value. Pass a string for point dates, `[start, end]` for ranges — same shape `onChange` returns. Renders in display mode while unfocused. |
| `defaultValue` | `string \| [string, string] \| null` | — | Uncontrolled initial value. Same shape as `value`. Mounts in display mode; React does not drive updates after mount. |
| `onChange` | `(value: string \| [string, string]) => void` | — | Fires on every valid parse. Returns `""` when no value. Range returns `[start, end]`. |
| `onCommit` | `(value: string \| [string, string]) => void` | — | Fires on Enter key commit. Returns `""` when no value. |
| `onClear` | `() => void` | — | Fires when input is cleared. |
| `onError` | `(error: string \| undefined) => void` | — | Fires when input is invalid (out of range, unparseable, wrong mode). Fires `undefined` when the error clears. Only fires on state change, not every keystroke. |
| `onFocus` | `(e: FocusEvent) => void` | — | Fires when the input gains focus. |
| `onBlur` | `(e: FocusEvent) => void` | — | Fires when the input loses focus. |
| `onKeyDown` | `(e: KeyboardEvent) => void` | — | Fires on keydown. |
| `onKeyUp` | `(e: KeyboardEvent) => void` | — | Fires on keyup. |
| `onInput` | `(rawValue: string) => void` | — | Fires on every keystroke with the raw typed string. |
| `onPaste` | `(e: ClipboardEvent) => void` | — | Fires when content is pasted into the input. |
| `onClick` | `(e: MouseEvent) => void` | — | Fires on click. |
| `onMouseEnter` | `(e: MouseEvent) => void` | — | Fires when the mouse enters the component. |
| `onMouseLeave` | `(e: MouseEvent) => void` | — | Fires when the mouse leaves the component. |
| `onMouseDown` | `(e: MouseEvent) => void` | — | Fires on mousedown. |
| `onMouseUp` | `(e: MouseEvent) => void` | — | Fires on mouseup. |
| `onMouseMove` | `(e: MouseEvent) => void` | — | Fires on mousemove. |
| `format` | `string` | `"YYYY-MM-DD"` | Output format. Tokens: `YYYY YY MM DD M D MMM MMMM` (case-insensitive). `MMM`/`MMMM` render locale-aware short/full month names. |
| `dateType` | `"point" \| "range" \| "combined"` | `"point"` | `"point"` = single date only, `"range"` = range only, `"combined"` = both simultaneously (returns `string` or `[string, string]`). |
| `startDate` | `Date \| string` | — | Minimum date. Accepts a JS `Date` or `"YYYY-MM-DD"` string. |
| `endDate` | `Date \| string` | — | Maximum date. Accepts a JS `Date` or `"YYYY-MM-DD"` string. |
| `className` | `string` | — | CSS class on the host element. |
| `style` | `React.CSSProperties` | — | Inline styles on the host element. |
| `placeholder` | `string` | `"type anything..."` | Input placeholder text. |
| `timezone` | `string` | system timezone | IANA timezone (e.g. `"America/New_York"`). |
| `locale` | `string` | `navigator.language` | BCP-47 locale (e.g. `"en-US"`). |
| `weekStart` | `"sunday" \| "monday" \| "tuesday" \| "wednesday" \| "thursday" \| "friday" \| "saturday"` | `"monday"` | First day of week for relative expressions. |
| `disabled` | `boolean` | `false` | Disable the input. |
| `required` | `boolean` | `false` | Participates in form validation. |
| `autoFocus` | `boolean` | `false` | Focus the input on mount. |
| `tabIndex` | `number` | — | Sets the tab index on the inner `<input>`. Use `-1` to remove from tab order. |
| `ref` | `React.Ref<HotDateHandle>` | — | Imperative handle with `focus()`, `blur()`, `clear()`, and `value`. |
| `name` | `string` | — | Form field name. |
| `showHint` | `boolean` | `true` | Show the Tab autocomplete hint. |
| `error` | `boolean` | `false` | Passes `error: true` into `classNames` functions. |
| `success` | `boolean` | `false` | Passes `success: true` into `classNames` functions. |
| `classNames` | `ClassNamesConfig` | — | Per-part class names. Each value is a `string` or `(props) => string`. Keys: `input`, `ghost`, `hint`. |

## Output Format

| `dateType` | `format` not set | `format="MM/DD/YYYY"` | `format="MMM DD, YYYY"` |
| --- | --- | --- | --- |
| `"point"` | `"2026-06-13"` | `"06/13/2026"` | `"Jun 13, 2026"` |
| `"range"` | `["2026-06-01", "2026-06-30"]` | `["06/01/2026", "06/30/2026"]` | `["Jun 01, 2026", "Jun 30, 2026"]` |
| `"combined"` | `"2026-06-13"` or `["2026-06-01", "2026-06-30"]` | `"06/13/2026"` or `["06/01/2026", "06/30/2026"]` | `"Jun 13, 2026"` or `["Jun 01, 2026", "Jun 30, 2026"]` |

Empty / no selection always returns `""` regardless of `dateType` or `format`.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Accept the active autocomplete suggestion (pressing Tab again after accepting moves focus normally) |
| `Enter` | Commit the current value |
| `↑` / `↓` | Cycle through suggestions |
| `Escape` | Reset active suggestion |

## Styling with `::part()`

The shadow DOM exposes these CSS parts:

| Part | Element |
| --- | --- |
| `input` | The `<input>` element |
| `ghost` | The suggestion overlay |
| `hint` | The `Tab` hint `<kbd>` chip |

```css
hot-date::part(input) { font-size: 1rem; border-radius: 8px; }
hot-date::part(ghost) { padding: 0 0.75rem; }
```

## Natural Language Examples

```
tomorrow
next friday
in 3 days
christmas
after tomorrow
jan to feb
this week
tomorrow to after tomorrow
between 5/15/2026 and 6/13/2026
3 days before christmas
9 days after christmas until new years
```

## Credits

Built on top of [**@stolinski/hot-date**](https://github.com/stolinski/hot-date) by [Scott Tolinski](https://github.com/stolinski) — the natural language date parsing engine and web component that powers this React wrapper.

## License

MIT
