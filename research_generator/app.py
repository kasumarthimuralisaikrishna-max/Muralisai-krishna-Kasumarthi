import json
import os
from typing import Dict

import streamlit as st
import streamlit.components.v1 as components
from dotenv import load_dotenv

from utils.content_generator import generate_abstract, generate_complete_research
from utils.exporters import build_research_pdf, format_research_txt
from utils.gemini_service import GeminiServiceError
from utils.validators import (
    ALLOWED_DOMAINS,
    ALLOWED_RESEARCH_FOCUS,
    ALLOWED_RESEARCH_LEVELS,
    ALLOWED_WRITING_STYLES,
    validate_user_inputs,
)

load_dotenv()

st.set_page_config(
    page_title="AI Research Title & Abstract Generator",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

SAMPLE_IDEAS: Dict[str, Dict[str, str]] = {
    "Fake News Detection Using Machine Learning": {
        "idea": (
            "Detect fake news articles across online social platforms using machine learning "
            "and natural language processing techniques to improve information verification accuracy."
        ),
        "domain": "Machine Learning",
        "level": "Intermediate",
        "style": "Professional Academic",
        "focus": "Implementation",
    },
    "Smart Irrigation System Using IoT": {
        "idea": (
            "Build an automated smart irrigation system using soil moisture sensors, weather data, "
            "and IoT microcontrollers to optimize agricultural water usage and crop health."
        ),
        "domain": "Internet of Things (IoT)",
        "level": "Beginner",
        "style": "Simple Academic",
        "focus": "Implementation",
    },
    "Secure Online Payment System Using Cybersecurity": {
        "idea": (
            "Design a secure online payment gateway architecture incorporating tokenization, "
            "multi-factor verification, and anomaly detection to reduce digital transaction fraud."
        ),
        "domain": "Cybersecurity",
        "level": "Advanced",
        "style": "Professional Academic",
        "focus": "Innovation",
    },
    "AI-Based Student Performance Prediction": {
        "idea": (
            "Predict student academic performance early using attendance, quiz scores, and LMS "
            "engagement patterns with explainable AI models to support timely faculty mentoring."
        ),
        "domain": "Artificial Intelligence (AI)",
        "level": "Intermediate",
        "style": "Professional Academic",
        "focus": "Analysis",
    },
    "Online Food Ordering Web Application": {
        "idea": (
            "Develop a responsive full-stack online food ordering web platform with real-time order "
            "tracking, personalized restaurant recommendations, and streamlined checkout workflows."
        ),
        "domain": "Web Development",
        "level": "Beginner",
        "style": "Simple Academic",
        "focus": "Implementation",
    },
}

CUSTOM_CSS = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

  html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
  }

  .stApp {
    background-color: #F8FAFC;
  }

  .hero-banner {
    background: linear-gradient(135deg, #1D4ED8 0%, #4338CA 52%, #6D28D9 100%);
    padding: 2.2rem 2.4rem;
    border-radius: 16px;
    color: #FFFFFF;
    margin-bottom: 1.5rem;
    box-shadow: 0 12px 28px -12px rgba(37, 99, 235, 0.35);
  }

  .hero-banner .tagline {
    font-size: 0.85rem;
    font-weight: 600;
    color: #DBEAFE;
    margin-bottom: 0.35rem;
  }

  .hero-banner h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 0.45rem 0;
    color: #FFFFFF;
    letter-spacing: -0.02em;
  }

  .hero-banner p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.92);
    margin: 0;
    max-width: 720px;
  }

  .academic-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 1.25rem 1.4rem;
    margin-bottom: 1rem;
  }

  .academic-card h4 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.02rem;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 0.35rem 0;
  }

  .academic-card p {
    font-size: 0.9rem;
    color: #475569;
    margin: 0;
    line-height: 1.55;
  }

  .keyword-strip {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 1rem 1.2rem;
    font-weight: 600;
    color: #1E3A8A;
    font-size: 0.95rem;
  }

  div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #2563EB 0%, #6D28D9 100%);
    border: none;
    color: #FFFFFF;
    font-weight: 600;
    border-radius: 10px;
  }
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def init_session_state() -> None:
    defaults = {
        "page": "Home",
        "project_idea": "",
        "domain": ALLOWED_DOMAINS[0],
        "custom_domain": "",
        "research_level": "Intermediate",
        "writing_style": "Professional Academic",
        "research_focus": "Implementation",
        "research_result": None,
        "selected_title_idx": 0,
        "resolved_domain": "",
        "last_error": "",
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


def render_copy_button(text_to_copy: str, label: str, key: str) -> None:
    payload = json.dumps(text_to_copy)
    btn_id = f"copy_{key}"
    html = f"""
    <button id="{btn_id}" onclick="copyText_{key}()" style="
      padding: 0.42rem 0.9rem;
      border-radius: 8px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: #1E293B;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;">
      📋 {label}
    </button>
    <script>
      function copyText_{key}() {{
        navigator.clipboard.writeText({payload}).then(() => {{
          const btn = document.getElementById('{btn_id}');
          btn.innerText = '✅ Copied!';
          btn.style.borderColor = '#16A34A';
          btn.style.color = '#15803D';
          btn.style.background = '#F0FDF4';
          setTimeout(() => {{
            btn.innerText = '📋 {label}';
            btn.style.borderColor = '#CBD5E1';
            btn.style.color = '#1E293B';
            btn.style.background = '#FFFFFF';
          }}, 2000);
        }});
      }}
    </script>
    """
    components.html(html, height=42)


def load_sample(sample_name: str) -> None:
    sample = SAMPLE_IDEAS[sample_name]
    st.session_state["project_idea"] = sample["idea"]
    st.session_state["domain"] = sample["domain"]
    st.session_state["custom_domain"] = ""
    st.session_state["research_level"] = sample["level"]
    st.session_state["writing_style"] = sample["style"]
    st.session_state["research_focus"] = sample["focus"]
    st.session_state["last_error"] = ""


def reset_research() -> None:
    st.session_state["research_result"] = None
    st.session_state["selected_title_idx"] = 0
    st.session_state["last_error"] = ""
    st.session_state["page"] = "Generator"


def render_home_page() -> None:
    st.markdown(
        """
        <div class="hero-banner">
          <div class="tagline">Turn Your Ideas Into Research-Ready Projects.</div>
          <h1>AI Research Title &amp; Abstract Generator</h1>
          <p>Transform your rough project ideas into professional research content in seconds.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        "College students and emerging researchers often have innovative project concepts but struggle "
        "to articulate formal academic titles, structured abstracts, searchable keywords, measurable "
        "objectives, and realistic future work. Powered by Google Gemini, this workspace converts a "
        "short 2–3 line project description into complete, submission-ready academic documentation."
    )

    if st.button("🚀 Generate Research Content", type="primary", use_container_width=False):
        st.session_state["page"] = "Generator"
        st.rerun()

    st.markdown("### Core Capabilities")
    features = [
        ("1. Smart Research Title Generator", "Creates 3 distinct academic titles offering unique analytical, architectural, and applied perspectives."),
        ("2. AI Abstract Writer", "Drafts a formal 150–200 word abstract covering background, problem, methodology, outcome, and significance."),
        ("3. Keyword Generator", "Extracts 5 high-impact, domain-relevant academic keywords without duplication."),
        ("4. Research Objectives Generator", "Formulates 3 measurable, action-verb-driven research objectives aligned to your scope."),
        ("5. Future Enhancement Suggestions", "Proposes 3 realistic technical extensions focused on scalability, accuracy, and performance."),
    ]

    cols = st.columns(3)
    for idx, (title, desc) in enumerate(features):
        with cols[idx % 3]:
            st.markdown(
                f"""
                <div class="academic-card">
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )


def render_generator_page() -> None:
    st.markdown("## 📝 Project Input & Configuration")
    st.caption("Describe your project idea in 2–3 lines, or pick a sample topic to test immediately.")

    sample_col1, sample_col2 = st.columns([3, 1])
    with sample_col1:
        chosen_sample = st.selectbox(
            "Sample Project Ideas (for quick testing)",
            options=["-- Select a sample project idea --"] + list(SAMPLE_IDEAS.keys()),
        )
    with sample_col2:
        st.markdown("<div style='height:1.7rem;'></div>", unsafe_allow_html=True)
        if st.button("Load Sample", use_container_width=True) and chosen_sample in SAMPLE_IDEAS:
            load_sample(chosen_sample)
            st.rerun()

    st.text_area(
        "Project Idea *",
        key="project_idea",
        height=130,
        placeholder="Example: Detect fake news using machine learning techniques to improve the accuracy of online information verification.",
        help="Describe your project idea in 2–3 lines.",
    )
    st.caption("Instruction: Describe your project idea in 2–3 lines.")

    col_d, col_c = st.columns(2)
    with col_d:
        st.selectbox("Domain Selection *", options=ALLOWED_DOMAINS, key="domain")
    with col_c:
        if st.session_state["domain"] == "Other":
            st.text_input(
                "Custom Domain *",
                key="custom_domain",
                placeholder="e.g., Robotics, Bioinformatics, Edge Computing",
            )

    opt1, opt2, opt3 = st.columns(3)
    with opt1:
        st.selectbox("Research Level", options=ALLOWED_RESEARCH_LEVELS, key="research_level")
    with opt2:
        st.selectbox("Writing Style", options=ALLOWED_WRITING_STYLES, key="writing_style")
    with opt3:
        st.selectbox("Research Focus", options=ALLOWED_RESEARCH_FOCUS, key="research_focus")

    if st.session_state.get("last_error"):
        st.error(st.session_state["last_error"])
        if st.button("🔄 Retry Generation"):
            st.session_state["last_error"] = ""
            st.rerun()

    if st.button("✨ Generate Research Content", type="primary", use_container_width=True):
        is_valid, err_msg, resolved_domain = validate_user_inputs(
            project_idea=st.session_state["project_idea"],
            domain=st.session_state["domain"],
            custom_domain=st.session_state["custom_domain"],
            research_level=st.session_state["research_level"],
            writing_style=st.session_state["writing_style"],
            research_focus=st.session_state["research_focus"],
        )

        if not is_valid:
            st.session_state["last_error"] = err_msg
            st.error(err_msg)
            return

        try:
            with st.spinner("Generating titles, 150–200 word abstract, keywords, objectives, and future enhancements..."):
                result = generate_complete_research(
                    project_idea=st.session_state["project_idea"],
                    domain=resolved_domain,
                    research_level=st.session_state["research_level"],
                    writing_style=st.session_state["writing_style"],
                    research_focus=st.session_state["research_focus"],
                )
            st.session_state["research_result"] = result
            st.session_state["resolved_domain"] = resolved_domain
            st.session_state["selected_title_idx"] = 0
            st.session_state["last_error"] = ""
            st.session_state["page"] = "Results Dashboard"
            st.success("Research content generated successfully!")
            st.rerun()
        except (GeminiServiceError, ValueError) as exc:
            st.session_state["last_error"] = str(exc)
            st.error(str(exc))


def render_results_dashboard() -> None:
    result = st.session_state.get("research_result")
    if not result:
        st.info("No research content generated yet. Head to the Generator tab to create your first research package.")
        if st.button("Go to Generator"):
            st.session_state["page"] = "Generator"
            st.rerun()
        return

    titles = result["titles"]
    selected_idx = st.session_state.get("selected_title_idx", 0)
    selected_title = titles[selected_idx]["title"]
    resolved_domain = st.session_state.get("resolved_domain", st.session_state["domain"])

    top_left, top_right = st.columns([3, 1.5])
    with top_left:
        st.markdown("## 📊 Research Results Dashboard")
        st.caption(
            f"Domain: {resolved_domain} | Level: {st.session_state['research_level']} | "
            f"Style: {st.session_state['writing_style']} | Focus: {st.session_state['research_focus']}"
        )
    with top_right:
        if st.button("🆕 Generate New Research", use_container_width=True):
            reset_research()
            st.rerun()

    st.success(f"**Selected Research Title:** {selected_title}")

    # Downloads row
    dl1, dl2, dl_spacer = st.columns([1.2, 1.2, 3])
    txt_content = format_research_txt(
        selected_title=selected_title,
        domain=resolved_domain,
        research_level=st.session_state["research_level"],
        writing_style=st.session_state["writing_style"],
        research_focus=st.session_state["research_focus"],
        research_data=result,
    )
    pdf_bytes = build_research_pdf(
        project_idea=st.session_state["project_idea"],
        selected_title=selected_title,
        domain=resolved_domain,
        research_level=st.session_state["research_level"],
        writing_style=st.session_state["writing_style"],
        research_focus=st.session_state["research_focus"],
        research_data=result,
    )
    with dl1:
        st.download_button(
            "⬇️ Download as TXT",
            data=txt_content,
            file_name="research_summary.txt",
            mime="text/plain",
            use_container_width=True,
        )
    with dl2:
        st.download_button(
            "📄 Download as PDF",
            data=pdf_bytes,
            file_name="research_paper_summary.pdf",
            mime="application/pdf",
            use_container_width=True,
        )

    tab_all, tab_titles, tab_obj = st.tabs(
        ["Complete Overview", "Titles & Abstract", "Keywords, Objectives & Future Work"]
    )

    def show_titles_and_abstract() -> None:
        st.markdown("### 1. Three Research Title Options")
        title_cols = st.columns(3)
        for idx, item in enumerate(titles):
            with title_cols[idx]:
                is_selected = idx == st.session_state["selected_title_idx"]
                border_color = "#2563EB" if is_selected else "#E2E8F0"
                st.markdown(
                    f"""
                    <div class="academic-card" style="border: 2px solid {border_color};">
                      <p style="font-size:0.78rem; color:#4F46E5; font-weight:600; margin-bottom:0.3rem;">
                        Option {idx + 1} · {item['approach']}
                      </p>
                      <h4>{item['title']}</h4>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                if st.button(
                    "✅ Selected" if is_selected else "Select Title",
                    key=f"select_title_{idx}",
                    use_container_width=True,
                ):
                    st.session_state["selected_title_idx"] = idx
                    st.rerun()
                render_copy_button(item["title"], "Copy Title", f"title_{idx}")

        st.markdown("### 2. Research Abstract")
        word_count = result["abstract_word_count"]
        in_range = 150 <= word_count <= 200
        st.markdown(
            f"""
            <div class="academic-card">
              <p style="color:#0F172A; font-size:0.98rem; line-height:1.7;">{result['abstract']}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        wc_col, copy_col, regen_col = st.columns([1.6, 1.2, 1.4])
        with wc_col:
            status_label = "Within 150–200 words" if in_range else "Outside 150–200 target"
            st.info(f"📊 Word Count: **{word_count} words** ({status_label})")
        with copy_col:
            render_copy_button(result["abstract"], "Copy Abstract", "abstract")
        with regen_col:
            if st.button("🔄 Regenerate Abstract", use_container_width=True):
                try:
                    with st.spinner("Regenerating 150–200 word abstract..."):
                        updated = generate_abstract(
                            project_idea=st.session_state["project_idea"],
                            domain=resolved_domain,
                            research_level=st.session_state["research_level"],
                            writing_style=st.session_state["writing_style"],
                            research_focus=st.session_state["research_focus"],
                            selected_title=selected_title,
                        )
                        result["abstract"] = updated["abstract"]
                        result["abstract_word_count"] = updated["word_count"]
                        st.session_state["research_result"] = result
                        st.rerun()
                except (GeminiServiceError, ValueError) as exc:
                    st.error(str(exc))

    def show_keywords_objectives_future() -> None:
        st.markdown("### 3. Five Research Keywords")
        keywords_joined = " | ".join(result["keywords"])
        st.markdown(f'<div class="keyword-strip">{keywords_joined}</div>', unsafe_allow_html=True)
        render_copy_button(keywords_joined, "Copy Keywords", "keywords")

        st.markdown("### 4. Three Research Objectives")
        for idx, obj in enumerate(result["objectives"], start=1):
            st.markdown(
                f"""
                <div class="academic-card">
                  <h4>Objective {idx:02d}</h4>
                  <p>{obj}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        objectives_text = "\n".join(f"{i}. {o}" for i, o in enumerate(result["objectives"], start=1))
        render_copy_button(objectives_text, "Copy Objectives", "objectives")

        st.markdown("### 5. Three Future Enhancements")
        enh_cols = st.columns(3)
        for idx, enh in enumerate(result["future_enhancements"]):
            with enh_cols[idx]:
                st.markdown(
                    f"""
                    <div class="academic-card">
                      <h4>{idx + 1}. {enh['title']}</h4>
                      <p>{enh['description']}</p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
        enh_text = "\n".join(
            f"{i}. {e['title']}: {e['description']}"
            for i, e in enumerate(result["future_enhancements"], start=1)
        )
        render_copy_button(enh_text, "Copy Future Enhancements", "enhancements")

    with tab_all:
        show_titles_and_abstract()
        st.divider()
        show_keywords_objectives_future()

    with tab_titles:
        show_titles_and_abstract()

    with tab_obj:
        show_keywords_objectives_future()


def render_advisor_chat() -> None:
    from utils.gemini_service import chat_with_advisor

    st.markdown("## 💬 AI Research Advisor Chat")
    st.caption("Ask multi-turn follow-up questions about your methodology, abstract, or paper structure.")

    if "chat_messages" not in st.session_state:
        st.session_state["chat_messages"] = []

    col_role, col_clear = st.columns([3, 1])
    with col_role:
        advisor_role = st.selectbox(
            "Advisor Role",
            options=["Methodology Advisor", "Peer Reviewer", "Academic Writer"],
            key="advisor_role",
        )
    with col_clear:
        st.markdown("<div style='height:1.7rem;'></div>", unsafe_allow_html=True)
        if st.button("Clear Chat", use_container_width=True):
            st.session_state["chat_messages"] = []
            st.rerun()

    for msg in st.session_state["chat_messages"]:
        with st.chat_message("user" if msg["role"] == "user" else "assistant"):
            st.markdown(msg["text"])

    prompt = st.chat_input("Ask your AI Research Advisor anything about your project...")
    if prompt:
        st.session_state["chat_messages"].append({"role": "user", "text": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        context_lines = []
        if st.session_state.get("project_idea"):
            context_lines.append(f"Project Idea: {st.session_state['project_idea']}")
        if st.session_state.get("resolved_domain"):
            context_lines.append(f"Domain: {st.session_state['resolved_domain']}")
        if st.session_state.get("research_result"):
            res = st.session_state["research_result"]
            sel_idx = st.session_state.get("selected_title_idx", 0)
            context_lines.append(f"Selected Title: {res['titles'][sel_idx]['title']}")
            context_lines.append(f"Abstract: {res['abstract']}")

        try:
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    reply = chat_with_advisor(
                        messages=st.session_state["chat_messages"],
                        advisor_role=advisor_role,
                        research_context="\n".join(context_lines),
                    )
                    st.markdown(reply)
            st.session_state["chat_messages"].append({"role": "model", "text": reply})
        except GeminiServiceError as exc:
            st.error(str(exc))


def main() -> None:
    init_session_state()

    with st.sidebar:
        logo_path = os.path.join(os.path.dirname(__file__), "assets", "logo.png")
        if os.path.exists(logo_path):
            st.image(logo_path, width=64)
        st.markdown("### AI Research Generator")
        st.caption("Turn Your Ideas Into Research-Ready Projects.")
        pages = ["Home", "Generator", "Results Dashboard", "AI Research Advisor"]
        nav = st.radio(
            "Navigation",
            options=pages,
            index=pages.index(st.session_state["page"]) if st.session_state["page"] in pages else 0,
        )
        if nav != st.session_state["page"]:
            st.session_state["page"] = nav
            st.rerun()

    if st.session_state["page"] == "Home":
        render_home_page()
    elif st.session_state["page"] == "Generator":
        render_generator_page()
    elif st.session_state["page"] == "AI Research Advisor":
        render_advisor_chat()
    else:
        render_results_dashboard()


if __name__ == "__main__":
    main()
