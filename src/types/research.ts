export const RESEARCH_DOMAINS = [
  "Artificial Intelligence (AI)",
  "Internet of Things (IoT)",
  "Web Development",
  "Cybersecurity",
  "Machine Learning",
  "Data Science",
  "Cloud Computing",
  "Blockchain",
  "Other",
] as const;

export type ResearchDomain = (typeof RESEARCH_DOMAINS)[number];
export type ResearchLevel = "Beginner" | "Intermediate" | "Advanced";
export type WritingStyle = "Simple Academic" | "Professional Academic";
export type ResearchFocus =
  | "Implementation"
  | "Analysis"
  | "Comparison"
  | "Innovation";

export interface ResearchFormInput {
  projectIdea: string;
  domain: ResearchDomain;
  customDomain: string;
  researchLevel: ResearchLevel;
  writingStyle: WritingStyle;
  researchFocus: ResearchFocus;
}

export interface ResearchTitleOption {
  title: string;
  approach: string;
}

export interface FutureEnhancementItem {
  title: string;
  description: string;
}

export interface GeneratedResearchData {
  titles: ResearchTitleOption[];
  abstract: string;
  abstractWordCount: number;
  keywords: string[];
  objectives: string[];
  futureEnhancements: FutureEnhancementItem[];
}

export interface SampleProjectPreset {
  name: string;
  input: ResearchFormInput;
}

export const SAMPLE_PROJECTS: SampleProjectPreset[] = [
  {
    name: "Fake News Detection Using Machine Learning",
    input: {
      projectIdea:
        "Detect fake news articles across online social platforms using machine learning and natural language processing techniques to improve information verification accuracy.",
      domain: "Machine Learning",
      customDomain: "",
      researchLevel: "Intermediate",
      writingStyle: "Professional Academic",
      researchFocus: "Implementation",
    },
  },
  {
    name: "Smart Irrigation System Using IoT",
    input: {
      projectIdea:
        "Build an automated smart irrigation system using soil moisture sensors, weather data, and IoT microcontrollers to optimize agricultural water usage and crop health.",
      domain: "Internet of Things (IoT)",
      customDomain: "",
      researchLevel: "Beginner",
      writingStyle: "Simple Academic",
      researchFocus: "Implementation",
    },
  },
  {
    name: "Secure Online Payment System Using Cybersecurity",
    input: {
      projectIdea:
        "Design a secure online payment gateway architecture incorporating tokenization, multi-factor verification, and anomaly detection to reduce digital transaction fraud.",
      domain: "Cybersecurity",
      customDomain: "",
      researchLevel: "Advanced",
      writingStyle: "Professional Academic",
      researchFocus: "Innovation",
    },
  },
  {
    name: "AI-Based Student Performance Prediction",
    input: {
      projectIdea:
        "Predict student academic performance early using attendance, quiz scores, and LMS engagement patterns with explainable AI models to support timely faculty mentoring.",
      domain: "Artificial Intelligence (AI)",
      customDomain: "",
      researchLevel: "Intermediate",
      writingStyle: "Professional Academic",
      researchFocus: "Analysis",
    },
  },
  {
    name: "Online Food Ordering Web Application",
    input: {
      projectIdea:
        "Develop a responsive full-stack online food ordering web platform with real-time order tracking, personalized restaurant recommendations, and streamlined checkout workflows.",
      domain: "Web Development",
      customDomain: "",
      researchLevel: "Beginner",
      writingStyle: "Simple Academic",
      researchFocus: "Implementation",
    },
  },
];

export const EMPTY_RESEARCH_INPUT: ResearchFormInput = {
  projectIdea: "",
  domain: "Machine Learning",
  customDomain: "",
  researchLevel: "Intermediate",
  writingStyle: "Professional Academic",
  researchFocus: "Implementation",
};

export function countWords(text: string): number {
  const matches = (text || "").trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export type AdvisorRole = "methodology" | "reviewer" | "writer";

export interface ResearchChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

const RESEARCH_CHAT_STORAGE_KEY = "ai_research_advisor_chat_v1";

export function loadResearchChatHistory(): ResearchChatMessage[] {
  try {
    const raw = localStorage.getItem(RESEARCH_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResearchChatHistory(messages: ResearchChatMessage[]): void {
  try {
    localStorage.setItem(RESEARCH_CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore storage quota errors
  }
}

