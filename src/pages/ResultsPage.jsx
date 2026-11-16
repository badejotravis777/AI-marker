import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { formatMarks, percent, summarize, toCsv } from "../lib/stats.js";

function downloadCsv(results) {
  const blob = new Blob(["﻿" + toCsv(results)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `results-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResultsPage({ results, setResults, guide }) {
  const [openId, setOpenId] = useState(null);
  const summary = summarize(results, guide);

  if (results.length === 0) {
    return (
      <section className="stack">
        <div className="hero">
          <h1>Results</h1>
          <p className="muted">Scripts you approve will appear here, with the class average and the hardest question.</p>
        </div>
        <a className="btn primary" href="#mark">
          <Icon name="camera" /> Mark the first script
        </a>
      </section>
    );
  }

  function remove(id) {
    if (window.confirm("Delete this result?")) setResults((list) => list.filter((r) => r.id !== id));
  }

  function clearAll() {
    if (window.confirm("Delete all results on this phone? This cannot be undone.")) setResults([]);
  }

  return (
    <section className="stack">
      <div className="hero">
        <h1>Results</h1>
        <p className="muted">Saved on this phone.</p>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{summary.count}</span>
          <span className="stat-label">Scripts marked</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.average}%</span>
          <span className="stat-label">Class average</span>
        </div>
        <div className="stat">
          <span className="stat-value">{percent(summary.highest.score, summary.highest.maxScore)}%</span>
          <span className="stat-label">Highest</span>
        </div>
        <div className="stat">
          <span className="stat-value">{percent(summary.lowest.score, summary.lowest.maxScore)}%</span>
          <span className="stat-label">Lowest</span>
        </div>
      </div>

      {summary.hardest && (
        <div className="card insight">
          <p className="label">Hardest question</p>
          <p>
            <strong>Question {summary.hardest.number}</strong>: the class scored {summary.hardest.average}% on average.
          </p>
          {summary.hardest.question && <p className="muted">“{summary.hardest.question}”</p>}
          <p className="muted">Worth revising this topic in class.</p>
        </div>
      )}

      {summary.totalMarks > 0 && (
        <p className="muted small">
          Teachers changed {summary.changedMarks} of {summary.totalMarks} AI marks (
          {percent(summary.totalMarks - summary.changedMarks, summary.totalMarks)}% kept as marked).
        </p>
      )}

      <ul className="result-list">
        {results.map((r) => {
          const open = openId === r.id;
          const toCheck = r.questions.filter((q) => q.needsReview).length;
          return (
            <li key={r.id} className="card result">
              <button className="result-row" onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}>
                <span className="result-name">
                  {r.studentName || "No name"}
                  <span className="muted small">{r.guideTitle}</span>
                </span>
                <span className="result-score">
                  {formatMarks(r.score)}/{formatMarks(r.maxScore)}
                  <span className="muted small">{percent(r.score, r.maxScore)}%</span>
                </span>
              </button>
              {open && (
                <div className="result-detail">
                  {r.questions.map((q) => (
                    <div key={q.number} className="detail-q">
                      <p>
                        <strong>
                          Q{q.number}: {formatMarks(q.awarded)}/{formatMarks(q.maxMarks)}
                        </strong>{" "}
                        {q.needsReview && <span className="pill warn">Checked</span>}
                      </p>
                      <p className="muted">{q.studentAnswer || "No answer written"}</p>
                      {q.feedback && <p className="feedback">{q.feedback}</p>}
                    </div>
                  ))}
                  {r.overallComment && <p className="comment">“{r.overallComment}”</p>}
                  <p className="muted small">
                    Marked {new Date(r.markedAt).toLocaleString()}
                    {Number.isFinite(r.secondsTaken) ? ` in ${r.secondsTaken}s` : ""}
                    {toCheck > 0 ? ` · ${toCheck} answer${toCheck === 1 ? "" : "s"} flagged for checking` : ""}
                  </p>
                  <button className="btn ghost danger small-btn" onClick={() => remove(r.id)}>
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button className="btn" onClick={() => downloadCsv(results)}>
        <Icon name="download" /> Download for Excel (CSV)
      </button>
      <button className="btn ghost danger" onClick={clearAll}>
        <Icon name="trash" /> Delete all results
      </button>
    </section>
  );
}
