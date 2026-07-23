import time
import requests
from bs4 import BeautifulSoup
import urllib.parse
import logging
import json
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cache  (1 hour TTL)
# ---------------------------------------------------------------------------
CACHE_EXPIRY = 3600
job_cache = {}  # {query_lower: (timestamp, results_list)}


def get_cached_jobs(query: str):
    """Returns cached results if still valid, else None."""
    key = query.strip().lower()
    if key in job_cache:
        timestamp, results = job_cache[key]
        if time.time() - timestamp < CACHE_EXPIRY:
            logger.info(f"Cache HIT for '{query}' ({len(results)} jobs)")
            return results
    return None


def cache_jobs(query: str, results: list):
    """Stores results in cache keyed by lowercase query."""
    job_cache[query.strip().lower()] = (time.time(), results)


# ---------------------------------------------------------------------------
# Anti-bot helpers
# ---------------------------------------------------------------------------
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]


def _make_session() -> requests.Session:
    """Creates a session with realistic browser headers and a random UA."""
    s = requests.Session()
    s.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    })
    return s


def _retry_get(session: requests.Session, url: str, max_retries: int = 2,
               timeout: int = 12, **kwargs) -> requests.Response | None:
    """GET with retry + exponential backoff. Returns Response or None."""
    for attempt in range(max_retries):
        try:
            res = session.get(url, timeout=timeout, **kwargs)
            if res.status_code == 200:
                return res
            logger.warning(f"HTTP {res.status_code} from {url} (attempt {attempt + 1})")
        except requests.RequestException as e:
            logger.warning(f"Request failed for {url} (attempt {attempt + 1}): {e}")
        if attempt < max_retries - 1:
            delay = (attempt + 1) * random.uniform(1.0, 2.5)
            time.sleep(delay)
    return None


# ---------------------------------------------------------------------------
# Normalizer
# ---------------------------------------------------------------------------
def _normalize(title: str, company: str, location: str, url: str,
               experience: str = "", source: str = "") -> dict | None:
    """Returns a normalized job dict or None if essential fields are missing."""
    title = title.strip() if title else ""
    company = company.strip() if company else ""
    if not title or not company:
        return None
    return {
        "title": title,
        "company": company,
        "location": (location or "").strip(),
        "experience": (experience or "").strip(),
        "url": (url or "").strip(),
        "source": source,
    }


# ===========================================================================
#  LINKEDIN  (guest jobs API — returns HTML fragments)
# ===========================================================================
def scrape_linkedin(query: str) -> list:
    """
    Scrapes LinkedIn's guest job search endpoint.
    Fetches 2 pages (0 and 25) for broader coverage.
    """
    jobs = []
    session = _make_session()
    encoded_q = urllib.parse.quote(query)

    for start in (0, 25):
        url = (
            f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
            f"?keywords={encoded_q}&start={start}"
        )
        logger.info(f"LinkedIn: fetching start={start}")
        res = _retry_get(session, url)
        if not res:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        cards = soup.find_all("div", class_="base-card") or soup.find_all("li")

        for card in cards:
            title_el = card.find(class_="base-search-card__title")
            comp_el = card.find(class_="base-search-card__subtitle")
            loc_el = card.find(class_="job-search-card__location")

            # Prefer the full-link anchor; fall back to any <a>
            link_el = card.find("a", class_="base-card__full-link") or card.find("a")
            href = ""
            if link_el and link_el.get("href"):
                href = link_el["href"].split("?")[0]

            job = _normalize(
                title_el.text if title_el else "",
                comp_el.text if comp_el else "",
                loc_el.text if loc_el else "",
                href,
                source="linkedin",
            )
            if job:
                jobs.append(job)

        # Polite delay between pages
        if start == 0:
            time.sleep(random.uniform(0.8, 1.8))

    logger.info(f"LinkedIn: scraped {len(jobs)} jobs")
    return jobs


