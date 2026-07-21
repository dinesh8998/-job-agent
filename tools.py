import requests
from bs4 import BeautifulSoup

def search_jobs(keyword):
    url = f"https://www.indeed.com/jobs?q={keyword}"

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")

    jobs = []

    for job in soup.select("h2.jobTitle"):
        jobs.append(job.get_text(strip=True))

    if not jobs:
        return [
            f"{keyword} - SOC Analyst (Fallback)",
            f"{keyword} - Security Engineer (Fallback)"
        ]

    return jobs[:5]

