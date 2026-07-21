import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("job-scraper-agent")

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
ADZUNA_COUNTRY = os.getenv("ADZUNA_COUNTRY", "us")
ADZUNA_TIMEOUT_SECONDS = 15
ADZUNA_RESULTS_PER_PAGE = 20


def _format_salary(job):
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")

    if salary_min and salary_max:
        return f"{salary_min} - {salary_max}"
    if salary_min:
        return str(salary_min)
    if salary_max:
        return str(salary_max)
    return ""


def _format_location(job):
    location = job.get("location") or {}
    display_name = location.get("display_name")
    if display_name:
        return display_name

    area = location.get("area")
    if isinstance(area, list):
        return ", ".join(str(item) for item in area if item)

    return ""


def _normalize_job(job):
    company = job.get("company") or {}

    return {
        "title": job.get("title") or "",
        "company": company.get("display_name") or "",
        "location": _format_location(job),
        "salary": _format_salary(job),
        "url": job.get("redirect_url") or "",
    }


def job_scraper_agent(payload):
    """
    Search Adzuna jobs.

    Input:
    {
      "query": "SOC Analyst"
    }

    Output:
    [
      {
        "title": "",
        "company": "",
        "location": "",
        "salary": "",
        "url": ""
      }
    ]
    """
    query = ""
    if isinstance(payload, dict):
        query = str(payload.get("query") or "").strip()

    if not query:
        logger.warning("ADZUNA JOB SCRAPER EMPTY QUERY")
        return []

    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.error("ADZUNA CREDENTIALS MISSING")
        return []

    url = f"{ADZUNA_BASE_URL}/{ADZUNA_COUNTRY}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": query,
        "results_per_page": ADZUNA_RESULTS_PER_PAGE,
        "content-type": "application/json",
    }

    logger.info(
        "ADZUNA JOB SCRAPER HIT",
        extra={
            "query": query,
            "country": ADZUNA_COUNTRY,
            "results_per_page": ADZUNA_RESULTS_PER_PAGE,
        },
    )

    try:
        response = requests.get(
            url,
            params=params,
            timeout=ADZUNA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as exc:
        logger.exception("ADZUNA REQUEST FAILED", extra={"query": query})
        return []
    except ValueError as exc:
        logger.exception("ADZUNA INVALID JSON RESPONSE", extra={"query": query})
        return []

    results = data.get("results", [])
    if not isinstance(results, list):
        logger.error("ADZUNA UNEXPECTED RESPONSE SHAPE", extra={"query": query})
        return []

    jobs = [_normalize_job(job) for job in results[:ADZUNA_RESULTS_PER_PAGE]]
    logger.info(
        "ADZUNA JOB SCRAPER SUCCESS",
        extra={"query": query, "jobs_count": len(jobs)},
    )

    return jobs
