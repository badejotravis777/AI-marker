import { describe, expect, it } from "vitest";
import { estimateImpact, summarize, toCsv } from "./stats.js";

const guide = { id: "g1", questions: [{ number: "1", question: "A?" }, { number: "2", question: "B?" }] };

const results = [
  {
    id: "a",
    guideId: "g1",
    studentName: "Ada",
    score: 3,
    maxScore: 4,
    overallComment: "Good",
    markedAt: "2026-11-16T09:00:00.000Z",
    secondsTaken: 10,
    questions: [
      { number: "1", maxMarks: 2, awarded: 2, aiAwarded: 2 },
      { number: "2", maxMarks: 2, awarded: 1, aiAwarded: 0.5 },
    ],
  },
  {
    id: "b",
    guideId: "g1",
    studentName: "=HYPERLINK(\"x\")",
    score: 1,
    maxScore: 4,
    overallComment: 'Said "hi", then left',
    markedAt: "2026-11-16T09:05:00.000Z",
    secondsTaken: 14,
    questions: [
      { number: "1", maxMarks: 2, awarded: 1, aiAwarded: 1 },
      { number: "2", maxMarks: 2, awarded: 0, aiAwarded: 0 },
    ],
  },
];

describe("summarize", () => {
  it("finds the average, the extremes, the hardest question and teacher changes", () => {
    const s = summarize(results, guide);
    expect(s.count).toBe(2);
    expect(s.average).toBe(50);
    expect(s.highest.id).toBe("a");
    expect(s.lowest.id).toBe("b");
    expect(s.hardest).toMatchObject({ number: "2", average: 25 });
    expect(s.changedMarks).toBe(1);
    expect(s.totalMarks).toBe(4);
  });
});

describe("toCsv", () => {
  it("escapes quotes and blocks spreadsheet formulas", () => {
    const csv = toCsv(results);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Student,Score,Out of,Percent,Q1,Q2,Comment,Marked on");
    expect(lines[2].startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true);
    expect(lines[2]).toContain(`"Said ""hi"", then left"`);
  });
});

describe("estimateImpact", () => {
  it("works out hours saved per term", () => {
    const i = estimateImpact({ teachers: 20, scriptsPerTeacher: 150, minutesByHand: 3, minutesWithApp: 1, examsPerTerm: 2 });
    expect(i.scripts).toBe(6000);
    expect(i.hoursSaved).toBe(200);
    expect(i.workingDaysSaved).toBe(25);
    expect(i.hoursSavedPerTeacher).toBe(10);
  });
});
