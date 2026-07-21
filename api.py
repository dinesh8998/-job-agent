import json
import logging
from io import BytesIO
from datetime import datetime, timezone

import pdfplumber
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from llm import run_llm, stream_llm
from multi_agent import career_advisor_agent, job_finder_agent, resume_agent
from rag import add_data, save_resume_data


class JsonFormatter(logging.Formatter):
    reserved_attrs = {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "module",
        "msecs",
        "message",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "thread",
        "threadName",
    }

    def format(self, record):
        log_data = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in self.reserved_attrs and not key.startswith("_"):
                log_data[key] = value

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, default=str)


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger = logging.getLogger("job-agent-api")
logger.setLevel(logging.INFO)
logger.handlers.clear()
logger.addHandler(handler)
logger.propagate = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class JobRequest(BaseModel):
    query: str


class CareerAdviceRequest(BaseModel):
    skills: list[str] = Field(default_factory=list)
    query: str = ""


RESUME_RESPONSE_SCHEMA = {
    "skills": [],
    "certifications": [],
    "experience": "",
    "job_titles": [],
    "education": "",
}


def log_info(message, **fields):
    logger.info(message, extra=fields)


def log_exception(message, **fields):
    logger.exception(message, extra=fields)


def error_response(status_code, error, message):
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "message": message},
    )


def normalize_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def normalize_text(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(str(item).strip() for item in value if str(item).strip())
    return str(value).strip()


def normalize_resume_payload(payload):
    normalized = RESUME_RESPONSE_SCHEMA.copy()
    if not isinstance(payload, dict):
        return normalized

    normalized["skills"] = normalize_list(payload.get("skills"))
    normalized["certifications"] = normalize_list(payload.get("certifications"))
    normalized["experience"] = normalize_text(payload.get("experience"))
    normalized["job_titles"] = normalize_list(payload.get("job_titles"))
    normalized["education"] = normalize_text(payload.get("education"))
    return normalized


def extract_resume_text(content, filename="", content_type=""):
    content_type = (content_type or "").lower()
    filename = filename or ""
    is_pdf = (
        content_type.startswith("application/pdf")
        or filename.lower().endswith(".pdf")
    )

    if not is_pdf:
        return content.decode("utf-8", errors="ignore")

    pages = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append(page_text.strip())

    return "\n\n".join(pages)


def parse_llm_json(raw_response):
    """Best-effort parser for Gemini JSON responses."""
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
    array_start = text.find("[")
    array_end = text.rfind("]")

    candidates = []
    if object_start != -1 and object_end != -1 and object_end > object_start:
        candidates.append(text[object_start : object_end + 1])
    if array_start != -1 and array_end != -1 and array_end > array_start:
        candidates.append(text[array_start : array_end + 1])

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    return None


def extract_resume_data(text):
    prompt = f"""
You are a resume parser for cybersecurity and technology roles.

Extract the candidate's resume details.

STRICT RULES:
- Return ONLY valid JSON
- Do not include markdown
- Do not invent missing details
- Use empty arrays or empty strings when information is missing
- Return exactly these keys: skills, certifications, experience, job_titles, education

Example:
{{
  "skills": [],
  "certifications": [],
  "experience": "",
  "job_titles": [],
  "education": ""
}}

Resume:
{text}
"""

    parsed_resume = parse_llm_json(run_llm(prompt))
    return normalize_resume_payload(parsed_resume)


def match_with_gemini(query, context, jobs):
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
    return run_llm(prompt)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": exc.detail}
    log_info(
        "HTTP EXCEPTION",
        path=request.url.path,
        status_code=exc.status_code,
        detail=detail,
    )
    return JSONResponse(status_code=exc.status_code, content=detail)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log_exception("UNHANDLED EXCEPTION", path=request.url.path)
    return error_response(
        status_code=500,
        error="Internal server error",
        message=str(exc),
    )


@app.post("/match-jobs")
async def match_jobs(req: JobRequest):
    log_info("MATCH JOBS HIT", query=req.query)

    try:
        jobs = job_finder_agent(req.query)
        context = resume_agent(req.query)
        log_info(
            "MEMORY AND LIVE JOBS RETRIEVED",
            query=req.query,
            jobs_count=len(jobs) if isinstance(jobs, list) else 0,
        )

        result = match_with_gemini(req.query, context, jobs)
        parsed = parse_llm_json(result)

        return {
            "jobs": jobs,
            "context": context,
            "result": parsed if parsed is not None else result,
        }
    except Exception as exc:
        log_exception("MATCH JOBS FAILED", query=req.query)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to match jobs", "message": str(exc)},
        ) from exc


