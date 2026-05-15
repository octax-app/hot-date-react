# hot-date-react

React wrapper for [**@stolinski/hot-date**](https://github.com/stolinski/hot-date) — a natural language date input web component. Type anything: "next friday", "tomorrow to after tomorrow", "between jan 1 and feb 28", and get a clean ISO date back.

## Install

```bash
npm install hot-date-react
```

> **Peer dependencies:** React ≥ 18

## Quick Start

```tsx
import { HotDate } from 'hot-date-react/react';

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

### Date constraints (replaces `allowPast`)

```tsx
<HotDate
  startDate="2026-01-01"
  endDate="2026-12-31"
  onChange={(value) => console.log(value)}
/>
```

Dates outside the `startDate`/`endDate` window are rejected at the parser level.

### No style — bring your own CSS

```tsx
<HotDate
  noStyle
  className="my-picker"
/>
```

```css
/* Use ::part() to style shadow DOM elements */
.my-picker::part(field) {
  border: 2px solid #6366f1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.my-picker::part(input) {
  font-family: monospace;
}
.my-picker::part(ghost) {
  padding: 0.5rem 0.75rem;
  justify-content: space-between;
}
```

> When `noStyle` is set, decorative shadow DOM styles are removed but structural CSS (positioning for the ghost overlay) is preserved. `showExamples` defaults to `false`.

### Controlled value

```tsx
const [date, setDate] = useState<string | null>(null);

<HotDate
  value={date}
  onChange={(v) => setDate(typeof v === 'string' ? v : null)}
/>
```

When a `value` is set, it appears as `"MMM DD, YYYY"` on the right side of the input (the ghost resolution area). The text field stays empty for natural typing.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | Controlled canonical value (`YYYY-MM-DD` or `YYYY-MM-DD/YYYY-MM-DD`) |
| `onChange` | `(value: string \| [string, string] \| null) => void` | — | Fires on every valid parse. Range returns `[start, end]`. |
| `onCommit` | `(value: string \| [string, string] \| null) => void` | — | Fires on Enter key commit. |
| `onClear` | `() => void` | — | Fires when input is cleared. |
| `format` | `string` | `"YYYY-MM-DD"` | Output format. Tokens: `YYYY MM DD YY M D` (case-insensitive). |
| `dateType` | `"point" \| "range"` | `"point"` | Restrict input to single date or range. |
| `startDate` | `string` | — | Minimum date (`YYYY-MM-DD`). Dates before this are rejected. |
| `endDate` | `string` | — | Maximum date (`YYYY-MM-DD`). Dates after this are rejected. |
| `noStyle` | `boolean` | `false` | Remove decorative shadow DOM styles. |
| `className` | `string` | — | CSS class on the host element. |
| `style` | `React.CSSProperties` | — | Inline styles on the host element. |
| `placeholder` | `string` | `"type anything..."` | Input placeholder text. |
| `timezone` | `string` | system timezone | IANA timezone (e.g. `"America/New_York"`). |
| `locale` | `string` | `navigator.language` | BCP-47 locale (e.g. `"en-US"`). |
| `weekStart` | `"sunday" \| "monday"` | `"sunday"` | First day of week for relative expressions. |
| `disabled` | `boolean` | `false` | Disable the input. |
| `required` | `boolean` | `false` | Participates in form validation. |
| `name` | `string` | — | Form field name. |
| `showExamples` | `boolean` | `!noStyle` | Show the examples hint below the input. |
| `showHint` | `boolean` | `true` | Show the Tab autocomplete hint. |

## Output Format

| `dateType` | `format` not set | `format="MM/DD/YYYY"` |
| --- | --- | --- |
| `"point"` | `"2026-06-13"` | `"06/13/2026"` |
| `"range"` | `["2026-06-01", "2026-06-30"]` | `["06/01/2026", "06/30/2026"]` |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Accept the active autocomplete suggestion |
| `Enter` | Commit the current value |
| `↑` / `↓` | Cycle through suggestions |
| `Escape` | Reset active suggestion |

## Styling with `::part()`

The shadow DOM exposes these CSS parts:

| Part | Element |
| --- | --- |
| `field` | The field wrapper (`position: relative`) |
| `input` | The `<input>` element |
| `ghost` | The suggestion overlay |
| `hint` | The `Tab` hint `<kbd>` chip |

```css
hot-date::part(field) { border-radius: 8px; }
hot-date::part(input) { font-size: 1rem; }
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

## Publishing

This package publishes to both registries on GitHub release:

```bash
# npm
npm install hot-date-react

# GitHub Packages
npm install @stolinski/hot-date-react --registry https://npm.pkg.github.com
```

## Credits

Built on top of [**@stolinski/hot-date**](https://github.com/stolinski/hot-date) by [Scott Tolinski](https://github.com/stolinski) — the natural language date parsing engine and web component that powers this React wrapper.

## License

MIT
