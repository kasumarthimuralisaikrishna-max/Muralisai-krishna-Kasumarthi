from typing import Any, Dict
from fpdf import FPDF


def _latin1_safe(text: str) -> str:
    """Normalize Unicode punctuation so built-in PDF Helvetica renders cleanly."""
    replacements = {
        "\u2014": "--",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2022": "*",
        "\u00a0": " ",
    }
    out = text or ""
    for src, dst in replacements.items():
        out = out.replace(src, dst)
    return out.encode("latin-1", "replace").decode("latin-1")


def format_research_txt(
    selected_title: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
    research_data: Dict[str, Any],
) -> str:
    """Format the generated research package into a clean academic plain-text document."""
    lines = [
        "============================================================",
        "AI RESEARCH TITLE & ABSTRACT GENERATOR - RESEARCH SUMMARY",
        "============================================================",
        "",
        f"Selected Research Title: {selected_title}",
        f"Domain: {domain} | Level: {research_level} | Style: {writing_style} | Focus: {research_focus}",
        "",
        "------------------------------------------------------------",
        "ALL GENERATED TITLE OPTIONS",
        "------------------------------------------------------------",
    ]
    for idx, item in enumerate(research_data.get("titles", []), start=1):
        lines.append(f"{idx}. {item['title']} ({item['approach']})")

    lines.extend(
        [
            "",
            "------------------------------------------------------------",
            f"ABSTRACT ({research_data.get('abstract_word_count', 0)} words)",
            "------------------------------------------------------------",
            research_data.get("abstract", ""),
            "",
            "------------------------------------------------------------",
            "KEYWORDS",
            "------------------------------------------------------------",
            " | ".join(research_data.get("keywords", [])),
            "",
            "------------------------------------------------------------",
            "RESEARCH OBJECTIVES",
            "------------------------------------------------------------",
        ]
    )
    for idx, obj in enumerate(research_data.get("objectives", []), start=1):
        lines.append(f"{idx}. {obj}")

    lines.extend(
        [
            "",
            "------------------------------------------------------------",
            "FUTURE ENHANCEMENTS",
            "------------------------------------------------------------",
        ]
    )
    for idx, enh in enumerate(research_data.get("future_enhancements", []), start=1):
        lines.append(f"{idx}. {enh['title']}: {enh['description']}")

    lines.append("")
    return "\n".join(lines)


def build_research_pdf(
    project_idea: str,
    selected_title: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
    research_data: Dict[str, Any],
) -> bytes:
    """Generate a clean, academic-formatted PDF document using fpdf2."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # Header block
    pdf.set_fill_color(37, 99, 235)
    pdf.rect(0, 0, 210, 28, style="F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_xy(14, 8)
    pdf.cell(0, 7, "AI Research Title & Abstract Generator", ln=True)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_x(14)
    pdf.cell(
        0,
        6,
        _latin1_safe(f"{domain}  |  {research_level}  |  {writing_style}  |  {research_focus}"),
        ln=True,
    )

    pdf.set_y(36)
    pdf.set_text_color(15, 23, 42)

    def add_section_heading(label: str) -> None:
        pdf.set_font("Helvetica", "B", 11.5)
        pdf.set_text_color(30, 64, 175)
        pdf.cell(0, 8, _latin1_safe(label), ln=True)
        pdf.set_draw_color(226, 232, 240)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("Helvetica", "", 10.5)

    add_section_heading("Selected Research Title")
    pdf.set_font("Helvetica", "B", 12)
    pdf.multi_cell(0, 6.5, _latin1_safe(selected_title))
    pdf.ln(4)

    add_section_heading("Project Concept")
    pdf.multi_cell(0, 5.8, _latin1_safe(project_idea))
    pdf.ln(4)

    add_section_heading(f"Abstract ({research_data.get('abstract_word_count', 0)} words)")
    pdf.multi_cell(0, 6, _latin1_safe(research_data.get("abstract", "")))
    pdf.ln(4)

    add_section_heading("Keywords")
    pdf.set_font("Helvetica", "B", 10)
    pdf.multi_cell(0, 6, _latin1_safe("  |  ".join(research_data.get("keywords", []))))
    pdf.ln(4)

    add_section_heading("Research Objectives")
    for idx, obj in enumerate(research_data.get("objectives", []), start=1):
        pdf.multi_cell(0, 6, _latin1_safe(f"{idx}. {obj}"))
        pdf.ln(1.5)
    pdf.ln(2)

    add_section_heading("Future Enhancements")
    for idx, enh in enumerate(research_data.get("future_enhancements", []), start=1):
        pdf.set_font("Helvetica", "B", 10.5)
        pdf.multi_cell(0, 6, _latin1_safe(f"{idx}. {enh['title']}"))
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5.8, _latin1_safe(enh["description"]))
        pdf.ln(2)

    output = pdf.output(dest="S")
    return bytes(output) if isinstance(output, (bytes, bytearray)) else output.encode("latin-1")
