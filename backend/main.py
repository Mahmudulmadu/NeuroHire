import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from backend.core.config import (
    API_TITLE,
    APP_DESCRIPTION,
    APP_VERSION,
    ALLOWED_ORIGINS,
    SPACY_MODEL_PRIMARY,
    SPACY_MODEL_SECONDARY,
    SENTENCE_TRANSFORMER_MODEL,

)

#from backend.api.routes import router

logger = logging.getLogger('ats_resume_analyzer')

@asynccontextmanager
async def lifespan(app:FastAPI):
   logger.info("Starting up ATS Resume Analyzer API...")

   logger.info(f"Loading spaCy models: {SPACY_MODEL_PRIMARY} ...")
   import spacy
   try:
      app.state.nlp = spacy.load(SPACY_MODEL_PRIMARY)
      logger.info(f"Successfully loaded spaCy model: {SPACY_MODEL_PRIMARY}")
   except OSError:
        logger.warning(f"Failed to load spaCy model: {SPACY_MODEL_PRIMARY}. Attempting to load secondary model: {SPACY_MODEL_SECONDARY}...")
        app.state.nlp = spacy.load(SPACY_MODEL_SECONDARY)
        logger.info(f"Successfully loaded spaCy model: {SPACY_MODEL_SECONDARY}")

   logger.info(f"Loading sentence transformer model: {SENTENCE_TRANSFORMER_MODEL} ...")
   from sentence_transformers import SentenceTransformer
   app.state.st_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
   logger.info(f"Successfully loaded sentence transformer model: {SENTENCE_TRANSFORMER_MODEL}")
   
   logger.info("ATS Resume Analyzer API startup complete.")

   yield

   logger.info("Shutting down ATS Resume Analyzer API...")

app = FastAPI(
    title=API_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get('/')
async def root():
    return {
        'name':      'ATS Resume Analyzer API',
        'version':   '2.0.0',
        'endpoints': {
            'POST   /api/v1/analyze-resume': 'Analyze a resume',
            'GET    /api/v1/history':        'Get user history',
            'DELETE /api/v1/history/:id':    'Delete a history entry',
            'GET    /api/v1/health':         'Health check',
            'POST   /api/v1/generate-pdf':   'Generate PDF report from data',
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        'backend.main:app',
        host    = '0.0.0.0',
        port    = 8000,
        reload  = True,    # Auto-restart on code changes (dev only)
    )