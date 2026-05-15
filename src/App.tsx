import { useState } from "react";
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

export default function App() {
  const [point, setPoint] = useState<string | [string, string] | null>(null);
  const [range, setRange] = useState<string | [string, string] | null>(null);
  const [custom, setCustom] = useState<string | [string, string] | null>(null);
  const [bounded, setBounded] = useState<string | [string, string] | null>(null);
  const [controlled, setControlled] = useState<string | null>(null);

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

      <Section title="5 — No style + custom className (examples hidden by default)">
        <style>{`
          .my-picker {
            display: inline-block;
            min-width: 260px;
          }
          .my-picker::part(field) {
            border: 2px solid #6366f1;
            border-radius: 8px;
            padding: 0.5rem 0.75rem;
            background: #fafafa;
            font-family: monospace;
          }
          .my-picker::part(input) {
            font-family: monospace;
            font-size: 0.9rem;
          }
          .my-picker::part(ghost) {
            padding: 0.5rem 0.75rem;
            justify-content: space-between;
          }
        `}</style>
        <HotDate
          dateType="point"
          noStyle
          className="my-picker"
          placeholder="custom styled via ::part()"
        />
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.4rem" }}>
          Decorative styles removed. Structural CSS kept. Use <code>::part(field)</code>, <code>::part(input)</code>, <code>::part(ghost)</code> to style.
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
          placeholder="or type a date"
          showExamples={false}
        />
        <ValueDisplay label="controlled value" value={controlled} />
      </Section>
    </div>
  );
}
