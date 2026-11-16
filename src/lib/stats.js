// Numbers for the Results and Impact pages.

export function percent(score, max) {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

export function formatMarks(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function summarize(results, guide) {
  if (results.length === 0) {
    return { count: 0, average: 0, highest: null, lowest: null, hardest: null, changedMarks: 0, totalMarks: 0 };
  }
  const percents = results.map((r) => percent(r.score, r.maxScore));
  const average = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  const sorted = [...results].sort((a, b) => percent(b.score, b.maxScore) - percent(a.score, a.maxScore));

  // Hardest question: the lowest average among scripts marked with the current test.
  let hardest = null;
  const sameTest = results.filter((r) => r.guideId === guide?.id);
  if (sameTest.length > 0 && guide) {
    for (const q of guide.questions) {
      const scored = sameTest
        .map((r) => r.questions.find((item) => item.number === q.number))
        .filter(Boolean);
      if (scored.length === 0) continue;
      const avg = Math.round(
        (scored.reduce((sum, item) => sum + item.awarded / item.maxMarks, 0) / scored.length) * 100,
      );
      if (!hardest || avg < hardest.average) hardest = { number: q.number, question: q.question, average: avg };
    }
  }

  // How often the teacher changed the AI's mark: an honest accuracy measure.
  let changedMarks = 0;
  let totalMarks = 0;
  for (const r of results) {
    for (const q of r.questions) {
      totalMarks += 1;
      if (q.aiAwarded !== undefined && q.aiAwarded !== q.awarded) changedMarks += 1;
    }
  }

  return {
    count: results.length,
    average,
    highest: sorted[0],
    lowest: sorted[sorted.length - 1],
    hardest,
    changedMarks,
    totalMarks,
  };
}

export function averageSeconds(results) {
  const timed = results.filter((r) => Number.isFinite(r.secondsTaken));
  if (timed.length === 0) return null;
  return Math.round(timed.reduce((sum, r) => sum + r.secondsTaken, 0) / timed.length);
}

// Spreadsheet programs run cells that start with = + - @ as formulas, so those get a leading quote.
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(results) {
  const numbers = [];
  for (const r of results) {
    for (const q of r.questions) if (!numbers.includes(q.number)) numbers.push(q.number);
  }
  const header = ["Student", "Score", "Out of", "Percent", ...numbers.map((n) => `Q${n}`), "Comment", "Marked on"];
  const rows = results.map((r) => [
    r.studentName || "No name",
    r.score,
    r.maxScore,
    percent(r.score, r.maxScore),
    ...numbers.map((n) => r.questions.find((q) => q.number === n)?.awarded ?? ""),
    r.overallComment,
    new Date(r.markedAt).toLocaleString(),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function estimateImpact({ teachers, scriptsPerTeacher, minutesByHand, minutesWithApp, examsPerTerm }) {
  const scripts = teachers * scriptsPerTeacher * examsPerTerm;
  const hoursByHand = (scripts * minutesByHand) / 60;
  const hoursWithApp = (scripts * minutesWithApp) / 60;
  const hoursSaved = Math.max(0, hoursByHand - hoursWithApp);
  return {
    scripts,
    hoursByHand,
    hoursWithApp,
    hoursSaved,
    workingDaysSaved: hoursSaved / 8,
    hoursSavedPerTeacher: teachers > 0 ? hoursSaved / teachers : 0,
  };
}
