import Icon from "../components/Icon.jsx";
import { SAMPLE_GUIDE } from "../lib/sampleGuide.js";
import { formatMarks } from "../lib/stats.js";

function newGuideId() {
  return "test-" + Date.now().toString(36);
}

export default function GuidePage({ guide, setGuide }) {
  const total = guide.questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0);

  const setField = (field, value) => setGuide({ ...guide, [field]: value });

  const setQuestion = (index, field, value) =>
    setGuide({
      ...guide,
      questions: guide.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    });

  const addQuestion = () =>
    setGuide({
      ...guide,
      questions: [
        ...guide.questions,
        { number: String(guide.questions.length + 1), question: "", maxMarks: 1, answer: "" },
      ],
    });

  const removeQuestion = (index) => {
    const q = guide.questions[index];
    if ((q.question || q.answer) && !window.confirm(`Remove question ${q.number}?`)) return;
    setGuide({ ...guide, questions: guide.questions.filter((_, i) => i !== index) });
  };

  const startNew = () => {
    if (!window.confirm("Start a new test? The current questions will be replaced.")) return;
    setGuide({
      id: newGuideId(),
      title: "",
      subject: guide.subject,
      classLevel: guide.classLevel,
      questions: [{ number: "1", question: "", maxMarks: 1, answer: "" }],
    });
  };

  const resetSample = () => {
    if (window.confirm("Replace the current questions with the sample JSS2 Basic Science test?")) {
      setGuide(SAMPLE_GUIDE);
    }
  };

  const problems = guide.questions.filter((q) => !String(q.answer).trim() || !(Number(q.maxMarks) > 0)).length;

  return (
    <section className="stack">
      <div className="hero">
        <h1>Marking guide</h1>
        <p className="muted">
          Write each question, its marks and what earns the marks. The AI marks only by this guide. Changes save
          automatically.
        </p>
      </div>

      <div className="card stack-sm">
        <label className="field">
          <span>Test name</span>
          <input value={guide.title} placeholder="e.g. First Term Test" onChange={(e) => setField("title", e.target.value)} />
        </label>
        <div className="row-2">
          <label className="field">
            <span>Subject</span>
            <input value={guide.subject} placeholder="e.g. Basic Science" onChange={(e) => setField("subject", e.target.value)} />
          </label>
          <label className="field">
            <span>Class</span>
            <input value={guide.classLevel} placeholder="e.g. JSS2" onChange={(e) => setField("classLevel", e.target.value)} />
          </label>
        </div>
        <p className="muted small">
          {guide.questions.length} question{guide.questions.length === 1 ? "" : "s"} · {formatMarks(total)} marks in total
        </p>
      </div>

      {problems > 0 && (
        <div className="notice warn">
          <Icon name="alert" size={20} />
          <p>
            {problems} question{problems === 1 ? " needs" : "s need"} marks and a marking guide before you can mark
            scripts.
          </p>
        </div>
      )}

      {guide.questions.map((q, index) => (
        <article key={index} className="card stack-sm">
          <div className="row-q">
            <label className="field narrow">
              <span>No.</span>
              <input value={q.number} onChange={(e) => setQuestion(index, "number", e.target.value)} />
            </label>
            <label className="field narrow">
              <span>Marks</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.5"
                step="0.5"
                value={q.maxMarks}
                onChange={(e) => setQuestion(index, "maxMarks", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <button className="icon-btn danger" onClick={() => removeQuestion(index)} aria-label={`Remove question ${q.number}`}>
              <Icon name="trash" />
            </button>
          </div>
          <label className="field">
            <span>Question</span>
            <textarea rows={2} value={q.question} onChange={(e) => setQuestion(index, "question", e.target.value)} />
          </label>
          <label className="field">
            <span>Marking guide (correct answer and how marks are given)</span>
            <textarea
              rows={3}
              value={q.answer}
              placeholder="e.g. Solid (1), liquid (1), gas (1)"
              onChange={(e) => setQuestion(index, "answer", e.target.value)}
            />
          </label>
        </article>
      ))}

      <button className="btn" onClick={addQuestion}>
        <Icon name="plus" /> Add a question
      </button>
      <button className="btn" onClick={() => window.print()}>
        <Icon name="print" /> Print a blank answer sheet
      </button>
      <div className="row-2">
        <button className="btn ghost" onClick={startNew}>
          Start a new test
        </button>
        <button className="btn ghost" onClick={resetSample}>
          Use the sample test
        </button>
      </div>
    </section>
  );
}
