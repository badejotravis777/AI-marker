// Talks to the marking server (/api/mark). The AI key lives on the server, never here.
export async function markPhoto({ base64, mediaType, guide }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let response;
  try {
    response = await fetch("/api/mark", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: base64, mediaType, guide }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Marking took too long. Check the internet connection and try again.");
    }
    throw new Error("No internet connection to the marking server. Check your data or Wi-Fi.");
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Hosting errors (for example a timeout page) are not JSON.
  }
  if (!response.ok || !data) {
    throw new Error(data?.error || "Marking took too long or the server had a problem. Please try again.");
  }
  return data;
}

export async function checkServer() {
  try {
    const response = await fetch("/api/mark", { method: "GET" });
    if (!response.ok) return { reachable: false };
    const data = await response.json();
    return { reachable: true, keyConfigured: Boolean(data.keyConfigured) };
  } catch {
    return { reachable: false };
  }
}
