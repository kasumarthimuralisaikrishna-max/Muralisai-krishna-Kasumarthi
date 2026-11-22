import { jsPDF } from "jspdf";
import {
  GeneratedResearchData,
  ResearchFormInput,
} from "../types/research";

export function formatResearchAsTxt(
  input: ResearchFormInput,
  resolvedDomain: string,
  selectedTitle: string,
  data: GeneratedResearchData
): string {
  const lines: string[] = [
    "============================================================",
    "AI RESEARCH TITLE & ABSTRACT GENERATOR - ACADEMIC SUMMARY",
    "============================================================",
    "",
    `Selected Research Title: ${selectedTitle}`,
    `Domain: ${resolvedDomain}`,
    `Research Level: ${input.researchLevel} | Writing Style: ${input.writingStyle} | Focus: ${input.researchFocus}`,
    "",
    "------------------------------------------------------------",
    "PROJECT IDEA",
    "------------------------------------------------------------",
    input.projectIdea.trim(),
    "",
    "------------------------------------------------------------",
    "ALL GENERATED TITLE OPTIONS",
    "------------------------------------------------------------",
    ...data.titles.map(
      (item, idx) => `${idx + 1}. ${item.title} (${item.approach})`
    ),
    "",
    "------------------------------------------------------------",
    `RESEARCH ABSTRACT (${data.abstractWordCount} words)`,
    "------------------------------------------------------------",
    data.abstract,
    "",
    "------------------------------------------------------------",
    "KEYWORDS",
    "------------------------------------------------------------",
    data.keywords.join(" | "),
    "",
    "------------------------------------------------------------",
    "RESEARCH OBJECTIVES",
    "------------------------------------------------------------",
    ...data.objectives.map((obj, idx) => `${idx + 1}. ${obj}`),
    "",
    "------------------------------------------------------------",
    "FUTURE ENHANCEMENTS",
    "------------------------------------------------------------",
    ...data.futureEnhancements.map(
      (enh, idx) => `${idx + 1}. ${enh.title}: ${enh.description}`
    ),
    "",
  ];

  return lines.join("\n");
}

export function downloadResearchAsTxt(
  input: ResearchFormInput,
  resolvedDomain: string,
  selectedTitle: string,
  data: GeneratedResearchData
): void {
  const content = formatResearchAsTxt(
    input,
    resolvedDomain,
    selectedTitle,
    data
  );
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "research_paper_summary.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadResearchAsPdf(
  input: ResearchFormInput,
  resolvedDomain: string,
  selectedTitle: string,
  data: GeneratedResearchData
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 46;
  const maxWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  const addWrapped = (
    text: string,
    x: number,
    fontSize: number,
    color: [number, number, number],
    fontStyle: "normal" | "bold" = "normal",
    lineHeight = 1.45
  ) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth - (x - margin));
    const step = fontSize * lineHeight;
    for (const line of lines) {
      ensureSpace(step + 4);
      doc.text(line, x, y);
      y += step;
    }
  };

  const addSectionHeading = (label: string) => {
    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(37, 99, 235);
    doc.text(label, margin, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  };

  // Header Banner
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setFillColor(109, 40, 217);
  doc.rect(pageWidth * 0.56, 0, pageWidth * 0.44, 84, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("AI Research Title & Abstract Generator", margin, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `${resolvedDomain}  |  ${input.researchLevel}  |  ${input.writingStyle}  |  ${input.researchFocus}`,
    margin,
    58
  );

  y = 114;

  addSectionHeading("Selected Research Title");
  addWrapped(selectedTitle, margin, 13, [15, 23, 42], "bold", 1.38);
  y += 12;

  addSectionHeading("Project Concept");
  addWrapped(input.projectIdea.trim(), margin, 10.5, [51, 65, 85], "normal");
  y += 12;

  addSectionHeading(`Abstract (${data.abstractWordCount} words)`);
  addWrapped(data.abstract, margin, 10.5, [30, 41, 59], "normal", 1.5);
  y += 12;

  addSectionHeading("Keywords");
  addWrapped(data.keywords.join("  |  "), margin, 10.5, [30, 58, 138], "bold");
  y += 12;

  addSectionHeading("Research Objectives");
  data.objectives.forEach((obj, idx) => {
    addWrapped(`${idx + 1}. ${obj}`, margin, 10.5, [30, 41, 59], "normal");
    y += 4;
  });
  y += 8;

  addSectionHeading("Future Enhancements");
  data.futureEnhancements.forEach((enh, idx) => {
    addWrapped(`${idx + 1}. ${enh.title}`, margin, 10.5, [15, 23, 42], "bold");
    addWrapped(enh.description, margin + 12, 10, [71, 85, 105], "normal");
    y += 6;
  });

  doc.save("research_paper_summary.pdf");
}
