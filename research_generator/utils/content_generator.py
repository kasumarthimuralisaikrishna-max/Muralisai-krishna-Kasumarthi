from typing import Any, Dict, List

from google.genai import types

from utils.gemini_service import generate_structured_json
from utils.validators import (
    MAX_ABSTRACT_WORDS,
    MIN_ABSTRACT_WORDS,
    count_words,
    deduplicate_preserve_order,
    validate_abstract_word_count,
    validate_research_payload,
)

ACADEMIC_SYSTEM_INSTRUCTION = """You are an experienced academic researcher, technical writer, and university research advisor.
Your job is to transform a student's rough project idea into rigorous, authentic academic research paper content.

STRICT INTEGRITY RULES:
1. NEVER invent fake experimental results, fabricated accuracy percentages (e.g., "achieved 96.4% accuracy"), fake dataset sample counts, or unverified benchmark comparisons.
2. When describing expected outcomes, frame them honestly as anticipated goals, evaluation plans, or architectural capabilities.
3. If the project idea omits implementation specifics, make reasonable, standard academic assumptions aligned with the chosen domain and clearly reflect them as proposed methodology.
4. Keep language clear, scholarly, and accessible to college students and peer reviewers."""


def _build_context_block(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> str:
    return (
        f"Project Idea: {project_idea.strip()}\n"
        f"Domain: {domain.strip()}\n"
        f"Research Level: {research_level}\n"
        f"Writing Style: {writing_style}\n"
        f"Research Focus: {research_focus}"
    )


def _enforce_abstract_word_count(
    abstract_text: str,
    context_block: str,
    writing_style: str,
    max_correction_rounds: int = 2,
) -> str:
    """Validate abstract is 150-200 words; if outside range, ask Gemini to adjust length."""
    current = (abstract_text or "").strip()
    is_valid, word_count = validate_abstract_word_count(current)
    if is_valid:
        return current

    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "abstract": types.Schema(type=types.Type.STRING),
        },
        required=["abstract"],
    )

    for _ in range(max_correction_rounds):
        direction = (
            f"currently {word_count} words, which is TOO SHORT"
            if word_count < MIN_ABSTRACT_WORDS
            else f"currently {word_count} words, which is TOO LONG"
        )
        prompt = (
            f"Revise the research abstract below so that its total length is STRICTLY between "
            f"{MIN_ABSTRACT_WORDS} and {MAX_ABSTRACT_WORDS} words (target 170-185 words).\n"
            f"The draft is {direction}.\n"
            f"Preserve all 5 required elements: (1) background, (2) problem statement, "
            f"(3) proposed methodology, (4) expected outcome, (5) project significance.\n"
            f"Writing Style: {writing_style}. Do not invent fake metrics or results.\n\n"
            f"Context:\n{context_block}\n\n"
            f"Draft Abstract:\n{current}"
        )
        result = generate_structured_json(
            prompt=prompt,
            system_instruction=ACADEMIC_SYSTEM_INSTRUCTION,
            response_schema=schema,
        )
        candidate = str(result.get("abstract", "")).strip()
        if candidate:
            current = candidate
            is_valid, word_count = validate_abstract_word_count(current)
            if is_valid:
                return current

    return current


def generate_complete_research(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> Dict[str, Any]:
    """Generate the complete research package in a single structured Gemini API call,
    then validate JSON structure and abstract word count (150-200 words)."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )

    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "titles": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "title": types.Schema(type=types.Type.STRING),
                        "approach": types.Schema(type=types.Type.STRING),
                    },
                    required=["title", "approach"],
                ),
            ),
            "abstract": types.Schema(type=types.Type.STRING),
            "keywords": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
            ),
            "objectives": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
            ),
            "future_enhancements": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "title": types.Schema(type=types.Type.STRING),
                        "description": types.Schema(type=types.Type.STRING),
                    },
                    required=["title", "description"],
                ),
            ),
        },
        required=["titles", "abstract", "keywords", "objectives", "future_enhancements"],
    )

    prompt = f"""Generate complete academic research content for the following student project:

{context_block}

REQUIREMENTS:
1. "titles": Exactly 3 distinct research paper title options. Each must use clear, formal academic phrasing suitable for college reports/papers and take a different angle (e.g., System/Architecture focus, Analytical/Empirical focus, Application/Impact focus). Include a short "approach" label for each.
2. "abstract": A cohesive single-paragraph academic abstract STRICTLY between 150 and 200 words (aim for 170-185 words). It MUST cover:
   - Background of the problem
   - Problem statement
   - Proposed methodology or approach
   - Expected outcome (without fabricating metrics)
   - Significance of the project
3. "keywords": Exactly 5 unique, domain-relevant academic keywords.
4. "objectives": Exactly 3 clear, measurable research objectives, each starting with "To <action verb>..." (e.g., "To design...", "To analyze...", "To evaluate...").
5. "future_enhancements": Exactly 3 realistic technical future enhancements focusing on scalability, performance, accuracy, or new capabilities, each with a short "title" and concise "description"."""

    raw_payload = generate_structured_json(
        prompt=prompt,
        system_instruction=ACADEMIC_SYSTEM_INSTRUCTION,
        response_schema=schema,
    )
    validated = validate_research_payload(raw_payload)

    corrected_abstract = _enforce_abstract_word_count(
        validated["abstract"], context_block, writing_style
    )
    validated["abstract"] = corrected_abstract
    validated["abstract_word_count"] = count_words(corrected_abstract)
    return validated


def generate_titles(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> List[Dict[str, str]]:
    """Generate 3 distinct academic research title options."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )
    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "titles": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "title": types.Schema(type=types.Type.STRING),
                        "approach": types.Schema(type=types.Type.STRING),
                    },
                    required=["title", "approach"],
                ),
            ),
        },
        required=["titles"],
    )
    prompt = f"""Generate exactly 3 distinct, formal academic research paper title options for:
{context_block}
Each title should offer a distinct perspective and avoid overly complex jargon."""
    data = generate_structured_json(prompt, ACADEMIC_SYSTEM_INSTRUCTION, schema)
    titles = data.get("titles", [])
    if not isinstance(titles, list) or len(titles) < 3:
        raise ValueError("Expected 3 research titles from Gemini.")
    return [
        {
            "title": str(t.get("title", "")).strip(),
            "approach": str(t.get("approach", "Academic Perspective")).strip(),
        }
        for t in titles[:3]
    ]


