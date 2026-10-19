
export interface StoryChoice {
  id: string;
  text: string;
}

export interface StoryScene {
  id: string;
  content: string;
  choices: StoryChoice[];
  selectedChoiceId: string | null;
}

export interface InteractiveStory {
  id: string;
  prompt: string;
  title: string;
  language: "it" | "en";
  scenes: StoryScene[];
}

export interface StartStoryRequest {
  prompt: string;
  language: "it" | "en";
}

export interface ContinueStoryRequest {
  story: InteractiveStory;
  choiceId: string;
}
