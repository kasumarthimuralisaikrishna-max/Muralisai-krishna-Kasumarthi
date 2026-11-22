# AI Research Title & Abstract Generator

**Tagline:** *"Turn Your Ideas Into Research-Ready Projects."*

An AI-powered Streamlit application built with Python and the Google Gemini API (`google-genai`) that transforms rough student project ideas into structured, academic-ready research documentation.

## Features

1. **Smart Research Title Generator** — Generates 3 distinct academic titles with differing perspectives and lets you select and copy your preferred option.
2. **AI Abstract Writer** — Crafts a formal 150–200 word abstract covering background, problem statement, proposed methodology, expected outcome, and significance, with automatic Python word-count validation and regeneration.
3. **Keyword Generator** — Produces 5 unique, domain-specific academic keywords.
4. **Research Objectives Generator** — Outputs 3 clear, measurable, action-verb-led research objectives.
5. **Future Enhancement Suggestions** — Suggests 3 realistic technical improvements targeting scalability, performance, and accuracy.
6. **Academic Exports** — Download the full research package as formatted `.txt` or `.pdf` (`fpdf2`).

## Project Structure

```text
research_generator/
├── app.py
├── requirements.txt
├── .env.example
├── README.md
├── .streamlit/
│   └── config.toml
├── utils/
│   ├── __init__.py
│   ├── gemini_service.py
│   ├── content_generator.py
│   ├── validators.py
│   └── exporters.py
└── assets/
    └── logo.png
```

## Setup & Running Locally

1. Navigate to the project folder and create a virtual environment:
   ```bash
   cd research_generator
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure your Gemini API key securely using **either** `.env` or `.streamlit/secrets.toml`:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
   Or create `.streamlit/secrets.toml`:
   ```toml
   GEMINI_API_KEY = "your_gemini_api_key_here"
   ```

4. Launch the application:
   ```bash
   streamlit run app.py
   ```

## Sample Project Ideas Included

1. Fake News Detection Using Machine Learning
2. Smart Irrigation System Using IoT
3. Secure Online Payment System Using Cybersecurity
4. AI-Based Student Performance Prediction
5. Online Food Ordering Web Application
