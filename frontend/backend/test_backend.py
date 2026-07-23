import os
import unittest
import json
from fastapi.testclient import TestClient

# Mock environmental variable before importing main module
os.environ["GEMINI_API_KEY"] = "mock_gemini_key_for_testing"

# Import our backend components
from main import app
from utils import extract_text_from_pdf
from memory import store_resume, retrieve_resume
from job_scraper import job_scraper_agent
from agents import resume_agent, job_finder_agent, matcher_agent, career_advisor_agent

class TestBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.sample_metadata = {
            "skills": ["Python", "SIEM", "Incident Response"],
            "certifications": ["CompTIA Security+"],
            "experience": "2 years as a SOC Analyst",
            "job_titles": ["SOC Analyst"],
            "education": "B.S. in Computer Science"
        }

    def test_utils_pdf_extraction(self):
        # Simply checks function handles empty/invalid bytes gracefully
        text = extract_text_from_pdf(b"invalid pdf data")
        self.assertEqual(text, "")

    def test_memory_store_and_retrieve(self):
        # Test storing resume
        store_resume("test_user", "This is a test resume content.", self.sample_metadata)
        
        # Test retrieving resume
        retrieved = retrieve_resume("test_user")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["id"], "test_user")
        self.assertEqual(retrieved["text"], "This is a test resume content.")
        self.assertEqual(retrieved["metadata"]["skills"], self.sample_metadata["skills"])
        self.assertEqual(retrieved["metadata"]["certifications"], self.sample_metadata["certifications"])

    def test_scraper_agent(self):
        # Test job scraping function caching and normalization
        jobs = job_scraper_agent("Threat Hunter")
        self.assertEqual(len(jobs), 20)
        for job in jobs:
            self.assertIn("title", job)
            self.assertIn("company", job)
            self.assertIn("location", job)
            self.assertIn("url", job)

    def test_career_advisor_agent(self):
        # Run career advisor
        resume_data = {
            "metadata": self.sample_metadata
        }
        advice = career_advisor_agent("How can I become a Threat Hunter?", resume_data)
        self.assertIn("current_role", advice)
        self.assertIn("next_role", advice)
        self.assertIn("missing_skills", advice)
        self.assertIn("recommended_certifications", advice)

    def test_upload_endpoint_validation(self):
        # Check that txt file upload returns HTTP 400
        response = self.client.post("/upload", files={"resume": ("resume.txt", b"txt content", "text/plain")})
        self.assertEqual(response.status_code, 400)

    def test_career_advice_endpoint(self):
        # Store a test resume first
        store_resume("user_resume", "Sample resume text.", self.sample_metadata)
        
        # Test POST /career-advice
        response = self.client.post("/career-advice", json={"query": "How can I become a Threat Hunter?"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("current_role", data)
        self.assertIn("next_role", data)

    def test_search_endpoint(self):
        # Test POST /search
        response = self.client.post("/search", json={"query": "Security Analyst"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 20)

if __name__ == "__main__":
    unittest.main()