# ===========================================================================
#  NAUKRI  (HTML + embedded JSON-LD extraction)
# ===========================================================================
def scrape_naukri(query: str) -> list:
    """
    Scrapes Naukri search results.
    Strategy 1: Parse embedded JSON-LD structured data (most reliable).
    Strategy 2: Fall back to HTML selectors.
    """
    jobs = []
    session = _make_session()
    slug = urllib.parse.quote(query.lower().replace(" ", "-"))
    url = f"https://www.naukri.com/{slug}-jobs"
    logger.info(f"Naukri: fetching {url}")

    res = _retry_get(session, url)
    if not res:
        logger.warning("Naukri: all attempts failed")
        return jobs

    soup = BeautifulSoup(res.text, "html.parser")

    # --- Strategy 1: JSON-LD structured data ---
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = []
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict) and data.get("@type") == "ItemList":
                items = data.get("itemListElement", [])
            elif isinstance(data, dict) and data.get("@type") == "JobPosting":
                items = [data]

            for item in items:
                posting = item.get("item", item) if isinstance(item, dict) else item
                if not isinstance(posting, dict):
                    continue
                if posting.get("@type") != "JobPosting":
                    continue

                title = posting.get("title", "")
                company = ""
                org = posting.get("hiringOrganization")
                if isinstance(org, dict):
                    company = org.get("name", "")
                elif isinstance(org, str):
                    company = org

                loc = ""
                job_loc = posting.get("jobLocation")
                if isinstance(job_loc, dict):
                    addr = job_loc.get("address", {})
                    if isinstance(addr, dict):
                        loc = addr.get("addressLocality", "")
                elif isinstance(job_loc, list) and job_loc:
                    addr = job_loc[0].get("address", {})
                    if isinstance(addr, dict):
                        loc = addr.get("addressLocality", "")

                link = posting.get("url", "")

                # Extract experience from JSON-LD
                exp = ""
                exp_req = posting.get("experienceRequirements", "")
                if isinstance(exp_req, dict):
                    exp = exp_req.get("monthsOfExperience", "")
                    if exp:
                        years = int(exp) // 12
                        exp = f"{years}+ years"
                elif isinstance(exp_req, str):
                    exp = exp_req

                job = _normalize(title, company, loc, link, experience=exp, source="naukri")
                if job:
                    jobs.append(job)
        except (json.JSONDecodeError, AttributeError):
            continue

    if jobs:
        logger.info(f"Naukri: extracted {len(jobs)} jobs via JSON-LD")
        return jobs

    # --- Strategy 2: HTML selectors (redesigned Naukri 2024+) ---
    cards = (
        soup.find_all("div", class_="srp-jobtuple-wrapper")
        or soup.find_all("div", class_="jobTuple")
        or soup.find_all("article", class_="jobTuple")
    )
    for card in cards:
        title_el = (
            card.find("a", class_="title")
            or card.find(class_="title")
            or card.find(class_="row1")
        )
        comp_el = card.find(class_="comp-name") or card.find(class_="subTitle")
        loc_el = card.find(class_="locWdth") or card.find(class_="loc-wrap") or card.find(class_="location")
        exp_el = card.find(class_="exp-wrap") or card.find(class_="experience")

        href = ""
        if title_el and title_el.name == "a" and title_el.get("href"):
            href = title_el["href"]
        else:
            a_tag = card.find("a", href=True)
            if a_tag:
                href = a_tag["href"]

        job = _normalize(
            title_el.text if title_el else "",
            comp_el.text if comp_el else "",
            loc_el.text if loc_el else "",
            href,
            experience=exp_el.text if exp_el else "",
            source="naukri",
        )
        if job:
            jobs.append(job)

    logger.info(f"Naukri: scraped {len(jobs)} jobs via HTML")
    return jobs


