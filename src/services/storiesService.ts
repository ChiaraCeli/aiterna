
import type {
  InteractiveStory,
  StartStoryRequest,
  StoryChoice,
} from "@/types/stories";

interface GeneratedStoryResponse {
  title: string;
  content: string;
  choices: StoryChoice[];
}

interface StoryStreamCallbacks {
  onChunk: (content: string) => void;
  onChoices: (choices: StoryChoice[]) => void;
}

const API_BASE_URL = "http://localhost:8787";

export const generateStory = async (
  request: StartStoryRequest,
): Promise<GeneratedStoryResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/stories/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to generate story.");
  }

  return response.json() as Promise<GeneratedStoryResponse>;
};

export const continueStoryStream = async (
  story: InteractiveStory,
  callbacks: StoryStreamCallbacks,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/stories/continue/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: story.prompt,
        title: story.title,
        language: story.language,
        scenes: story.scenes.map((scene) => ({
          content: scene.content,
          choices: scene.choices,
          selectedChoiceId: scene.selectedChoiceId,
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to start story streaming.");
  }

  if (!response.body) {
    throw new Error("Story streaming is not supported.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let isDone = false;
  let receivedChoices = false;

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
      case "chunk":
        if (typeof parsed.content === "string") {
          callbacks.onChunk(parsed.content);
        }
        break;

      case "choices":
        if (
          Array.isArray(parsed.choices) &&
          parsed.choices.length === 5
        ) {
          callbacks.onChoices(parsed.choices);
          receivedChoices = true;
        }
        break;

      case "done":
        isDone = true;
        break;

      case "error":
        throw new Error(
          parsed.message ?? "Story streaming failed.",
        );
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
    buffer = buffer.replace(/\r\n/g, "\n");

    if (buffer.trim()) {
      processEvent(buffer);
    }

    if (!isDone || !receivedChoices) {
      throw new Error("Story stream ended unexpectedly.");
    }
  } finally {
    reader.releaseLock();
  }
};
