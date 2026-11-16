import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { prepareImage } from "../lib/image.js";
import { markPhoto } from "../lib/api.js";
import { EXAMPLE_RESULT } from "../lib/sampleGuide.js";
import { formatMarks, percent } from "../lib/stats.js";

function totalMarks(guide) {
  return guide.questions.reduce((sum, q) => sum + Number(q.maxMarks || 0), 0);
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

export default function MarkPage({ guide, onSaved, goTo, server }) {
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | preparing | marking | review | error
  const [photo, setPhoto] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isExample, setIsExample] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [secondsTaken, setSecondsTaken] = useState(null);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    if (phase !== "marking") return undefined;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(timer);
  }, [phase, startedAt]);

  useEffect(() => {
    if (!savedNotice) return undefined;
    const timer = setTimeout(() => setSavedNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [savedNotice]);

  async function runMarking(prepared) {
    const began = Date.now();
    setStartedAt(began);
    setElapsed(0);
    setPhase("marking");
    setError("");
    try {
      const result = await markPhoto({ ...prepared, guide });
      setSecondsTaken(Math.round((Date.now() - began) / 1000));
      setDraft({
        ...result,
        questions: result.questions.map((q) => ({ ...q, aiAwarded: q.awarded })),
      });
      setIsExample(false);
      setPhase("review");
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSavedNotice("");
    setPhase("preparing");
    try {
      const prepared = await prepareImage(file);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setPhoto(prepared);
      await runMarking(prepared);
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  function showExample() {
    setDraft({
      ...EXAMPLE_RESULT,
      questions: EXAMPLE_RESULT.questions.map((q) => ({ ...q, aiAwarded: q.awarded })),
    });
    setIsExample(true);
    setSecondsTaken(null);
    setPhase("review");
  }

  function reset() {
    setPhase("idle");
    setDraft(null);
    setIsExample(false);
    setError("");
  }

  function changeMark(number, delta) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.number === number
          ? { ...q, awarded: Math.min(q.maxMarks, Math.max(0, Math.round((q.awarded + delta) * 2) / 2)) }
          : q,
      ),
    }));
  }

  function approve() {
    const score = draft.questions.reduce((sum, q) => sum + q.awarded, 0);
    onSaved({
      id: newId(),
      guideId: guide.id,
      guideTitle: [guide.classLevel, guide.subject, guide.title].filter(Boolean).join(" · "),
      studentName: draft.studentName.trim(),
      score,
      maxScore: draft.maxScore,
      questions: draft.questions,
      overallComment: draft.overallComment,
      markedAt: new Date().toISOString(),
      secondsTaken,
    });
    setSavedNotice(`${draft.studentName.trim() || "Script"} saved: ${formatMarks(score)} / ${formatMarks(draft.maxScore)}`);
    reset();
  }

  const fileInputs = (
    <>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={galleryInput} type="file" accept="image/*" hidden onChange={onFile} />
    </>
  );

  if (phase === "preparing" || phase === "marking") {
    return (
      <section className="stack">
        {fileInputs}
        <div className="card marking-card" role="status" aria-live="polite">
          {photo?.previewUrl && phase === "marking" && (
            <img className="scan-preview" src={photo.previewUrl} alt="The answer sheet being marked" />
          )}
          <div className="spinner" aria-hidden="true" />
          <h2>{phase === "preparing" ? "Preparing the photo…" : "Marking the script…"}</h2>
          <p className="muted">Reading the handwriting and checking it against your marking guide.</p>
          {phase === "marking" && <p className="timer">{elapsed}s</p>}
        </div>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section className="stack">
        {fileInputs}
        <div className="card notice bad" role="alert">
          <Icon name="alert" size={22} />
          <div>
            <h2>That didn't work</h2>
            <p>{error}</p>
          </div>
        </div>
        {photo && (
          <button className="btn primary" onClick={() => runMarking(photo)}>
            <Icon name="refresh" /> Try this photo again
          </button>
        )}
        <button className="btn" onClick={() => cameraInput.current?.click()}>
          <Icon name="camera" /> Take a new photo
        </button>
        <button className="btn ghost" onClick={reset}>
          Back
        </button>
      </section>
    );
  }

  if (phase === "review" && draft) {
    const score = draft.questions.reduce((sum, q) => sum + q.awarded, 0);
    const toCheck = draft.questions.filter((q) => q.needsReview).length;
    return (
      <section className="stack">
        {fileInputs}
        {isExample && (
          <div className="notice warn">
            <Icon name="alert" size={20} />
            <p>
              <strong>Example only.</strong> This is a sample result, not a real script. Take a photo to mark a real
              one.
            </p>
          </div>
        )}

        <div className="card score-card">
          <label className="field">
            <span>Student name</span>
            <input
              value={draft.studentName}
              placeholder="Type the student's name"
              onChange={(e) => setDraft({ ...draft, studentName: e.target.value })}
            />
          </label>
          <div className="score-row">
            <div>
              <div className="score">
                {formatMarks(score)}
                <span> / {formatMarks(draft.maxScore)}</span>
              </div>
              <div className="muted">{percent(score, draft.maxScore)}%</div>
            </div>
            {secondsTaken !== null && (
              <div className="speed">
                Marked in <strong>{secondsTaken}s</strong>
              </div>
            )}
          </div>
          {toCheck > 0 && (
            <p className="check-note">
              <Icon name="alert" size={16} /> {toCheck} answer{toCheck === 1 ? "" : "s"} marked “Check this”. Please
              look before approving.
            </p>
          )}
        </div>

        {photo?.previewUrl && !isExample && (
          <details className="card photo-details">
            <summary>Show the photo</summary>
            <img src={photo.previewUrl} alt="The answer sheet that was marked" />
          </details>
        )}

        {draft.questions.map((q) => {
          const changed = q.awarded !== q.aiAwarded;
          return (
            <article key={q.number} className={`card question ${q.needsReview ? "review" : ""}`}>
              <header className="question-head">
                <h3>Question {q.number}</h3>
                {q.needsReview && <span className="pill warn">Check this</span>}
                {changed && <span className="pill">Changed by you</span>}
              </header>
              <p className="label">Student wrote</p>
              <blockquote>{q.studentAnswer || <em className="muted">No answer written</em>}</blockquote>
              {q.feedback && <p className="feedback">{q.feedback}</p>}
              <div className="stepper" aria-label={`Marks for question ${q.number}`}>
                <button
                  className="icon-btn"
                  onClick={() => changeMark(q.number, -0.5)}
                  disabled={q.awarded <= 0}
                  aria-label="Half a mark less"
                >
                  <Icon name="minus" />
                </button>
                <span className="marks">
                  {formatMarks(q.awarded)} <span className="muted">/ {formatMarks(q.maxMarks)}</span>
                </span>
                <button
                  className="icon-btn"
                  onClick={() => changeMark(q.number, 0.5)}
                  disabled={q.awarded >= q.maxMarks}
                  aria-label="Half a mark more"
                >
                  <Icon name="plus" />
                </button>
              </div>
            </article>
          );
        })}

        <label className="card field">
          <span>Comment for the student</span>
          <textarea
            rows={3}
            value={draft.overallComment}
            onChange={(e) => setDraft({ ...draft, overallComment: e.target.value })}
          />
        </label>

        {isExample ? (
          <button className="btn primary" onClick={reset}>
            Close example
          </button>
        ) : (
          <button className="btn primary" onClick={approve}>
            <Icon name="check" /> Approve and save
          </button>
        )}
        {!isExample && (
          <button className="btn ghost" onClick={reset}>
            Discard
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="stack">
      {fileInputs}
      {savedNotice && (
        <div className="notice good" role="status">
          <Icon name="check" size={20} />
          <p>
            {savedNotice}.{" "}
            <a href="#results" onClick={() => goTo("results")}>
              View results
            </a>
          </p>
        </div>
      )}

      <div className="hero">
        <h1>Mark a script in seconds</h1>
        <p className="muted">Take a photo of a handwritten answer sheet. You check and approve every mark.</p>
      </div>

      <div className="card test-card">
        <div>
          <p className="label">Marking with</p>
          <p className="test-name">
            {[guide.classLevel, guide.subject].filter(Boolean).join(" ")} · {guide.title || "Untitled test"}
          </p>
          <p className="muted">
            {guide.questions.length} question{guide.questions.length === 1 ? "" : "s"} ·{" "}
            {formatMarks(totalMarks(guide))} marks
          </p>
        </div>
        <a className="link" href="#guide">
          Change
        </a>
      </div>

      {!server.checking && server.reachable && !server.keyConfigured && (
        <div className="notice warn">
          <Icon name="alert" size={20} />
          <p>
            The AI key is not set up yet, so real photos can't be marked. Add <code>ANTHROPIC_API_KEY</code> in your
            hosting settings (see SETUP.md).
          </p>
        </div>
      )}
      {!server.checking && !server.reachable && (
        <div className="notice bad">
          <Icon name="alert" size={20} />
          <p>Can't reach the marking server. Check the internet connection.</p>
        </div>
      )}

      <button className="btn primary big" onClick={() => cameraInput.current?.click()}>
        <Icon name="camera" size={24} /> Take a photo of the script
      </button>
      <button className="btn" onClick={() => galleryInput.current?.click()}>
        <Icon name="gallery" /> Choose a photo from the gallery
      </button>

      <ul className="tips">
        <li>Lay the sheet flat in good light.</li>
        <li>Fit the whole page in the photo.</li>
        <li>One page per photo.</li>
      </ul>

      <button className="btn ghost" onClick={showExample}>
        See an example result
      </button>
    </section>
  );
}
