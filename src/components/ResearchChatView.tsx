import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  AdvisorRole,
  ResearchChatMessage,
} from "../types/research";

interface ResearchChatViewProps {
  projectIdea: string;
  resolvedDomain: string;
  selectedTitle: string;
  messages: ResearchChatMessage[];
  advisorRole: AdvisorRole;
  isSending: boolean;
  errorMessage: string | null;
  onChangeRole: (role: AdvisorRole) => void;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

const ADVISOR_ROLES: Array<{
  id: AdvisorRole;
  label: string;
  description: string;
  starters: (domain: string, hasTitle: boolean) => string[];
}> = [
  {
    id: "methodology",
    label: "Methodology Advisor",
    description:
      "Get guidance on research design, datasets, evaluation metrics, and baseline comparisons.",
    starters: (domain, hasTitle) => [
      hasTitle
        ? "What evaluation metrics and baseline comparisons fit my current research topic?"
        : `Suggest a realistic research methodology and evaluation metrics for a ${domain} student project.`,
      `What publicly available datasets or tools are commonly used in ${domain} research?`,
      "How should I structure the system architecture diagram section of my paper?",
    ],
  },
  {
    id: "reviewer",
    label: "Peer Reviewer",
    description:
      "Receive constructive academic critique on clarity, scope, and problem framing.",
    starters: (_domain, hasTitle) => [
      hasTitle
        ? "Critique my selected title and abstract—what could a reviewer question or ask me to clarify?"
        : "What are the most common mistakes students make when writing a research abstract?",
      "Is my research scope realistic for a single-semester undergraduate capstone project?",
      "How can I make my problem statement sharper and more convincing?",
    ],
  },
  {
    id: "writer",
    label: "Academic Writer",
    description:
      "Refine scholarly phrasing, draft an introduction outline, or structure a literature survey.",
    starters: (domain) => [
      `Help me outline the Introduction and Related Work sections for a ${domain} paper.`,
      "Rewrite my rough project idea into a formal 3-sentence problem statement.",
      "How do I summarize existing literature gaps concisely without overclaiming?",
    ],
  },
];

export function ResearchChatView({
  projectIdea,
  resolvedDomain,
  selectedTitle,
  messages,
  advisorRole,
  isSending,
  errorMessage,
  onChangeRole,
  onSendMessage,
  onClearChat,
}: ResearchChatViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [inputText, setInputText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activeRoleMeta =
    ADVISOR_ROLES.find((r) => r.id === advisorRole) || ADVISOR_ROLES[0];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) {
      setLocalError("Please enter a message before sending.");
      return;
    }
    setLocalError(null);
    setInputText("");
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && inputText.trim()) {
        const trimmed = inputText.trim();
        setLocalError(null);
        setInputText("");
        onSendMessage(trimmed);
      }
    }
  };

  const combinedError = localError || errorMessage;
  const displayDomain = resolvedDomain || "Academic Research";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto space-y-5"
    >
      {/* Header & Advisor Role Switcher */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              AI Research Advisor Chat
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate max-w-xl">
              {selectedTitle
                ? `Active Paper: ${selectedTitle}`
                : projectIdea.trim()
                ? `Active Idea (${displayDomain}): ${projectIdea.trim()}`
                : `Domain: ${displayDomain} · Multi-turn research guidance`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
              {ADVISOR_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onChangeRole(role.id)}
                  className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    advisorRole === role.id
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 pt-3 border-t border-slate-200 text-xs sm:text-sm text-slate-600">
          {activeRoleMeta.description}
        </p>
      </section>

      {/* Scrollable Chat Thread & Input */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div
          className="h-[460px] overflow-y-auto px-5 py-6 sm:px-7 space-y-5"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 mb-4">
                <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 mb-1.5">
                Consult your {activeRoleMeta.label}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Ask follow-up questions about your title, abstract, methodology, evaluation metrics, or paper structure.
              </p>

              <div className="w-full space-y-2.5 text-left">
                {activeRoleMeta
                  .starters(displayDomain, Boolean(selectedTitle))
                  .map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSending}
                      onClick={() => onSendMessage(starter)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-300 px-4 py-3 text-xs sm:text-sm text-slate-700 transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      {starter}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const isStreamingEmpty = !isUser && !msg.text && isSending;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                      isUser
                        ? "bg-blue-600 text-white"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>

                  <div
                    className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-slate-50 border border-slate-200 text-slate-800"
                    }`}
                  >
                    {isStreamingEmpty ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2
                          className="h-4 w-4 animate-spin text-purple-600"
                          aria-hidden="true"
                        />
                        <span>Replying...</span>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        <div
                          className={`mt-1.5 font-mono tabular-nums text-[11px] ${
                            isUser ? "text-blue-100/85 text-right" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div ref={threadEndRef} />
        </div>

        {combinedError && (
          <div
            role="alert"
            className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs sm:text-sm text-red-800"
          >
            <AlertCircle
              className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{combinedError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-slate-50/70 p-4 sm:px-6"
        >
          <div className="flex items-end gap-3">
            <label htmlFor="research-chat-input" className="sr-only">
              Ask your AI Research Advisor
            </label>
            <textarea
              id="research-chat-input"
              rows={2}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (localError) setLocalError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={`Ask your ${activeRoleMeta.label} (Press Enter to send, Shift+Enter for new line)...`}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>Send</span>
            </button>
          </div>
        </form>
      </section>
    </motion.div>
  );
}
