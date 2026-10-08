import type {
  ExploreRequest,
  ReadingSection,
  ReadingSource,
} from "@/types/explore";

const API_URL = "http://localhost:8787";

interface ExploreStreamCallbacks {
  onMetadata: (metadata: { title: string; sources: ReadingSource[] }) => void;
  onChunk: (content: string) => void;
}

export const generateExploreReading = async (
  request: ExploreRequest,
  language: "it" | "en",
  callbacks: ExploreStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/explore`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      language,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to generate reading.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let completed = false;

  const processEvent = (rawEvent: string) => {
    const lines = rawEvent.split("\n");

    const event = lines
      .find((line) => line.startsWith("event:"))
      ?.slice(6)
      .trim();

    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!event || !data) return;

    const parsed = JSON.parse(data);

    switch (event) {
      case "metadata":
        callbacks.onMetadata(parsed);
        break;

      case "chunk":
        if (typeof parsed.content === "string") {
          callbacks.onChunk(parsed.content);
        }
        break;

      case "done":
        completed = true;
        break;

      case "error":
        throw new Error(parsed.message ?? "AI streaming error.");
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        processEvent(rawEvent);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processEvent(buffer);
    }

    if (!completed) {
      throw new Error("Reading stream ended unexpectedly.");
    }
  } finally {
    reader.releaseLock();
  }
};

// Per ora Tell me more resta mock.
export const continueExploreReading = async (): Promise<ReadingSection> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: `continuation-${Date.now()}`,
    content: `
And there is still more to discover.

Sometimes the most interesting part of a subject begins just after the obvious facts end. A small detail can open another path, and that path can lead somewhere completely unexpected.
      `.trim(),
  };
};
