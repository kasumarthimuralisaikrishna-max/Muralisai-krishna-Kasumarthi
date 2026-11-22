import json
import os
import re
import time
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

load_dotenv()


class GeminiServiceError(Exception):
    """Custom exception for user-friendly Gemini API error reporting."""


def get_api_key() -> str:
    """Retrieve Gemini API key from Streamlit secrets or environment variables."""
    try:
        import streamlit as st

        secret_val = st.secrets.get("GEMINI_API_KEY", "")
        if secret_val:
            return str(secret_val).strip()
    except Exception:
        pass

    return os.getenv("GEMINI_API_KEY", "").strip()


def get_gemini_client() -> genai.Client:
    """Create a configured Google GenAI client after validating the API key."""
    api_key = get_api_key()
    if not api_key:
        raise GeminiServiceError(
            "GEMINI_API_KEY is missing. Please set it in your .env file, environment variables, "
            "or .streamlit/secrets.toml before generating research content."
        )
    return genai.Client(api_key=api_key)


def clean_json_text(raw_text: str) -> str:
    """Strip optional markdown code fences around JSON responses."""
    cleaned = (raw_text or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()
    return cleaned


def generate_structured_json(
    prompt: str,
    system_instruction: str,
    response_schema: Optional[types.Schema] = None,
    max_retries: int = 2,
) -> Dict[str, Any]:
    """Call Google Gemini API and return parsed JSON with retries and error handling."""
    client = get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    config_kwargs: Dict[str, Any] = {
        "system_instruction": system_instruction,
        "response_mime_type": "application/json",
    }
    if response_schema is not None:
        config_kwargs["response_schema"] = response_schema

    last_error: Optional[Exception] = None

    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(**config_kwargs),
            )
            raw_text = clean_json_text(response.text or "")
            if not raw_text:
                raise GeminiServiceError("Gemini returned an empty response. Please try again.")

            return json.loads(raw_text)

        except json.JSONDecodeError as exc:
            last_error = GeminiServiceError(
                f"Received malformed JSON from Gemini API ({exc}). Please retry."
            )
        except genai_errors.APIError as exc:
            status_code = getattr(exc, "code", None)
            message = str(exc)
            lower = message.lower()

            if status_code == 429 or "resource_exhausted" in lower or "quota" in lower:
                if attempt < max_retries:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise GeminiServiceError(
                    "Gemini API rate limit reached. Please wait a few seconds and retry."
                ) from exc
            if status_code in (400, 401, 403) or "api key" in lower or "permission" in lower:
                raise GeminiServiceError(
                    "Invalid or unauthorized Gemini API key. Please verify GEMINI_API_KEY."
                ) from exc
            raise GeminiServiceError(f"Gemini API error: {message}") from exc
        except GeminiServiceError as exc:
            last_error = exc
        except Exception as exc:
            last_error = GeminiServiceError(
                f"Network or unexpected error while contacting Gemini: {exc}"
            )

        if attempt < max_retries:
            time.sleep(1.0)

    raise last_error or GeminiServiceError("Failed to generate research content.")


def chat_with_advisor(
    messages: list[Dict[str, str]],
    advisor_role: str = "Methodology Advisor",
    research_context: str = "",
) -> str:
    """Send multi-turn conversation history to Gemini with an academic advisor role."""
    client = get_gemini_client()
    model_name = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash-lite")

    role_prompts = {
        "Methodology Advisor": (
            "You are a Senior Academic Research Methodology Advisor. Help college students design "
            "sound methodologies, select public datasets and evaluation metrics, and scope projects."
        ),
        "Peer Reviewer": (
            "You are an experienced Academic Peer Reviewer. Provide constructive critique of titles, "
            "abstracts, and objectives while pointing out clarity gaps and overly broad claims."
        ),
        "Academic Writer": (
            "You are an Academic Writing Coach. Help students refine scholarly phrasing and outline "
            "introductions or literature reviews without fabricating experimental results."
        ),
    }

    system_instruction = (
        role_prompts.get(advisor_role, role_prompts["Methodology Advisor"])
        + "\nKeep answers crisp and practical (around 90-160 words unless asked for details)."
    )
    if research_context:
        system_instruction += f"\n\nACTIVE RESEARCH CONTEXT:\n{research_context}"

    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part.from_text(text=m["text"])],
        )
        for m in messages
        if m.get("text", "").strip()
    ]

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_instruction),
        )
        reply = (response.text or "").strip()
        if not reply:
            raise GeminiServiceError("Gemini returned an empty reply. Please try again.")
        return reply
    except GeminiServiceError:
        raise
    except genai_errors.APIError as exc:
        raise GeminiServiceError(f"Gemini API error: {exc}") from exc
    except Exception as exc:
        raise GeminiServiceError(f"Chat error: {exc}") from exc

