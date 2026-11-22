import React from "react";
import {
  AlertCircle,
  BookOpen,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  RESEARCH_DOMAINS,
  ResearchDomain,
  ResearchFocus,
  ResearchFormInput,
  ResearchLevel,
  SAMPLE_PROJECTS,
  WritingStyle,
  countWords,
} from "../types/research";

interface GeneratorViewProps {
  input: ResearchFormInput;
  isGenerating: boolean;
  errorMessage: string | null;
  onChangeInput: <K extends keyof ResearchFormInput>(
    key: K,
    value: ResearchFormInput[K]
  ) => void;
  onLoadSample: (sampleIndex: number) => void;
  onResetForm: () => void;
  onSubmit: () => void;
}

const RESEARCH_LEVELS: ResearchLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];
const WRITING_STYLES: WritingStyle[] = [
  "Simple Academic",
  "Professional Academic",
];
const RESEARCH_FOCUS_OPTIONS: ResearchFocus[] = [
  "Implementation",
  "Analysis",
  "Comparison",
  "Innovation",
];

export function GeneratorView({
  input,
  isGenerating,
  errorMessage,
  onChangeInput,
  onLoadSample,
  onResetForm,
  onSubmit,
}: GeneratorViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const ideaWordCount = countWords(input.projectIdea);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Generate Research Content
          </h1>
          <p className="text-sm text-slate-500">
            Enter your project idea and academic parameters, or test with one of the sample topics below.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetForm}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Quick Sample Ideas Selector */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
          <BookOpen className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
          <span>Sample Project Ideas (Click to Populate)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROJECTS.map((sample, idx) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => onLoadSample(idx)}
              className="min-h-[36px] rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </section>

      {/* Main Input Form */}
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Project Idea */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="project-idea"
              className="block text-sm font-semibold text-slate-800"
            >
              Project Idea <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              {ideaWordCount} {ideaWordCount === 1 ? "word" : "words"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Describe your project idea in 2–3 lines.
          </p>
          <textarea
            id="project-idea"
            rows={4}
            value={input.projectIdea}
            onChange={(e) => onChangeInput("projectIdea", e.target.value)}
            placeholder="Example: Detect fake news using machine learning techniques to improve the accuracy of online information verification."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm sm:text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-y"
          />
        </div>

        {/* Domain Selection */}
        <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="domain-select"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Domain Selection <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <select
              id="domain-select"
              value={input.domain}
              onChange={(e) =>
                onChangeInput("domain", e.target.value as ResearchDomain)
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {RESEARCH_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {input.domain === "Other" && (
            <div>
              <label
                htmlFor="custom-domain"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Custom Domain <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="custom-domain"
                type="text"
                value={input.customDomain}
                onChange={(e) => onChangeInput("customDomain", e.target.value)}
                placeholder="e.g., Bioinformatics, Robotics, Edge Computing"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
            <Layers className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden="true" />
            <span>Additional Research Options</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label
                htmlFor="research-level"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Research Level
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100">
                {RESEARCH_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeInput("researchLevel", level)}
                    className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      input.researchLevel === level
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="writing-style"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Writing Style
              </label>
              <select
                id="writing-style"
                value={input.writingStyle}
                onChange={(e) =>
                  onChangeInput("writingStyle", e.target.value as WritingStyle)
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {WRITING_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="research-focus"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Research Focus
              </label>
              <select
                id="research-focus"
                value={input.researchFocus}
                onChange={(e) =>
                  onChangeInput(
                    "researchFocus",
                    e.target.value as ResearchFocus
                  )
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {RESEARCH_FOCUS_OPTIONS.map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Generates 3 titles, a 150–200 word abstract, 5 keywords, 3 objectives, and 3 future enhancements.
          </p>
          <button
            type="submit"
            disabled={isGenerating}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Generating Research Content...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Generate Research Content</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
