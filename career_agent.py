import json

from llm import run_llm
from rag import get_resume_data


CAREER_ADVICE_SCHEMA = {
    "current_role": "",
    "next_role": "",
    "skill_gaps": [],
    "recommended_certifications": [],
    "career_path": [],
    "learning_plan": [],
    "reasoning": "",
}


def _parse_json_response(raw_response):
    if not raw_response:
        return None

    text = raw_response.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    object_start = text.find("{")
    object_end = text.rfind("}")
    if object_start == -1 or object_end == -1 or object_end <= object_start:
        return None

    try:
        return json.loads(text[object_start : object_end + 1])
    except json.JSONDecodeError:
        return None


def _normalize_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _normalize_advice(parsed, raw_response=""):
    advice = CAREER_ADVICE_SCHEMA.copy()

    if not isinstance(parsed, dict):
        advice["reasoning"] = "Gemini did not return valid JSON."
        advice["raw_response"] = raw_response
        return advice

    advice["current_role"] = str(parsed.get("current_role") or "").strip()
    advice["next_role"] = str(parsed.get("next_role") or "").strip()
    advice["reasoning"] = str(parsed.get("reasoning") or "").strip()
    advice["skill_gaps"] = _normalize_list(
        parsed.get("skill_gaps") or parsed.get("missing_skills")
    )
    advice["recommended_certifications"] = _normalize_list(
        parsed.get("recommended_certifications")
    )
    advice["career_path"] = _normalize_list(parsed.get("career_path"))
    advice["learning_plan"] = _normalize_list(parsed.get("learning_plan"))

    return advice


def career_advisor_agent(query=None):
    resume_data = get_resume_data()

    prompt = f"""
You are a senior cybersecurity career advisor.

Use the resume profile from ChromaDB to analyze the candidate's current profile,
skill gaps, certifications, and next best career role.

USER QUESTION:
{query or "Recommend the best next cybersecurity career step."}

RESUME DATA:
{json.dumps(resume_data, indent=2)}

RESPONSIBILITIES:
- Read the resume data.
- Analyze skill gaps against the next practical cybersecurity role.
- Recommend certifications.
- Recommend the next career role.
- Return structured JSON only.

Return ONLY valid JSON with this exact shape:
{{
  "current_role": "",
  "next_role": "",
  "skill_gaps": [],
  "recommended_certifications": [],
  "career_path": [],
  "learning_plan": [],
  "reasoning": ""
}}
"""

    raw_response = run_llm(prompt)
    parsed = _parse_json_response(raw_response)
    advice = _normalize_advice(parsed, raw_response=raw_response)
    advice["resume_data"] = resume_data
    return advice
