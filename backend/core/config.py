import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
    
except ImportError:
    pass

# api metadata
API_TITLE = "ATS Resume Analyzer Api"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "An API for analyzing resumes using ATS (Applicant Tracking System) NLP + ML."

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# file
MAX_FILE_SIZE_MB= 5  # 5 MB
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

#Supported MIME types and their short names
SUPPORTED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
SPACY_MODEL = "en_core_web_md"
SPACY_MODEL_SECONDARY = "en_core_web_sm"
SENTENCE_TRANSFORMER_MODEL = os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")

# score component weights - this is business logic and can be adjusted as needed
SCORE_WEIGHTS = {
    "formatting": 20,
    "keywords": 25,
    "content": 25,
    "skill_validation": 15,
    "ats_compatibility": 15,
}

JD_KEYWORD_WEIGHT=0.6
JD_SEMANTIC_WEIGHT=0.4