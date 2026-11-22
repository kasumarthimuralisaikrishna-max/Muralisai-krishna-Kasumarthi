import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  RefreshCw,
  Tag,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  GeneratedResearchData,
  ResearchFormInput,
} from "../types/research";
import {
  downloadResearchAsPdf,
  downloadResearchAsTxt,
} from "../utils/researchExporters";

interface ResultsDashboardProps {
  input: ResearchFormInput;
  resolvedDomain: string;
  data: GeneratedResearchData;
  selectedTitleIndex: number;
  isRegeneratingAbstract: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSelectTitle: (index: number) => void;
  onRegenerateAbstract: () => void;
  onGenerateNew: () => void;
}

type DashboardTab = "all" | "titles-abstract" | "keywords-objectives" | "future";

export function ResultsDashboard({
  input,
  resolvedDomain,
  data,
  selectedTitleIndex,
  isRegeneratingAbstract,
  errorMessage,
  successMessage,
  onSelectTitle,
  onRegenerateAbstract,
  onGenerateNew,
}: ResultsDashboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<DashboardTab>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedTitle =
    data.titles[selectedTitleIndex]?.title || data.titles[0]?.title || "";
  const isWordCountInRange =
    data.abstractWordCount >= 150 && data.abstractWordCount <= 200;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const renderTitlesSection = () => (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            1. Research Title Options (Select Preferred)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose the title that best matches your project scope and academic report style.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.titles.map((item, idx) => {
          const isSelected = idx === selectedTitleIndex;
          const copyId = `title-${idx}`;
          const isCopied = copiedKey === copyId;

          return (
            <div
              key={idx}
              className={`rounded-2xl border bg-white p-5 shadow-sm flex flex-col justify-between transition-colors ${
                isSelected
                  ? "border-blue-600 ring-1 ring-blue-600/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                  <span className="font-semibold text-indigo-700">
                    Option {idx + 1} · {item.approach}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Selected</span>
                    </span>
                  )}
                </div>
                <h3 className="font-display text-[15px] font-bold text-slate-900 leading-snug mb-4">
                  {item.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectTitle(idx)}
                  className={`flex-1 min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isSelected ? "Selected Title" : "Select Title"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(copyId, item.title)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Title</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderAbstractSection = () => (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              2. Research Abstract
            </h2>
            <p className="text-xs text-slate-500">
              Includes background, problem statement, methodology, expected outcome, and significance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono tabular-nums font-bold text-slate-900">
            {data.abstractWordCount} words
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              isWordCountInRange
                ? "font-semibold text-emerald-700"
                : "font-semibold text-amber-700"
            }
          >
            {isWordCountInRange
              ? "Within 150–200 word range"
              : "Outside 150–200 word target"}
          </span>
        </div>
      </div>

      <p className="text-[15px] leading-[1.75] text-slate-800 bg-slate-50/70 rounded-xl border border-slate-200 p-5">
        {data.abstract}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => handleCopy("abstract", data.abstract)}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copiedKey === "abstract" ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Copied Abstract</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Copy Abstract</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onRegenerateAbstract}
          disabled={isRegeneratingAbstract}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-800 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isRegeneratingAbstract ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              <span>Regenerating Abstract...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Regenerate Abstract</span>
            </>
          )}
        </button>
      </div>
    </section>
  );

  const renderKeywordsSection = () => {
    const joined = data.keywords.join(" | ");
    return (
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 shrink-0">
              <Tag className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                3. Research Keywords
              </h2>
              <p className="text-xs text-slate-500">
                Five domain-relevant academic indexing terms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("keywords", joined)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === "keywords" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied Keywords</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Keywords</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-sm sm:text-[15px] font-semibold text-blue-900 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {data.keywords.map((kw, idx) => (
            <React.Fragment key={kw}>
              <span>{kw}</span>
              {idx < data.keywords.length - 1 && (
                <span className="text-slate-300 font-normal" aria-hidden="true">
                  |
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    );
  };

  const renderObjectivesSection = () => {
    const joined = data.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n");
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <Target className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                4. Research Objectives
              </h2>
              <p className="text-xs text-slate-500">
                Three clear, measurable objectives aligned to your project idea.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("objectives", joined)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === "objectives" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied Objectives</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Objectives</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.objectives.map((obj, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <p className="font-mono tabular-nums text-xs font-bold text-blue-700 mb-2">
                Objective {String(idx + 1).padStart(2, "0")}
              </p>
              <p className="text-sm leading-relaxed text-slate-700">{obj}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderFutureSection = () => {
    const joined = data.futureEnhancements
      .map((e, i) => `${i + 1}. ${e.title}: ${e.description}`)
      .join("\n");

    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 shrink-0">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                5. Future Enhancements
              </h2>
              <p className="text-xs text-slate-500">
                Realistic extensions for scalability, accuracy, performance, and new capabilities.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("enhancements", joined)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === "enhancements" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied Enhancements</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Future Enhancements</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.futureEnhancements.map((enh, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <p className="font-mono tabular-nums text-xs font-bold text-purple-700 mb-1.5">
                Enhancement {String(idx + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display text-sm font-bold text-slate-900 mb-1.5">
                {enh.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {enh.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Top Selected Title & Export Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-6 sm:px-8 text-white shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-blue-100 mb-1.5">
              {resolvedDomain} · {input.researchLevel} · {input.writingStyle} ·{" "}
              {input.researchFocus}
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-snug text-balance">
              {selectedTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                downloadResearchAsTxt(
                  input,
                  resolvedDomain,
                  selectedTitle,
                  data
                )
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Download TXT</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadResearchAsPdf(
                  input,
                  resolvedDomain,
                  selectedTitle,
                  data
                )
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onGenerateNew}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Generate New Research</span>
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && !errorMessage && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Organized View Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 w-fit overflow-x-auto max-w-full">
        {(
          [
            { id: "all", label: "All Sections" },
            { id: "titles-abstract", label: "Titles & Abstract" },
            { id: "keywords-objectives", label: "Keywords & Objectives" },
            { id: "future", label: "Future Enhancements" },
          ] as Array<{ id: DashboardTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Sections */}
      {activeTab === "all" && (
        <div className="space-y-6">
          {renderTitlesSection()}
          {renderAbstractSection()}
          {renderKeywordsSection()}
          {renderObjectivesSection()}
          {renderFutureSection()}
        </div>
      )}

      {activeTab === "titles-abstract" && (
        <div className="space-y-6">
          {renderTitlesSection()}
          {renderAbstractSection()}
        </div>
      )}

      {activeTab === "keywords-objectives" && (
        <div className="space-y-6">
          {renderKeywordsSection()}
          {renderObjectivesSection()}
        </div>
      )}

      {activeTab === "future" && renderFutureSection()}
    </motion.div>
  );
}
