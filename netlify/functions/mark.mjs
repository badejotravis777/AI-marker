// Netlify Function: POST /api/mark marks one answer sheet, GET /api/mark reports status.
import { markScript, status, MarkerError } from "../../server/marker.js";

const json = (statusCode, data) =>
  new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  if (req.method === "GET") return json(200, status());
  if (req.method !== "POST") return json(405, { error: "Use POST to mark a script." });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "The request could not be read. Please try again." });
  }

  try {
    // Netlify stops functions after about 30 seconds, so give up a little earlier
    // and show the teacher a clear message instead.
    const result = await markScript(body, { timeoutMs: 25_000, maxRetries: 1 });
    return json(200, result);
  } catch (error) {
    const status = error instanceof MarkerError ? error.status : 500;
    const message = error instanceof MarkerError ? error.message : "Something went wrong while marking.";
    return json(status, { error: message });
  }
};

export const config = { path: "/api/mark" };