def generate_abstract(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
    selected_title: str = "",
) -> Dict[str, Any]:
    """Generate or regenerate a 150-200 word academic research abstract."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )
    title_note = f"\nPreferred Title: {selected_title}" if selected_title else ""
    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "abstract": types.Schema(type=types.Type.STRING),
        },
        required=["abstract"],
    )
    prompt = f"""Write a fresh, cohesive academic research abstract STRICTLY between 150 and 200 words (target 175 words) for:
{context_block}{title_note}

Include in logical flow: background, problem statement, proposed methodology, expected outcome, and significance.
Do NOT invent fake accuracy numbers or experimental results."""
    data = generate_structured_json(prompt, ACADEMIC_SYSTEM_INSTRUCTION, schema)
    abstract = _enforce_abstract_word_count(
        str(data.get("abstract", "")), context_block, writing_style
    )
    return {"abstract": abstract, "word_count": count_words(abstract)}


def generate_keywords(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> List[str]:
    """Generate exactly 5 unique academic keywords."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )
    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "keywords": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        },
        required=["keywords"],
    )
    prompt = f"Generate exactly 5 unique, relevant academic keywords for:\n{context_block}"
    data = generate_structured_json(prompt, ACADEMIC_SYSTEM_INSTRUCTION, schema)
    keywords = deduplicate_preserve_order([str(k) for k in data.get("keywords", [])])
    if len(keywords) < 5:
        raise ValueError("Expected 5 unique keywords from Gemini.")
    return keywords[:5]


def generate_objectives(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> List[str]:
    """Generate exactly 3 measurable research objectives starting with action verbs."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )
    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "objectives": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        },
        required=["objectives"],
    )
    prompt = (
        f"Generate exactly 3 clear, measurable research objectives (each starting with 'To <verb>...') for:\n"
        f"{context_block}"
    )
    data = generate_structured_json(prompt, ACADEMIC_SYSTEM_INSTRUCTION, schema)
    objectives = [str(o).strip() for o in data.get("objectives", []) if str(o).strip()]
    if len(objectives) < 3:
        raise ValueError("Expected 3 research objectives from Gemini.")
    return objectives[:3]


def generate_future_enhancements(
    project_idea: str,
    domain: str,
    research_level: str,
    writing_style: str,
    research_focus: str,
) -> List[Dict[str, str]]:
    """Generate exactly 3 realistic technical future enhancements."""
    context_block = _build_context_block(
        project_idea, domain, research_level, writing_style, research_focus
    )
    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "future_enhancements": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "title": types.Schema(type=types.Type.STRING),
                        "description": types.Schema(type=types.Type.STRING),
                    },
                    required=["title", "description"],
                ),
            ),
        },
        required=["future_enhancements"],
    )
    prompt = (
        f"Generate exactly 3 realistic technical future enhancements focusing on scalability, "
        f"performance, accuracy, and new capabilities for:\n{context_block}"
    )
    data = generate_structured_json(prompt, ACADEMIC_SYSTEM_INSTRUCTION, schema)
    enhancements = data.get("future_enhancements", [])
    if not isinstance(enhancements, list) or len(enhancements) < 3:
        raise ValueError("Expected 3 future enhancements from Gemini.")
    return [
        {
            "title": str(e.get("title", "Technical Enhancement")).strip(),
            "description": str(e.get("description", "")).strip(),
        }
        for e in enhancements[:3]
    ]
