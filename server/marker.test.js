import { describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { buildResult, markScript, MarkerError, toFriendlyError, validateRequest } from "./marker.js";
import { SAMPLE_GUIDE } from "../src/lib/sampleGuide.js";

const IMAGE = Buffer.from("fake image bytes").toString("base64");

function fakeClient(response) {
  const create = vi.fn().mockResolvedValue(response);
  return { client: { beta: { messages: { create } } }, create };
}

function modelReply(payload, stop_reason = "end_turn") {
  return {
    model: "claude-opus-5-5",
    stop_reason,
    content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify(payload) }],
  };
}

const GOOD_REPLY = {
  readable: true,
  problem: "",
  studentName: "Ada",
  overallComment: "Well done.",
  questions: [
    { number: "1", studentAnswer: "all classes of food", awarded: 1, feedback: "Add proportions.", needsReview: false },
    { number: "2", studentAnswer: "solid liquid gas", awarded: 3, feedback: "Correct.", needsReview: false },
    { number: "3", studentAnswer: "net", awarded: 1.3, feedback: "One way.", needsReview: false },
    { number: "4", studentAnswer: "pumps blood", awarded: 5, feedback: "Correct.", needsReview: false },
    // question 5 missing on purpose
  ],
};

describe("validateRequest", () => {
  it("accepts a normal request", () => {
    const req = validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE });
    expect(req.guide.questions).toHaveLength(5);
    expect(req.guide.questions[0].maxMarks).toBe(2);
  });

  it("rejects a missing photo, wrong type, empty guide and bad marks", () => {
    expect(() => validateRequest({ mediaType: "image/jpeg", guide: SAMPLE_GUIDE })).toThrow(MarkerError);
    expect(() => validateRequest({ image: IMAGE, mediaType: "application/pdf", guide: SAMPLE_GUIDE })).toThrow(
      /file type/,
    );
    expect(() => validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: { questions: [] } })).toThrow(
      /no questions/,
    );
    const badMarks = { questions: [{ number: "1", maxMarks: "", answer: "x" }] };
    expect(() => validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: badMarks })).toThrow(/mark between/);
    const noAnswer = { questions: [{ number: "1", maxMarks: 2, answer: " " }] };
    expect(() => validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: noAnswer })).toThrow(/model answer/);
  });

  it("rejects duplicate question numbers and oversized photos", () => {
    const dup = { questions: [{ number: "1", maxMarks: 1, answer: "a" }, { number: "1", maxMarks: 1, answer: "b" }] };
    expect(() => validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: dup })).toThrow(/same number/);
    const huge = "A".repeat(7 * 1024 * 1024);
    expect(() => validateRequest({ image: huge, mediaType: "image/jpeg", guide: SAMPLE_GUIDE })).toThrow(/too large/);
  });
});

describe("buildResult", () => {
  const guide = validateRequest({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE }).guide;

  it("clamps marks, rounds to halves, flags missing answers and recomputes the total", () => {
    const result = buildResult(GOOD_REPLY, guide);
    const byNumber = Object.fromEntries(result.questions.map((q) => [q.number, q]));
    expect(byNumber["3"].awarded).toBe(1.5);
    expect(byNumber["4"].awarded).toBe(1); // capped at the maximum
    expect(byNumber["4"].needsReview).toBe(true); // over-max marks get a second look
    expect(byNumber["5"]).toMatchObject({ awarded: 0, needsReview: true });
    expect(result.score).toBe(1 + 3 + 1.5 + 1 + 0);
    expect(result.maxScore).toBe(10);
    expect(result.studentName).toBe("Ada");
  });

  it("turns an unreadable photo into a clear message", () => {
    expect(() => buildResult({ readable: false, problem: "Too blurry.", questions: [] }, guide)).toThrow("Too blurry.");
  });
});

describe("markScript", () => {
  it("sends the photo before the marking guide with structured output and fallbacks", async () => {
    const { client, create } = fakeClient(modelReply(GOOD_REPLY));
    const result = await markScript({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE }, { client });

    const params = create.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.fallbacks).toBe("default");
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.output_config.effort).toBe("low");
    expect(params.thinking).toBeUndefined();
    expect(params.temperature).toBeUndefined();
    const [imageBlock, textBlock] = params.messages[0].content;
    expect(imageBlock).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: IMAGE } });
    expect(textBlock.text).toContain("Question 2 (maximum 3 marks)");
    expect(textBlock.text).toContain("Solid (1), liquid (1), gas (1)");
    expect(result.score).toBe(6.5);
  });

  it("handles refusals and cut-off replies", async () => {
    const refused = fakeClient(modelReply({}, "refusal"));
    await expect(
      markScript({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE }, { client: refused.client }),
    ).rejects.toThrow(/mark it by hand/);

    const cut = fakeClient({ model: "m", stop_reason: "max_tokens", content: [{ type: "text", text: "{" }] });
    await expect(
      markScript({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE }, { client: cut.client }),
    ).rejects.toThrow(/too long/);
  });

  it("explains a missing AI key before calling the AI", async () => {
    const saved = { key: process.env.ANTHROPIC_API_KEY, token: process.env.ANTHROPIC_AUTH_TOKEN };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    try {
      await expect(markScript({ image: IMAGE, mediaType: "image/jpeg", guide: SAMPLE_GUIDE })).rejects.toThrow(
        /ANTHROPIC_API_KEY/,
      );
    } finally {
      if (saved.key !== undefined) process.env.ANTHROPIC_API_KEY = saved.key;
      if (saved.token !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = saved.token;
    }
  });

  it("does not call the AI when the request is invalid", async () => {
    const { client, create } = fakeClient(modelReply(GOOD_REPLY));
    await expect(markScript({ image: "", mediaType: "image/jpeg", guide: SAMPLE_GUIDE }, { client })).rejects.toThrow(
      MarkerError,
    );
    expect(create).not.toHaveBeenCalled();
  });
});

describe("toFriendlyError", () => {
  it("explains a bad API key in plain words", () => {
    const err = new Anthropic.AuthenticationError(401, { type: "error" }, "invalid x-api-key", new Headers());
    const friendly = toFriendlyError(err);
    expect(friendly.status).toBe(500);
    expect(friendly.message).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("maps rate limits and timeouts", () => {
    expect(toFriendlyError(new Anthropic.RateLimitError(429, {}, "slow down", new Headers())).status).toBe(429);
    expect(toFriendlyError(new Anthropic.APIConnectionTimeoutError()).status).toBe(504);
  });
});
