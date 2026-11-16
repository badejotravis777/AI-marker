import { useEffect, useState } from "react";
import { load, save } from "../lib/storage.js";
import { averageSeconds, estimateImpact, percent, summarize } from "../lib/stats.js";

const DEFAULTS = { teachers: 20, scriptsPerTeacher: 150, minutesByHand: 3, minutesWithApp: 1, examsPerTerm: 2 };

const FIELDS = [
  { key: "teachers", label: "Teachers who mark scripts", step: 1 },
  { key: "scriptsPerTeacher", label: "Scripts each teacher marks per test or exam", step: 10 },
  { key: "examsPerTerm", label: "Tests and exams per term", step: 1 },
  { key: "minutesByHand", label: "Minutes to mark one script by hand", step: 0.5 },
  { key: "minutesWithApp", label: "Minutes to snap and check one script", step: 0.5 },
];

function round(value) {
  return value >= 10 ? Math.round(value).toLocaleString() : value.toFixed(1);
}

export default function ImpactPage({ results }) {
  const [inputs, setInputs] = useState(() => ({ ...DEFAULTS, ...load("impact", {}) }));
  useEffect(() => {
    save("impact", inputs);
  }, [inputs]);

  const clean = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, Math.max(0, Number(v) || 0)]));
  const impact = estimateImpact(clean);
  const seconds = averageSeconds(results);
  const summary = summarize(results, null);

  return (
    <section className="stack">
      <div className="hero">
        <h1>Time saved</h1>
        <p className="muted">Put in your school's numbers to see how much marking time teachers get back each term.</p>
      </div>

      <div className="card big-number">
        <span className="big-value">{round(impact.hoursSaved)}</span>
        <span className="big-label">teacher hours saved per term</span>
        <p className="muted">
          That is about <strong>{round(impact.workingDaysSaved)}</strong> working days, or{" "}
          <strong>{round(impact.hoursSavedPerTeacher)}</strong> hours for each teacher.
        </p>
      </div>

      <div className="card stack-sm">
        {FIELDS.map((f) => (
          <label key={f.key} className="field inline">
            <span>{f.label}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step={f.step}
              value={inputs[f.key]}
              onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
            />
          </label>
        ))}
        <p className="muted small">
          {impact.scripts.toLocaleString()} scripts per term: {round(impact.hoursByHand)} hours by hand, about{" "}
          {round(impact.hoursWithApp)} hours with Snap &amp; Mark. These are estimates. Time a few teachers to get
          real numbers.
        </p>
        <button className="btn ghost" onClick={() => setInputs(DEFAULTS)}>
          Reset to example numbers
        </button>
      </div>

      <div className="card">
        <p className="label">Measured on this phone</p>
        {summary.count === 0 ? (
          <p className="muted">Mark a few scripts and the real speed will show here.</p>
        ) : (
          <ul className="plain">
            <li>
              <strong>{summary.count}</strong> script{summary.count === 1 ? "" : "s"} marked
            </li>
            {seconds !== null && (
              <li>
                <strong>{seconds} seconds</strong> on average for the AI to mark one
              </li>
            )}
            <li>
              <strong>{percent(summary.totalMarks - summary.changedMarks, summary.totalMarks)}%</strong> of AI marks
              kept by the teacher
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
