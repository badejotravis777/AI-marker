// Printable answer sheet for the current test. Hidden on screen, shown when printing.
export default function AnswerSheet({ guide }) {
  return (
    <div className="answer-sheet" aria-hidden="true">
      <h1>{[guide.classLevel, guide.subject, guide.title].filter(Boolean).join(" · ") || "Answer sheet"}</h1>
      <div className="sheet-fields">
        <span>Name: ______________________________</span>
        <span>Class: __________</span>
        <span>Date: __________</span>
      </div>
      {guide.questions.map((q) => (
        <div key={q.number} className="sheet-q">
          <p>
            <strong>{q.number}.</strong> {q.question}{" "}
            <em>
              ({q.maxMarks} mark{Number(q.maxMarks) === 1 ? "" : "s"})
            </em>
          </p>
          <div className="sheet-lines">
            {Array.from({ length: Math.min(6, Math.max(2, Math.ceil(Number(q.maxMarks) || 1) + 1)) }).map((_, i) => (
              <div key={i} className="sheet-line" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
