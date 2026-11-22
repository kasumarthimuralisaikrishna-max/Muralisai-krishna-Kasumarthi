import React, { useState } from "react";
import { ResearchAppTab, Sidebar } from "./components/Sidebar";
import { HomeView } from "./components/HomeView";
import { GeneratorView } from "./components/GeneratorView";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { ResearchChatView } from "./components/ResearchChatView";
import { PythonProjectView } from "./components/PythonProjectView";
import {
  AdvisorRole,
  EMPTY_RESEARCH_INPUT,
  GeneratedResearchData,
  ResearchChatMessage,
  ResearchFormInput,
  SAMPLE_PROJECTS,
  countWords,
  loadResearchChatHistory,
  saveResearchChatHistory,
} from "./types/research";

export default function App() {
  const [activeTab, setActiveTab] = useState<ResearchAppTab>("home");
  const [input, setInput] = useState<ResearchFormInput>(EMPTY_RESEARCH_INPUT);
  const [resolvedDomain, setResolvedDomain] = useState<string>("");
  const [researchData, setResearchData] =
    useState<GeneratedResearchData | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<ResearchChatMessage[]>(() =>
    loadResearchChatHistory()
  );
  const [advisorRole, setAdvisorRole] = useState<AdvisorRole>("methodology");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRegeneratingAbstract, setIsRegeneratingAbstract] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = <K extends keyof ResearchFormInput>(
    key: K,
    value: ResearchFormInput[K]
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleLoadSample = (sampleIndex: number) => {
    const preset = SAMPLE_PROJECTS[sampleIndex];
    if (!preset) return;
    setInput(preset.input);
    setErrorMessage(null);
    setActiveTab("generator");
  };

  const validateClientInput = (): string | null => {
    const idea = input.projectIdea.trim();
    if (!idea) {
      return "Please enter your project idea before generating research content.";
    }
    if (idea.length < 15 || countWords(idea) < 4) {
      return "Please describe your project idea in at least 4 words (2–3 clear lines work best).";
    }
    if (input.domain === "Other" && input.customDomain.trim().length < 2) {
      return "Please enter a custom domain name when 'Other' is selected.";
    }
    return null;
  };

  const handleGenerateResearch = async () => {
    const validationErr = validateClientInput();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate research content.");
      }

      setResearchData(data.research as GeneratedResearchData);
      setResolvedDomain(
        data.resolvedDomain ||
          (input.domain === "Other" ? input.customDomain.trim() : input.domain)
      );
      setSelectedTitleIndex(0);
      setSuccessMessage(
        `Research package generated successfully (${data.research.abstractWordCount}-word abstract).`
      );
      setActiveTab("results");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to generate research content. Please retry."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateAbstract = async () => {
    if (!researchData) return;

    setIsRegeneratingAbstract(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const selectedTitle =
        researchData.titles[selectedTitleIndex]?.title || "";
      const response = await fetch("/api/research/regenerate-abstract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          selectedTitle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate abstract.");
      }

      setResearchData((prev) =>
        prev
          ? {
              ...prev,
              abstract: data.abstract,
              abstractWordCount: data.abstractWordCount,
            }
          : prev
      );
      setSuccessMessage(
        `Abstract regenerated (${data.abstractWordCount} words).`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to regenerate abstract. Please try again."
      );
    } finally {
      setIsRegeneratingAbstract(false);
    }
  };

  const handleGenerateNew = () => {
    setResearchData(null);
    setSelectedTitleIndex(0);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab("generator");
  };

  const activeSelectedTitle =
    researchData?.titles[selectedTitleIndex]?.title || "";
  const activeDomainDisplay =
    resolvedDomain ||
    (input.domain === "Other" ? input.customDomain.trim() : input.domain);

  const handleSendChatMessage = async (text: string) => {
    const userMessage: ResearchChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    const assistantId = `${Date.now()}-model`;
    const placeholderAssistant: ResearchChatMessage = {
      id: assistantId,
      role: "model",
      text: "",
      timestamp: new Date().toISOString(),
    };

    const messagesForRequest = [...chatMessages, userMessage];
    setChatMessages([...messagesForRequest, placeholderAssistant]);
    saveResearchChatHistory(messagesForRequest);
    setIsSendingChat(true);
    setChatError(null);

    let streamedText = "";

    try {
      const response = await fetch("/api/research/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          advisorRole,
          messages: messagesForRequest.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          researchContext: {
            projectIdea: input.projectIdea.trim(),
            domain: activeDomainDisplay,
            selectedTitle: activeSelectedTitle,
            abstract: researchData?.abstract || "",
          },
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response from AI Advisor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const line = evt
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;

          const payload = JSON.parse(line.slice(6)) as {
            chunk?: string;
            done?: boolean;
            error?: string;
          };

          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.chunk) {
            streamedText += payload.chunk;
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: streamedText } : m
              )
            );
          }
        }
      }

      if (!streamedText.trim()) {
        throw new Error("Gemini returned an empty response. Please try again.");
      }

      const finalAssistant: ResearchChatMessage = {
        id: assistantId,
        role: "model",
        text: streamedText.trim(),
        timestamp: new Date().toISOString(),
      };
      const finalHistory = [...messagesForRequest, finalAssistant];
      setChatMessages(finalHistory);
      saveResearchChatHistory(finalHistory);
    } catch (err) {
      setChatMessages(messagesForRequest);
      saveResearchChatHistory(messagesForRequest);
      setChatError(
        err instanceof Error
          ? err.message
          : "Unable to reach AI Research Advisor. Please try again."
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    saveResearchChatHistory([]);
    setChatError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        hasResults={Boolean(researchData)}
        onSelectTab={(tab) => {
          setErrorMessage(null);
          setActiveTab(tab);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          {activeTab === "home" && (
            <HomeView
              onGoToGenerator={() => setActiveTab("generator")}
              onQuickStartSample={handleLoadSample}
            />
          )}

          {activeTab === "generator" && (
            <GeneratorView
              input={input}
              isGenerating={isGenerating}
              errorMessage={errorMessage}
              onChangeInput={handleInputChange}
              onLoadSample={handleLoadSample}
              onResetForm={() => {
                setInput(EMPTY_RESEARCH_INPUT);
                setErrorMessage(null);
              }}
              onSubmit={handleGenerateResearch}
            />
          )}

          {activeTab === "results" &&
            (researchData ? (
              <ResultsDashboard
                input={input}
                resolvedDomain={resolvedDomain}
                data={researchData}
                selectedTitleIndex={selectedTitleIndex}
                isRegeneratingAbstract={isRegeneratingAbstract}
                errorMessage={errorMessage}
                successMessage={successMessage}
                onSelectTitle={setSelectedTitleIndex}
                onRegenerateAbstract={handleRegenerateAbstract}
                onGenerateNew={handleGenerateNew}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
                  No Research Results Generated Yet
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Enter your project idea in the Generator to create titles, a 150–200 word abstract, keywords, objectives, and future enhancements.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("generator")}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs cursor-pointer"
                >
                  Open Generator
                </button>
              </div>
            ))}

          {activeTab === "chat" && (
            <ResearchChatView
              projectIdea={input.projectIdea}
              resolvedDomain={activeDomainDisplay}
              selectedTitle={activeSelectedTitle}
              messages={chatMessages}
              advisorRole={advisorRole}
              isSending={isSendingChat}
              errorMessage={chatError}
              onChangeRole={(role) => setAdvisorRole(role)}
              onSendMessage={handleSendChatMessage}
              onClearChat={handleClearChat}
            />
          )}

          {activeTab === "python" && <PythonProjectView />}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>AI Research Title &amp; Abstract Generator</span>
            <div className="flex items-center gap-2">
              <span>3 Titles</span>
              <span aria-hidden="true">·</span>
              <span>150–200 Word Abstract</span>
              <span aria-hidden="true">·</span>
              <span>AI Research Advisor Chat</span>
              <span aria-hidden="true">·</span>
              <span>TXT &amp; PDF Export</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