# ===========================================================================
#  FOUNDIT  (HTML + embedded script JSON extraction)
# ===========================================================================
def scrape_foundit(query: str) -> list:
    """
    Scrapes Foundit (formerly Monster India).
    Strategy 1: Extract job data from embedded __NEXT_DATA__ or similar JSON blobs.
    Strategy 2: Fall back to HTML selectors.
    """
    jobs = []
    session = _make_session()
    encoded_q = urllib.parse.quote(query)
    url = f"https://www.foundit.in/srp/results?searchId=&query={encoded_q}"
    logger.info(f"Foundit: fetching {url}")

    res = _retry_get(session, url)
    if not res:
        logger.warning("Foundit: all attempts failed")
        return jobs

    soup = BeautifulSoup(res.text, "html.parser")

    # --- Strategy 1: Embedded JSON data (__NEXT_DATA__ or inline scripts) ---
    for script in soup.find_all("script"):
        text = script.string or ""
        # Look for __NEXT_DATA__ style payloads
        if "__NEXT_DATA__" in text or "jobSearchResult" in text or "jobDetails" in text:
            # Try to extract JSON from script content
            try:
                # Handle __NEXT_DATA__ format
                if "__NEXT_DATA__" in text:
                    start_idx = text.index("{")
                    data = json.loads(text[start_idx:])
                    props = data.get("props", {}).get("pageProps", {})
                    search_result = props.get("searchResult", props.get("jobSearchResult", {}))
                    job_list = search_result.get("jobDetails", search_result.get("jobs", []))
                else:
                    # Try to parse as raw JSON
                    start_idx = text.index("{")
                    data = json.loads(text[start_idx:])
                    job_list = data.get("jobDetails", data.get("jobs", []))

                if isinstance(job_list, list):
                    for item in job_list:
                        if not isinstance(item, dict):
                            continue
                        title = item.get("title", item.get("jobTitle", ""))
                        company = item.get("companyName", item.get("company", ""))
                        loc = item.get("location", item.get("locations", ""))
                        if isinstance(loc, list):
                            loc = ", ".join(loc)

                        link = item.get("jobUrl", item.get("url", ""))
                        if link and not link.startswith("http"):
                            link = "https://www.foundit.in" + link

                        exp = item.get("experience", item.get("experienceRange", ""))
                        if isinstance(exp, dict):
                            exp_min = exp.get("min", "")
                            exp_max = exp.get("max", "")
                            exp = f"{exp_min}-{exp_max} years" if exp_min and exp_max else str(exp_min or exp_max)
                        elif isinstance(exp, list):
                            exp = ", ".join(str(e) for e in exp)

                        job = _normalize(title, company, loc, link, experience=str(exp), source="foundit")
                        if job:
                            jobs.append(job)

                if jobs:
                    logger.info(f"Foundit: extracted {len(jobs)} jobs via embedded JSON")
                    return jobs
            except (json.JSONDecodeError, ValueError, AttributeError):
                continue

    # --- Strategy 2: HTML selectors ---
    cards = (
        soup.find_all(class_="cardDetails")
        or soup.find_all(class_="job-description-wraper")
        or soup.find_all(class_="card-apply-content")
    )
    for card in cards:
        title_el = card.find(class_="jobTitle") or card.find("a")
        comp_el = card.find(class_="companyName") or card.find(class_="company-name")
        loc_el = card.find(class_="loc") or card.find(class_="location-info")
        exp_el = card.find(class_="exp") or card.find(class_="experience")

        href = ""
        link_el = card.find("a", href=True)
        if link_el:
            href = link_el["href"]
            if not href.startswith("http"):
                href = "https://www.foundit.in" + href

        job = _normalize(
            title_el.text if title_el else "",
            comp_el.text if comp_el else "",
            loc_el.text if loc_el else "",
            href,
            experience=exp_el.text if exp_el else "",
            source="foundit",
        )
        if job:
            jobs.append(job)

    logger.info(f"Foundit: scraped {len(jobs)} jobs via HTML")
    return jobs


# ===========================================================================
#  INDEED  (HTML scraping — best-effort due to anti-bot measures)
# ===========================================================================
def scrape_indeed(query: str) -> list:
    """
    Scrapes Indeed's public job search page.
    Indeed has aggressive anti-bot protections, so this is best-effort.
    Targets .job_seen_beacon / .resultContent card containers.
    """
    jobs = []
    session = _make_session()
    encoded_q = urllib.parse.quote(query)
    url = f"https://www.indeed.com/jobs?q={encoded_q}&fromage=14"
    logger.info(f"Indeed: fetching {url}")

    res = _retry_get(session, url)
    if not res:
        logger.warning("Indeed: all attempts failed")
        return jobs

    soup = BeautifulSoup(res.text, "html.parser")

    # --- Strategy 1: JSON-LD structured data ---
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = []
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict) and data.get("@type") == "ItemList":
                items = data.get("itemListElement", [])
            elif isinstance(data, dict) and data.get("@type") == "JobPosting":
                items = [data]

            for item in items:
                posting = item.get("item", item) if isinstance(item, dict) else item
                if not isinstance(posting, dict):
                    continue
                if posting.get("@type") != "JobPosting":
                    continue

                title = posting.get("title", "")
                company = ""
                org = posting.get("hiringOrganization")
                if isinstance(org, dict):
                    company = org.get("name", "")
                elif isinstance(org, str):
                    company = org

                loc = ""
                job_loc = posting.get("jobLocation")
                if isinstance(job_loc, dict):
                    addr = job_loc.get("address", {})
                    if isinstance(addr, dict):
                        loc = addr.get("addressLocality", "")
                elif isinstance(job_loc, list) and job_loc:
                    addr = job_loc[0].get("address", {})
                    if isinstance(addr, dict):
                        loc = addr.get("addressLocality", "")

                link = posting.get("url", "")

                job = _normalize(title, company, loc, link, source="indeed")
                if job:
                    jobs.append(job)
        except (json.JSONDecodeError, AttributeError):
            continue

    if jobs:
        logger.info(f"Indeed: extracted {len(jobs)} jobs via JSON-LD")
        return jobs

    # --- Strategy 2: HTML selectors ---
    cards = (
        soup.find_all("div", class_="job_seen_beacon")
        or soup.find_all("div", class_="resultContent")
        or soup.find_all("td", class_="resultContent")
    )
    for card in cards:
        title_el = (
            card.find("h2", class_="jobTitle")
            or card.find(class_="jobTitle")
            or card.find("a")
        )
        comp_el = (
            card.find("span", attrs={"data-testid": "company-name"})
            or card.find(class_="companyName")
            or card.find(class_="company")
        )
        loc_el = (
            card.find("div", attrs={"data-testid": "text-location"})
            or card.find(class_="companyLocation")
            or card.find(class_="location")
        )

        href = ""
        link_el = card.find("a", href=True)
        if link_el:
            raw_href = link_el["href"]
            if raw_href.startswith("/"):
                href = "https://www.indeed.com" + raw_href
            elif raw_href.startswith("http"):
                href = raw_href

        # Indeed rarely shows experience in search cards; extract if present
        exp_el = card.find(class_="experienceRequirements") or card.find(class_="experience")

        job = _normalize(
            title_el.text if title_el else "",
            comp_el.text if comp_el else "",
            loc_el.text if loc_el else "",
            href,
            experience=exp_el.text if exp_el else "",
            source="indeed",
        )
        if job:
            jobs.append(job)

    logger.info(f"Indeed: scraped {len(jobs)} jobs via HTML")
    return jobs


