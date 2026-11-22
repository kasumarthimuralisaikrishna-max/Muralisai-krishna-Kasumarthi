import React from "react";
import {
  ArrowRight,
  Compass,
  FileText,
  Lightbulb,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface HomeViewProps {
  onGoToGenerator: () => void;
  onQuickStartSample: (sampleIndex: number) => void;
}

const FEATURE_CARDS = [
  {
    number: "01",
    title: "Smart Research Title Generator",
    description:
      "Produces three distinct academic title options framed around system architecture, analytical rigor, and real-world impact.",
    icon: Sparkles,
    accentClass: "bg-blue-50 text-blue-700",
  },
  {
    number: "02",
    title: "AI Abstract Writer",
    description:
      "Drafts a cohesive 150–200 word academic abstract covering background, problem statement, methodology, expected outcome, and significance.",
    icon: FileText,
    accentClass: "bg-indigo-50 text-indigo-700",
  },
  {
    number: "03",
    title: "Keyword Generator",
    description:
      "Extracts five unique, domain-specific academic keywords ready for IEEE, Springer, or university project report indexing.",
    icon: Tag,
    accentClass: "bg-purple-50 text-purple-700",
  },
  {
    number: "04",
    title: "Research Objectives Generator",
    description:
      "Formulates three clear, measurable objectives starting with strong academic action verbs directly aligned to your project idea.",
    icon: Target,
    accentClass: "bg-blue-50 text-blue-700",
  },
  {
    number: "05",
    title: "Future Enhancement Suggestions",
    description:
      "Recommends three realistic technical extensions focused on scalability, performance optimization, accuracy, and new capabilities.",
    icon: Compass,
    accentClass: "bg-purple-50 text-purple-700",
  },
];

export function HomeView({
  onGoToGenerator,
  onQuickStartSample,
}: HomeViewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Hero Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-8 sm:px-10 sm:py-11 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm font-semibold text-blue-100 mb-2">
            Turn Your Ideas Into Research-Ready Projects.
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-balance mb-3">
            AI Research Title &amp; Abstract Generator
          </h1>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed mb-6">
            Transform your rough project ideas into professional research content in seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToGenerator}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-white text-blue-800 hover:bg-blue-50 px-6 py-2.5 text-sm font-bold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Generate Research Content</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onQuickStartSample(0)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Try Sample Project</span>
            </button>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
          Built for College Students, Researchers &amp; Project Teams
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-4xl">
          Turning a rough engineering or software idea into structured academic writing is often the hardest part of starting a capstone paper or project synopsis. Enter just 2–3 lines describing your concept, choose your domain and writing style, and let Google Gemini produce formal research titles, a validated 150–200 word abstract, keywords, measurable objectives, and technical future scope—ready to copy or export as TXT and PDF.
        </p>
      </section>

      {/* 5 Feature Cards */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Core Academic Tools
          </h2>
          <p className="text-sm text-slate-500">
            Every section is generated in structured academic format without fabricated metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.number}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${feature.accentClass}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-400">
                      {feature.number}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
