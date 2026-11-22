import re
from typing import Any, Dict, List, Tuple

ALLOWED_DOMAINS = [
    "Artificial Intelligence (AI)",
    "Internet of Things (IoT)",
    "Web Development",
    "Cybersecurity",
    "Machine Learning",
    "Data Science",
    "Cloud Computing",
    "Blockchain",
    "Other",
]

ALLOWED_RESEARCH_LEVELS = ["Beginner", "Intermediate", "Advanced"]
ALLOWED_WRITING_STYLES = ["Simple Academic", "Professional Academic"]
ALLOWED_RESEARCH_FOCUS = ["Implementation", "Analysis", "Comparison", "Innovation"]

MIN_ABSTRACT_WORDS = 150
MAX_ABSTRACT_WORDS = 200


def count_words(text: str) -> int:
    """Return exact word count using whitespace tokenization."""
    stripped = (text or "").strip()
    if not stripped:
        return 0
    return len(re.findall(r"\S+", stripped))


def validate_user_inputs(
    project_idea: str,
    domain: str,
    custom_domain: str = "",
    research_level: str = "Beginner",
    writing_style: str = "Professional Academic",
    research_focus: str = "Implementation",
) -> Tuple[bool, str, str]:
    """Validate project idea, domain selection, and research parameters.

    Returns:
        (is_valid, error_message, resolved_domain)
    """
    idea = (project_idea or "").strip()
    if not idea:
        return False, "Please enter your project idea before generating research content.", ""

    if len(idea) < 15 or count_words(idea) < 4:
        return (
            False,
            "Please describe your project idea in at least 4 words (2-3 clear lines work best).",
            "",
        )

    selected_domain = (domain or "").strip()
    if selected_domain not in ALLOWED_DOMAINS:
        return False, "Please select a valid research domain from the dropdown.", ""

    if selected_domain == "Other":
        resolved_domain = (custom_domain or "").strip()
        if not resolved_domain:
            return False, "Please specify your custom domain when 'Other' is selected.", ""
        if len(resolved_domain) < 2:
            return False, "Custom domain must be at least 2 characters long.", ""
    else:
        resolved_domain = selected_domain

    if research_level not in ALLOWED_RESEARCH_LEVELS:
        return False, "Invalid research level selected.", ""
    if writing_style not in ALLOWED_WRITING_STYLES:
        return False, "Invalid writing style selected.", ""
    if research_focus not in ALLOWED_RESEARCH_FOCUS:
        return False, "Invalid research focus selected.", ""

    return True, "", resolved_domain


def validate_abstract_word_count(abstract: str) -> Tuple[bool, int]:
    """Check whether the abstract is strictly between 150 and 200 words."""
    words = count_words(abstract)
    return MIN_ABSTRACT_WORDS <= words <= MAX_ABSTRACT_WORDS, words


def deduplicate_preserve_order(items: List[str]) -> List[str]:
    """Deduplicate strings case-insensitively while preserving order."""
    seen = set()
    unique: List[str] = []
    for item in items:
        cleaned = (item or "").strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            unique.append(cleaned)
    return unique


def validate_research_payload(payload: Any) -> Dict[str, Any]:
    """Validate and normalize the complete JSON structure returned by Gemini."""
    if not isinstance(payload, dict):
        raise ValueError("Invalid response format: expected a JSON object.")

    # Validate 3 titles
    raw_titles = payload.get("titles")
    if not isinstance(raw_titles, list) or len(raw_titles) < 3:
        raise ValueError("Expected exactly 3 research title options in the AI response.")

    titles: List[Dict[str, str]] = []
    for item in raw_titles[:3]:
        if isinstance(item, dict):
            title_text = str(item.get("title", "")).strip()
            approach = str(item.get("approach", "Academic Perspective")).strip()
        else:
            title_text = str(item).strip()
            approach = "Academic Perspective"
        if not title_text:
            raise ValueError("One of the generated research titles was empty.")
        titles.append({"title": title_text, "approach": approach})

    # Validate abstract
    abstract = str(payload.get("abstract", "")).strip()
    if not abstract:
        raise ValueError("Generated abstract was empty.")

    # Validate 5 keywords
    raw_keywords = payload.get("keywords")
    if not isinstance(raw_keywords, list):
        raise ValueError("Expected a list of 5 research keywords.")
    keywords = deduplicate_preserve_order([str(k) for k in raw_keywords])
    if len(keywords) < 5:
        raise ValueError("Expected 5 unique research keywords in the AI response.")
    keywords = keywords[:5]

    # Validate 3 objectives
    raw_objectives = payload.get("objectives")
    if not isinstance(raw_objectives, list) or len(raw_objectives) < 3:
        raise ValueError("Expected 3 research objectives in the AI response.")
    objectives = [str(obj).strip() for obj in raw_objectives[:3] if str(obj).strip()]
    if len(objectives) < 3:
        raise ValueError("One or more research objectives were empty.")

    # Validate 3 future enhancements
    raw_enhancements = payload.get("future_enhancements")
    if not isinstance(raw_enhancements, list) or len(raw_enhancements) < 3:
        raise ValueError("Expected 3 future enhancements in the AI response.")
    enhancements: List[Dict[str, str]] = []
    for item in raw_enhancements[:3]:
        if isinstance(item, dict):
            heading = str(item.get("title", "Enhancement")).strip()
            detail = str(item.get("description", "")).strip()
        else:
            heading = "Technical Enhancement"
            detail = str(item).strip()
        if not detail:
            raise ValueError("One or more future enhancements were empty.")
        enhancements.append({"title": heading, "description": detail})

    return {
        "titles": titles,
        "abstract": abstract,
        "abstract_word_count": count_words(abstract),
        "keywords": keywords,
        "objectives": objectives,
        "future_enhancements": enhancements,
    }
