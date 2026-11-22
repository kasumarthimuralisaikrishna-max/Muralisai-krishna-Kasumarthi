import React, { useEffect, useState } from "react";
import { Check, Code2, Copy, Download, Loader2 } from "lucide-react";

interface ProjectFile {
  name: string;
  content: string;
}

export function PythonProjectView() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/research/python-project")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unable to fetch Python project files.");
        }
        if (!cancelled) {
          setFiles(data.files || []);
          if (data.files?.length > 0) {
            setActiveFileName(data.files[0].name);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load files.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentFile =
    files.find((f) => f.name === activeFileName) || files[0] || null;

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.name.split("/").pop() || "file.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Python &amp; Streamlit Source Code
          </h1>
          <p className="text-sm text-slate-500">
            Complete modular Python project under <span className="font-mono text-slate-700">research_generator/</span> ready to run with <span className="font-mono text-slate-700">streamlit run app.py</span>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* File Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {files.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => {
                  setActiveFileName(file.name);
                  setCopied(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFileName === file.name
                    ? "bg-white text-blue-700 border border-slate-200 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {file.name.replace("research_generator/", "")}
              </button>
            ))}
          </div>

          {currentFile && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>

        {/* Code Area */}
        <div className="bg-slate-950 text-slate-100 p-5 overflow-auto max-h-[620px]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Loading research_generator files...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-400">{error}</div>
          ) : currentFile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{currentFile.name}</span>
              </div>
              <pre className="font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
