import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    ENV_PATH = Path(__file__).resolve().parents[1] / '.env'
    load_dotenv(dotenv_path=ENV_PATH)
    
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
ALLOWED_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"

# file
MAX_FILE_SIZE_MB= 5  # 5 MB
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

#Supported MIME types and their short names
SUPPORTED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
SPACY_MODEL_PRIMARY = "en_core_web_md"
SPACY_MODEL_SECONDARY = "en_core_web_sm"
FINE_TUNED_MODEL_PATH = Path(__file__).resolve().parents[1] / 'ML_Model_fine_tune_BERT'
DEFAULT_SENTENCE_TRANSFORMER_MODEL = (
    str(FINE_TUNED_MODEL_PATH)
    if FINE_TUNED_MODEL_PATH.exists()
    else 'all-MiniLM-L6-v2'
)
SENTENCE_TRANSFORMER_MODEL = os.getenv("SENTENCE_TRANSFORMER_MODEL", DEFAULT_SENTENCE_TRANSFORMER_MODEL)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

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