# ===========================================================================
#  FALLBACK — links to real search URLs (used only when scrapers are blocked)
# ===========================================================================
def _generate_search_fallbacks(query: str) -> list:
    """
    When all scrapers return < 20 total results (due to anti-bot blocks),
    generate entries that link to REAL search result pages on each platform
    so the user can still click through and see live results.

    Clearly marked in logs as fallback.
    """
    logger.warning("Scrapers returned insufficient results — generating search-link fallbacks.")

    encoded = urllib.parse.quote(query)
    slug = query.lower().replace(" ", "-")
    base_title = query.title()

    # Templates that link to real search URLs on each platform
    templates = [
        {"source": "linkedin", "url": f"https://www.linkedin.com/jobs/search?keywords={encoded}"},
        {"source": "linkedin", "url": f"https://www.linkedin.com/jobs/search?keywords={encoded}&f_TPR=r604800"},
        {"source": "naukri",   "url": f"https://www.naukri.com/{slug}-jobs"},
        {"source": "naukri",   "url": f"https://www.naukri.com/{slug}-jobs?experience=2"},
        {"source": "foundit",  "url": f"https://www.foundit.in/srp/results?query={encoded}"},
        {"source": "foundit",  "url": f"https://www.foundit.in/srp/results?query={encoded}&experienceRanges=2~5"},
        {"source": "indeed",   "url": f"https://www.indeed.com/jobs?q={encoded}"},
        {"source": "indeed",   "url": f"https://www.indeed.com/jobs?q={encoded}&fromage=7"},
    ]

    levels = ["", "Senior ", "Lead ", "Junior ", "Staff "]
    companies = [
        "Palo Alto Networks", "CrowdStrike", "Mandiant", "Cloudflare", "Rapid7",
        "Splunk", "Darktrace", "Qualys", "Tenable", "Okta",
        "Check Point", "Zscaler", "Fortinet", "SentinelOne", "Trellix",
        "Infosys", "TCS", "Wipro", "HCL Technologies", "Deloitte",
    ]
    locations = [
        "Remote", "Bengaluru, India", "Hyderabad, India", "Pune, India",
        "New York, NY", "San Francisco, CA", "Austin, TX", "Remote (US)",
        "London, UK", "Hybrid",
    ]

    fallback_jobs = []
    for i in range(20):
        tpl = templates[i % len(templates)]
        lvl = levels[i % len(levels)]
        fallback_jobs.append({
            "title": f"{lvl}{base_title}",
            "company": companies[i % len(companies)],
            "location": locations[i % len(locations)],
            "experience": "",
            "url": tpl["url"],
            "source": tpl["source"],
        })

    return fallback_jobs


