import type {
  ExploreRequest,
  ReadingSource,
} from "@/types/explore";

const API_URL = "http://localhost:8787";

interface ExploreStreamCallbacks {
  onMetadata: (metadata: { title: string; sources: ReadingSource[] }) => void;
  onChunk: (content: string) => void;
}

const readAIStream = async (
  response: Response,
  callbacks: {
    onMetadata?: (metadata: {
      title: string;
      sources: ReadingSource[];
    }) => void;
    onChunk: (content: string) => void;
  },
): Promise<void> => {
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
        callbacks.onMetadata?.(parsed);
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

  await readAIStream(response, callbacks);
};

interface ExploreContinuationRequest {
  title: string;
  previousContent: string;
  sourceUrl: string;
  language: "it" | "en";
}

export const continueExploreReading = async (
  request: ExploreContinuationRequest,
  onChunk: (content: string) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/explore/continue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  await readAIStream(response, {
    onChunk,
  });
};

