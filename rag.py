import json
from datetime import datetime, timezone
from uuid import uuid4

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

embedding = HuggingFaceEmbeddings()

db = Chroma(
    persist_directory="./job_db",
    embedding_function=embedding,
)

RESUME_LIST_FIELDS = ("skills", "certifications", "job_titles", "preferred_roles")
RESUME_TEXT_FIELDS = ("experience", "education")
RESUME_FIELDS = RESUME_LIST_FIELDS + RESUME_TEXT_FIELDS


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _normalize_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _normalize_text(value):
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return "\n".join(str(item).strip() for item in value if str(item).strip())
    return str(value).strip()


def _metadata_value(value):
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return value
    return json.dumps(value, ensure_ascii=True)


def _clean_metadata(metadata):
    return {
        str(key): _metadata_value(value)
        for key, value in (metadata or {}).items()
        if value is not None
    }


def _decode_json_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        decoded = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return _normalize_list(value)
    return _normalize_list(decoded)


def _persist():
    persist = getattr(db, "persist", None)
    if callable(persist):
        persist()


def _build_resume_document(resume_data):
    lines = []
    labels = {
        "skills": "Skills",
        "certifications": "Certifications",
        "job_titles": "Job titles",
        "preferred_roles": "Preferred roles",
        "experience": "Experience",
        "education": "Education",
    }

    for field in RESUME_FIELDS:
        values = resume_data[field]
        if values:
            if isinstance(values, list):
                lines.append(f"{labels[field]}: {', '.join(values)}")
            else:
                lines.append(f"{labels[field]}: {values}")

    return "\n".join(lines) or "Resume profile"


def _format_resume_field(field, value):
    label = field.replace("_", " ").title()
    if isinstance(value, list):
        return f"{label}: {', '.join(value)}"
    return f"{label}: {value}"


def add_data(text, metadata=None):
    metadata = _clean_metadata(
        {
            "document_type": "resume_text",
            "category": "raw_resume",
            "created_at": _now_iso(),
            **(metadata or {}),
        }
    )
    ids = db.add_texts([text], metadatas=[metadata], ids=[f"resume-text-{uuid4()}"])
    _persist()
    return ids


def save_resume_data(
    skills=None,
    certifications=None,
    experience=None,
    job_titles=None,
    education=None,
    preferred_roles=None,
    raw_text=None,
):
    resume_data = {
        "skills": _normalize_list(skills),
        "certifications": _normalize_list(certifications),
        "job_titles": _normalize_list(job_titles),
        "preferred_roles": _normalize_list(preferred_roles),
        "experience": _normalize_text(experience),
        "education": _normalize_text(education),
    }
    created_at = _now_iso()
    batch_id = f"resume-{uuid4()}"

    texts = [_build_resume_document(resume_data)]
    metadatas = [
        _clean_metadata(
            {
                "document_type": "resume_profile",
                "category": "summary",
                "batch_id": batch_id,
                "created_at": created_at,
                "skills": resume_data["skills"],
                "certifications": resume_data["certifications"],
                "job_titles": resume_data["job_titles"],
                "experience": resume_data["experience"],
                "education": resume_data["education"],
                "preferred_roles": resume_data["preferred_roles"],
                "raw_text": raw_text or "",
            }
        )
    ]
    ids = [f"{batch_id}-summary"]

    for field in RESUME_FIELDS:
        values = resume_data[field]
        if not values:
            continue
        texts.append(_format_resume_field(field, values))
        metadatas.append(
            _clean_metadata(
                {
                    "document_type": "resume_profile",
                    "category": field,
                    "batch_id": batch_id,
                    "created_at": created_at,
                    "values": values,
                }
            )
        )
        ids.append(f"{batch_id}-{field}")

    db.add_texts(texts, metadatas=metadatas, ids=ids)
    _persist()

    return {
        "id": batch_id,
        "skills": resume_data["skills"],
        "certifications": resume_data["certifications"],
        "job_titles": resume_data["job_titles"],
        "experience": resume_data["experience"],
        "education": resume_data["education"],
        "preferred_roles": resume_data["preferred_roles"],
    }


def get_resume_data():
    try:
        result = db.get(
            where={"document_type": "resume_profile"},
            include=["metadatas", "documents"],
        )
    except Exception:
        return {
            "skills": [],
            "certifications": [],
            "job_titles": [],
            "experience": "",
            "education": "",
            "preferred_roles": [],
        }

    metadatas = result.get("metadatas") or []
    summaries = [
        metadata
        for metadata in metadatas
        if metadata.get("category") == "summary"
    ]

    if summaries:
        metadata = sorted(
            summaries,
            key=lambda item: item.get("created_at", ""),
            reverse=True,
        )[0]
        return {
            "skills": _decode_json_list(metadata.get("skills")),
            "certifications": _decode_json_list(metadata.get("certifications")),
            "job_titles": _decode_json_list(metadata.get("job_titles")),
            "experience": _normalize_text(metadata.get("experience")),
            "education": _normalize_text(metadata.get("education")),
            "preferred_roles": _decode_json_list(metadata.get("preferred_roles")),
        }

    resume_data = {field: [] for field in RESUME_LIST_FIELDS}
    resume_data.update({field: "" for field in RESUME_TEXT_FIELDS})
    for metadata in metadatas:
        category = metadata.get("category")
        if category in RESUME_LIST_FIELDS:
            resume_data[category].extend(_decode_json_list(metadata.get("values")))
        elif category in RESUME_TEXT_FIELDS:
            text = _normalize_text(metadata.get("values"))
            if text:
                resume_data[category] = text

    return {
        field: list(dict.fromkeys(resume_data[field]))
        if field in RESUME_LIST_FIELDS
        else resume_data[field]
        for field in RESUME_FIELDS
    }


def search(query, k=3):
    return db.similarity_search(query, k=k)


def similarity_search_for_jobs(query, k=5):
    resume_data = get_resume_data()
    context_parts = []
    for field in RESUME_FIELDS:
        value = resume_data.get(field, [])
        if isinstance(value, list):
            context_parts.extend(value)
        elif value:
            context_parts.append(value)
    resume_context = " ".join(context_parts)
    search_query = f"{query}\n{resume_context}".strip()
    return db.similarity_search(search_query, k=k)


def job_match_similarity_search(query, k=5):
    return similarity_search_for_jobs(query, k=k)


def search_for_job_matching(query, k=5):
    return similarity_search_for_jobs(query, k=k)
