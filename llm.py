import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")

client = genai.Client(api_key=GEMINI_API_KEY)


def run_llm(prompt):
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    return (response.text or "").strip()


def stream_llm(prompt):
    stream = client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    for chunk in stream:
        if chunk.text:
            yield chunk.text