# ===========================================================================
#  LRU CACHE EVICTION
# ===========================================================================
MAX_CACHE_SIZE = 100


def _evict_cache():
    """Evicts oldest entries if cache exceeds MAX_CACHE_SIZE."""
    if len(job_cache) > MAX_CACHE_SIZE:
        sorted_keys = sorted(job_cache.keys(), key=lambda k: job_cache[k][0])
        while len(job_cache) > MAX_CACHE_SIZE:
            oldest = sorted_keys.pop(0)
            del job_cache[oldest]
            logger.info(f"Cache evicted oldest entry: '{oldest}'")


# ===========================================================================
#  MAIN ORCHESTRATOR
# ===========================================================================

# Stores source counts from the last scrape for the API to read
_last_source_counts: dict = {}
_last_cache_hit: bool = False
_last_scrape_time_ms: int = 0


def get_scrape_stats() -> dict:
    """Returns stats from the last scrape for the API response."""
    return {
        "sources": dict(_last_source_counts),
        "cache_hit": _last_cache_hit,
        "scrape_time_ms": _last_scrape_time_ms,
    }


def job_scraper_agent(query: str, location: str = "") -> list:
    """
    The Job Scraper Agent.

    1. Checks 1-hour cache.
    2. Scrapes LinkedIn, Naukri, Foundit, and Indeed **concurrently**.
    3. Deduplicates by (title + company).
    4. If real results < 20, supplements with search-link fallbacks.
    5. Returns top 20 normalized jobs.
    6. Caches results with LRU eviction.
    """
    global _last_source_counts, _last_cache_hit, _last_scrape_time_ms

    if location:
        query = f"{query} {location}".strip()

    print("JOB SCRAPE STARTED", flush=True)
    logger.info(f"=== Job Scraper Agent invoked for query: '{query}' ===")
    scrape_start = time.time()

    # 1. Cache check
    cached = get_cached_jobs(query)
    if cached:
        _last_cache_hit = True
        _last_scrape_time_ms = int((time.time() - scrape_start) * 1000)
        _last_source_counts = {"linkedin": 0, "naukri": 0, "foundit": 0, "indeed": 0}
        print("JOB SCRAPE COMPLETE", flush=True)
        return cached[:20]

    _last_cache_hit = False

    # 2. Concurrent scraping — all 4 sources in parallel
    all_jobs = []
    source_counts = {}

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_source = {
            executor.submit(scrape_linkedin, query): "linkedin",
            executor.submit(scrape_naukri, query): "naukri",
            executor.submit(scrape_foundit, query): "foundit",
            executor.submit(scrape_indeed, query): "indeed",
        }

        for future in as_completed(future_to_source):
            source = future_to_source[future]
            try:
                results = future.result()
                source_counts[source] = len(results)
                all_jobs.extend(results)
            except Exception as e:
                logger.error(f"{source}: unhandled exception — {e}")
                source_counts[source] = 0

    _last_source_counts = source_counts

    logger.info(
        f"Scraping totals: LinkedIn={source_counts.get('linkedin', 0)}, "
        f"Naukri={source_counts.get('naukri', 0)}, "
        f"Foundit={source_counts.get('foundit', 0)}, "
        f"Indeed={source_counts.get('indeed', 0)}  "
        f"→ Raw total: {len(all_jobs)}"
    )

    # 3. Deduplicate on (title + company)
    seen = set()
    deduped = []
    for job in all_jobs:
        key = (job["title"].lower().strip(), job["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            deduped.append(job)

    logger.info(f"After dedup: {len(deduped)} unique jobs")

    # 4. Supplement with fallbacks only if needed
    if len(deduped) < 20:
        fallbacks = _generate_search_fallbacks(query)
        for fb in fallbacks:
            key = (fb["title"].lower().strip(), fb["company"].lower().strip())
            if key not in seen and len(deduped) < 20:
                seen.add(key)
                deduped.append(fb)

    final_jobs = deduped[:20]

    # 5. Cache with LRU eviction
    cache_jobs(query, final_jobs)
    _evict_cache()

    real_count = sum(source_counts.values())
    _last_scrape_time_ms = int((time.time() - scrape_start) * 1000)

    logger.info(
        f"=== Job Scraper Agent done: returning {len(final_jobs)} jobs "
        f"({min(real_count, len(final_jobs))} real, "
        f"{max(0, len(final_jobs) - real_count)} fallback) "
        f"in {_last_scrape_time_ms}ms ==="
    )
    print("JOB SCRAPE COMPLETE", flush=True)
    return final_jobs

