from rag import search
from tools import search_jobs
from llm import run_llm


def build_prompt(query, context, jobs_text):
    return f"""
You are an AI job assistant.

USER QUERY:
{query}

USER SKILLS / CONTEXT:
{context}

AVAILABLE JOBS:
{jobs_text}

TASK:
- Analyze user skills
- Match jobs
- Rank top 3 jobs
- Explain why they match
- Suggest best option
"""


def main():
    query = input("Enter job role: ")

    context_docs = search(query)
    context = "\n".join([doc.page_content for doc in context_docs])

    jobs = search_jobs(query)
    jobs_text = "\n".join(jobs)

    output = run_llm(build_prompt(query, context, jobs_text))

    print("\n===== FINAL OUTPUT =====\n")
    print(output)


if __name__ == "__main__":
    main()
