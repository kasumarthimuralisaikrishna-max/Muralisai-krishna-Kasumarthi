import React, { useState } from "react";
import {
  BookOpenCheck,
  Code2,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

export type ResearchAppTab = "home" | "generator" | "results" | "chat" | "python";

interface SidebarProps {
  activeTab: ResearchAppTab;
  hasResults: boolean;
  onSelectTab: (tab: ResearchAppTab) => void;
}

const NAV_ITEMS: Array<{
  id: ResearchAppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "generator", label: "Generator", icon: Sparkles },
  { id: "results", label: "Results Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "AI Research Advisor", icon: MessageSquareText },
  { id: "python", label: "Python & Streamlit", icon: Code2 },
];

export function Sidebar({
  activeTab,
  hasResults,
  onSelectTab,
}: SidebarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 lg:shrink-0 border-r border-slate-200 bg-white min-h-screen">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {!imgError ? (
              <img
                src="/src/assets/images/research_academic_logo_1795335185282.jpg"
                alt="AI Research Title & Abstract Generator emblem"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shrink-0">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-slate-900 leading-tight">
                Research Studio
              </p>
              <p className="text-xs text-slate-500 truncate">
                Academic AI Workspace
              </p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Sidebar navigation"
          className="flex-1 p-4 space-y-1.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const disabled = item.id === "results" && !hasResults;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full min-h-[42px] flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : disabled
                    ? "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.id === "results" && hasResults && (
                  <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1">
            Academic Integrity First
          </p>
          <p>
            Generates original titles, 150–200 word abstracts, keywords, objectives, and future scope without fabricating experimental data.
          </p>
        </div>
      </aside>

      {/* Mobile & Tablet Top Navigation Bar */}
      <header className="lg:hidden border-b border-slate-200 bg-white">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {!imgError ? (
              <img
                src="/src/assets/images/research_academic_logo_1795335185282.jpg"
                alt="AI Research Title & Abstract Generator emblem"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shrink-0">
                <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
            <span className="font-display text-sm font-bold text-slate-900 truncate">
              AI Research Generator
            </span>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
