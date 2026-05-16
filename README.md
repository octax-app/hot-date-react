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

### Custom output format

```tsx
<HotDate
  format="MM/DD/YYYY"
  onChange={(value) => console.log(value)}
  // value: "06/13/2026"
/>
```

Tokens are case-insensitive: `YYYY`/`yyyy`, `MM`/`mm`, `DD`/`dd`, `YY`/`yy`, `M`/`m`, `D`/`d`.

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

```tsx
const [date, setDate] = useState<string | null>(null);

<HotDate
  value={date}
  onChange={(v) => setDate(typeof v === 'string' ? v : null)}
/>
```

When a `value` is set, it appears as a human-readable label on the right side of the input (the ghost resolution area). The text field stays empty for natural typing. On blur, the field shows the formatted value; on focus, it restores the raw input.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | Controlled canonical value (`YYYY-MM-DD` or `YYYY-MM-DD/YYYY-MM-DD`) |
| `onChange` | `(value: string \| [string, string] \| null) => void` | — | Fires on every valid parse. Range returns `[start, end]`. |
| `onCommit` | `(value: string \| [string, string] \| null) => void` | — | Fires on Enter key commit. |
| `onClear` | `() => void` | — | Fires when input is cleared. |
| `format` | `string` | `"YYYY-MM-DD"` | Output format. Tokens: `YYYY MM DD YY M D` (case-insensitive). |
| `dateType` | `"point" \| "range"` | `"point"` | Restrict input to single date or range. |
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
| `name` | `string` | — | Form field name. |
| `showHint` | `boolean` | `true` | Show the Tab autocomplete hint. |
| `error` | `boolean` | `false` | Passes `error: true` into `classNames` functions. |
| `success` | `boolean` | `false` | Passes `success: true` into `classNames` functions. |
| `classNames` | `ClassNamesConfig` | — | Per-part class names. Each value is a `string` or `(props) => string`. Keys: `input`, `ghost`, `hint`. |

## Output Format

| `dateType` | `format` not set | `format="MM/DD/YYYY"` |
| --- | --- | --- |
| `"point"` | `"2026-06-13"` | `"06/13/2026"` |
| `"range"` | `["2026-06-01", "2026-06-30"]` | `["06/01/2026", "06/30/2026"]` |

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