@app.post("/stream-jobs")
async def stream_jobs(req: JobRequest):
    log_info("STREAM JOBS HIT", query=req.query)

    try:
        jobs = job_finder_agent(req.query)
        context = resume_agent(req.query)
        jobs_for_prompt = json.dumps(jobs, ensure_ascii=True, indent=2)
        log_info(
            "MEMORY AND LIVE JOBS RETRIEVED",
            query=req.query,
            jobs_count=len(jobs) if isinstance(jobs, list) else 0,
        )

        prompt = f"""
You are an expert cybersecurity job assistant.

USER QUERY:
{req.query}

USER SKILLS:
{context}

AVAILABLE JOBS:
{jobs_for_prompt}

TASK:
- Match best jobs
- Rank top 3
- Explain clearly
"""

        def json_stream():
            first = True
            yield "["
            try:
                for chunk in stream_llm(prompt):
                    payload = {"event": "chunk", "content": chunk}
                    if not first:
                        yield ","
                    yield json.dumps(payload)
                    first = False

                if not first:
                    yield ","
                yield json.dumps({"event": "done"})
            except Exception as exc:
                log_exception("STREAM JOBS GENERATOR FAILED", query=req.query)
                if not first:
                    yield ","
                yield json.dumps({"event": "error", "message": str(exc)})
            finally:
                yield "]"

        return StreamingResponse(json_stream(), media_type="application/json")
    except Exception as exc:
        log_exception("STREAM JOBS FAILED", query=req.query)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to stream job matches", "message": str(exc)},
        ) from exc


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    log_info(
        "UPLOAD RESUME HIT",
        filename=file.filename,
        content_type=file.content_type,
    )

    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Empty upload",
                    "message": "The uploaded resume file is empty.",
                },
            )

        text = extract_resume_text(
            content,
            filename=file.filename,
            content_type=file.content_type or "",
        )

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Empty resume",
                    "message": "No readable text was found in the uploaded resume.",
                },
            )

        resume_data = extract_resume_data(text)

        save_resume_data(
            skills=resume_data["skills"],
            certifications=resume_data["certifications"],
            experience=resume_data["experience"],
            job_titles=resume_data["job_titles"],
            education=resume_data["education"],
            preferred_roles=resume_data["job_titles"],
            raw_text=text,
        )
        add_data(
            text,
            metadata={
                "filename": file.filename,
                "content_type": file.content_type or "",
            },
        )
        log_info(
            "RESUME STORED",
            filename=file.filename,
            skills_count=len(resume_data["skills"]),
            certifications_count=len(resume_data["certifications"]),
            job_titles_count=len(resume_data["job_titles"]),
        )

        return resume_data
    except HTTPException:
        raise
    except Exception as exc:
        log_exception("UPLOAD RESUME FAILED", filename=file.filename)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to upload resume", "message": str(exc)},
        ) from exc


@app.post("/career-advice")
async def career_advice(req: CareerAdviceRequest):
    log_info("CAREER AGENT HIT", query=req.query, skills_count=len(req.skills))

    try:
        result = career_advisor_agent(
            {"skills": req.skills, "query": req.query}
        )
        log_info("CAREER ADVICE GENERATED", query=req.query)
        return result
    except Exception as exc:
        log_exception("CAREER ADVICE FAILED", query=req.query)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to generate career advice", "message": str(exc)},
        ) from exc
