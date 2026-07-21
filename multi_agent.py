import json
import logging

from job_scraper import job_scraper_agent
from llm import run_llm
from rag import get_resume_data, search

logger = logging.getLogger("multi-agent")


def job_finder_agent(query):
    logger.debug("JOB FINDER AGENT HIT", extra={"query": query})

    jobs = job_scraper_agent({"query": query})

    logger.debug(
        "JOB FINDER AGENT COMPLETE",
        extra={"query": query, "jobs_count": len(jobs)},
    )
    return jobs


def resume_agent(query):
    logger.debug("RESUME AGENT HIT", extra={"query": query})

    context_docs = search(query)
    context = "\n".join([doc.page_content for doc in context_docs])

    logger.debug(
        "RESUME AGENT COMPLETE",
        extra={"query": query, "documents_count": len(context_docs)},
    )
    return context


def matcher_agent(query, context, jobs):
    logger.debug(
        "MATCHER AGENT HIT",
        extra={
            "query": query,
            "jobs_count": len(jobs) if isinstance(jobs, list) else 0,
            "context_length": len(context or ""),
        },
    )

    jobs_for_prompt = json.dumps(jobs, ensure_ascii=True, indent=2)
    prompt = f"""
You are an expert job matching AI.

USER QUERY:
{query}

USER SKILLS:
{context}

AVAILABLE JOBS:
{jobs_for_prompt}

TASK:
- Analyze skills
- Match jobs
- Rank top 3
- Explain reasoning clearly
"""
    result = run_llm(prompt)
    logger.debug("MATCHER AGENT COMPLETE", extra={"query": query})
    return result


def _parse_json_object(raw_response):
    if not raw_response:
        return None

    text = raw_response.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            return None
        try:
            parsed = json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None

    return parsed if isinstance(parsed, dict) else None


def _normalize_string_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def career_advisor_agent(profile):
    """Generate a cybersecurity career recommendation from a skills profile."""
    profile = profile if isinstance(profile, dict) else {}
    stored_resume = get_resume_data()
    skills = _normalize_string_list(profile.get("skills"))
    if not skills:
        skills = _normalize_string_list(stored_resume.get("skills"))

    query = str(profile.get("query") or "Recommend my next cybersecurity role").strip()
    certifications = _normalize_string_list(
        profile.get("certifications") or stored_resume.get("certifications")
    )

    logger.debug(
        "CAREER ADVISOR AGENT HIT",
        extra={
            "query": query,
            "skills_count": len(skills),
            "certifications_count": len(certifications),
        },
    )

    prompt = f"""
You are a senior cybersecurity career advisor.

Analyze the candidate's skills and recommend the most realistic next career step.
Use common cybersecurity role expectations, not invented experience.

Candidate skills:
{json.dumps(skills)}

Existing certifications:
{json.dumps(certifications)}

Career goal:
{query}

Guidance:
- Wazuh, SIEM, alert monitoring, and incident triage are SOC Analyst signals.
- A SOC Analyst progressing toward Senior SOC Analyst commonly needs enterprise SIEM
  depth such as Splunk and cloud SIEM experience such as Azure Sentinel.
- Recommend certifications that directly support the next role.
- Do not recommend certifications already held.

Return ONLY valid JSON with exactly these fields:
{{
  "current_role": "",
  "next_role": "",
  "missing_skills": [],
  "recommended_certifications": []
}}
"""

    parsed = _parse_json_object(run_llm(prompt))
    if parsed is None:
        logger.debug("CAREER ADVISOR AGENT USING FALLBACK", extra={"query": query})
        parsed = {
            "current_role": "SOC Analyst",
            "next_role": "Senior SOC Analyst",
            "missing_skills": ["Splunk", "Azure Sentinel"],
            "recommended_certifications": ["SC-200", "PNPT"],
        }

    result = {
        "current_role": str(parsed.get("current_role") or "SOC Analyst").strip(),
        "next_role": str(parsed.get("next_role") or "Senior SOC Analyst").strip(),
        "missing_skills": _normalize_string_list(parsed.get("missing_skills")),
        "recommended_certifications": _normalize_string_list(
            parsed.get("recommended_certifications")
        ),
    }

    logger.debug("CAREER ADVISOR AGENT COMPLETE", extra={"query": query})
    return result


def run_pipeline(query):
    logger.debug("MULTI AGENT PIPELINE HIT", extra={"query": query})

    jobs = job_finder_agent(query)
    context = resume_agent(query)
    result = matcher_agent(query, context, jobs)

    logger.debug("MULTI AGENT PIPELINE COMPLETE", extra={"query": query})
    return result
