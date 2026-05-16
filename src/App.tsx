import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { HotDate } from "./react/HotDate";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 600, color: "#555" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ValueDisplay({ label, value }: { label: string; value: unknown }) {
  return (
    <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
      <strong>{label}:</strong>{" "}
      <code style={{ background: "#f4f4f5", padding: "2px 6px", borderRadius: 4 }}>
        {value == null ? "null" : JSON.stringify(value)}
      </code>
    </p>
  );
}

type FormValues = { date: string };

export default function App() {
  const [point, setPoint] = useState<string | [string, string] | null>(null);
  const [range, setRange] = useState<string | [string, string] | null>(null);
  const [custom, setCustom] = useState<string | [string, string] | null>(null);
  const [bounded, setBounded] = useState<string | [string, string] | null>(null);
  const [controlled, setControlled] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();

  const [eventsLog, setEventsLog] = useState<string[]>([]);
  const [hovered, setHovered] = useState(false);
  const addLog = useCallback((msg: string) => setEventsLog(prev => [msg, ...prev].slice(0, 10)), []);

  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>hot-date-react</h1>
      <p style={{ color: "#888", marginBottom: "2rem" }}>React wrapper for @stolinski/hot-date</p>

      <Section title="1 — Basic (point, default)">
        <HotDate
          dateType="point"
          placeholder="e.g. tomorrow, next friday"
          onChange={setPoint}
          weekStart="saturday"
          classNames={{
            input: 'input rounded-full  px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:ring-indigo-500 outline-none',
            hint: 'text-xs text-gray-500 italic rounded-md',
            ghost: 'text-black',
          }}
        />
        <ValueDisplay label="onChange value" value={point} />
      </Section>

      <Section title="2 — Range picker">
        <HotDate
          dateType="range"
          placeholder="e.g. jan to feb, this week"
          onChange={setRange}
        />
        <ValueDisplay label="onChange value (array)" value={range} />
      </Section>

      <Section title="3 — Custom format (dd-mm-yyyy)">
        <HotDate
          dateType="point"
          format="dd-mm-yyyy"
          placeholder="e.g. christmas, march 15"
          onChange={setCustom}
        />
        <ValueDisplay label="formatted value (dd-mm-yyyy)" value={custom} />
      </Section>

      <Section title="4 — Date constraints (today → +30 days)">
        <HotDate
          dateType="point"
          startDate={today}
          endDate={nextMonth}
          placeholder={`dates between ${today} and ${nextMonth}`}
          onChange={setBounded}
        />
        <ValueDisplay label="onChange value" value={bounded} />
      </Section>

      <Section title="5a — No style + custom CSS via ::part()">
        <style>{`
          .my-picker::part(input) {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            border: 1px solid #6366f1; border-radius: 8px;
            padding: 0.5rem 1rem;
          }
        `}</style>
        <HotDate
          dateType="point"
                  showHint={false}
          className="my-picker"
          placeholder="custom styled via ::part()"
        />
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.4rem" }}>
          Decorative styles removed. Use <code>::part(input)</code> to style.
        </p>
      </Section>

      <Section title="5b — No style + Tailwind (arbitrary ::part() variants)">
        <HotDate
                  showHint={false}
          dateType="point"
          className="[&::part(input)]:border-2 [&::part(input)]:border-indigo-500 [&::part(input)]:rounded-lg [&::part(input)]:px-3 [&::part(input)]:py-2 [&::part(input)]:bg-white [&::part(input)]:text-sm [&::part(input)]:text-indigo-900"
          placeholder="styled with Tailwind arbitrary ::part() variants"  
        />
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.4rem" }}>
          Uses Tailwind v4 arbitrary variant syntax <code>[&amp;::part(input)]:</code> to style shadow DOM parts.
        </p>
      </Section>

      <Section title="5c — No style + Tailwind via classNames prop">
        <HotDate
          dateType="point"
          showHint={false}
          classNames={{
            input: ({ active, focused, error, success }) =>
              [
                " ring p-1 rounded-lg px-3 py-2 bg-white transition-colors text-sm font-mono text-gray-900 placeholder:text-gray-400 outline-none",
                focused ? "ring-indigo-500 ring-2 ring-indigo-200" : "ring-gray-300",
                error ? "ring-red-500 ring-2 ring-red-100" : "",
                success  ? "ring-green-500 ring-2 ring-green-100" : "",
              ].join(" "),
            // input: "text-sm font-mono text-gray-900 placeholder:text-gray-400",
          }}
          placeholder="styled via classNames prop"
        />
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.4rem" }}>
          <code>classNames</code> injects Tailwind classes directly into shadow DOM parts.
          Supports dynamic classes based on active/focused state.
        </p>
      </Section>

      <Section title="6 — Controlled value (click a preset)">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {["2026-12-25", "2026-01-01", "2026-07-04"].map((d) => (
            <button
              key={d}
              onClick={() => setControlled(d)}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d4d4d8", cursor: "pointer" }}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setControlled(null)}
            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d4d4d8", cursor: "pointer" }}
          >
            clear
          </button>
        </div>
        <HotDate
          dateType="point"
          value={controlled}
          onChange={(v) => setControlled(typeof v === "string" ? v : null)}
          showHint={false}
          
          placeholder="or type a date"
        />
        <ValueDisplay label="controlled value" value={controlled} />
      </Section>

      <Section title="8 — Events + defaultValue">
        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.75rem" }}>
          Pre-filled via <code>defaultValue</code>. Hover, focus, type, paste, click to see events fire.
        </p>
        <HotDate
          defaultValue="2026-06-13"
          placeholder="type anything..."
          onFocus={() => addLog("onFocus")}
          onBlur={() => addLog("onBlur")}
          onKeyDown={(e) => addLog(`onKeyDown: "${e.key}"`)}
          onKeyUp={(e) => addLog(`onKeyUp: "${e.key}"`)}
          onInput={(v) => addLog(`onInput: "${v}"`)}
          onPaste={() => addLog("onPaste")}
          onClick={() => addLog("onClick")}
          onMouseEnter={() => { setHovered(true); addLog("onMouseEnter"); }}
          onMouseLeave={() => { setHovered(false); addLog("onMouseLeave"); }}
          onMouseDown={() => addLog("onMouseDown")}
          onMouseUp={() => addLog("onMouseUp")}
          classNames={{
            input: ({ focused }) =>
              `border rounded px-3 py-2 w-full text-sm transition-colors outline-none
               ${focused ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-300"}
               ${hovered ? "border-indigo-300" : ""}`,
          }}
        />
        <div style={{
          marginTop: "0.75rem", background: "#f4f4f5", borderRadius: 6,
          padding: "0.5rem 0.75rem", minHeight: 96, fontSize: "0.8rem", fontFamily: "monospace",
        }}>
          {eventsLog.length === 0
            ? <span style={{ color: "#aaa" }}>events will appear here…</span>
            : eventsLog.map((msg, i) => (
                <div key={i} style={{ color: i === 0 ? "#6366f1" : "#888", lineHeight: 1.6 }}>{msg}</div>
              ))
          }
        </div>
        <button
          onClick={() => setEventsLog([])}
          style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          clear log
        </button>
      </Section>

      <Section title="7 — React Hook Form Controller">
        <form
          onSubmit={handleSubmit((data) => alert(`Submitted: ${data.date}`))}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 400 }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#374151" }}>
              Pick a date
            </label>
            <Controller
              control={control}
              name="date"
              rules={{ required: "Please enter a valid date." }}
              render={({ field }) => (
                <HotDate
                  dateType="point"
                  format="mm/dd/yyyy"
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(typeof v === "string" ? v : null)}
                  onCommit={(v) => field.onChange(typeof v === "string" ? v : null)}
                  placeholder="e.g. next monday, dec 25"
                  showHint={false}
                  error={!!errors.date}
                  className="outline-none"
                  classNames={{
                    input: ({active, disabled, focused, error, success}) =>
                      [
                        "w-full ring rounded-md px-3 py-2 bg-white text-sm text-gray-900 transition-colors placeholder:text-gray-400 outline-none",
                        focused ? "ring-indigo-500 ring-2 ring-indigo-200" : "ring-gray-300",
                        error ? "ring-red-400 ring" : "",
                        success ? "ring-green-400 ring" : "",
                      ].join(" "),
                  }}
                />
              )}
            />
            {errors.date && (
              <p style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.25rem" }}>
                {errors.date.message}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              style={{ padding: "6px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: "6px 16px", background: "transparent", border: "1px solid #d4d4d8", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Reset
            </button>
          </div>
        </form>
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.75rem" }}>
          Using react-hook-form <code>{"<Controller>"}</code> with noStyle + Tailwind classNames. Validation error shows red ring.
        </p>
      </Section>
    </div>
  );
}
