## NeuroHire

NeuroHire is a resume analysis application that combines a FastAPI backend, a React + TypeScript frontend, a fine-tuned sentence-transformer model, and Groq-powered structured parsing to evaluate resumes against ATS-style criteria.

The application supports:

- Resume upload for PDF, DOCX, and legacy DOC detection
- ATS scoring across formatting, keywords, content, skill validation, and compatibility
- Job description matching with semantic similarity and keyword gap analysis
- Skill validation using project and experience evidence
- PDF export for generated reports
- History retrieval and deletion through Supabase-backed storage

## Tech Stack

- Backend: FastAPI, spaCy, Sentence Transformers, Groq, httpx
- Frontend: React, TypeScript, Vite
- NLP model: local fine-tuned model in `backend/ML_Model_fine_tune_BERT`
- Persistence: Supabase REST API

## Project Structure

```text
NeuroHire/
	backend/
		api/                 FastAPI routes and auth dependency
		core/                App configuration
		database/            Supabase integration
		models/              Pydantic schemas
		services/            Resume parsing, scoring, JD matching, reports
		utils/               Shared helpers and logging
		ML_Model_fine_tune_BERT/
	frontend/
		src/                 React application
		public/              Static assets
```

## Requirements

- Python 3.11+
- Node.js 20+
- npm 10+

## Environment Variables

Create `backend/.env` with the values required by your environment.

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_or_api_key
SENTENCE_TRANSFORMER_MODEL=
```

Notes:

- `SENTENCE_TRANSFORMER_MODEL` is optional.
- If it is not set, the backend will use the local fine-tuned model in `backend/ML_Model_fine_tune_BERT` when that folder exists.
- If the fine-tuned model folder is not present, it falls back to `all-MiniLM-L6-v2`.

## Backend Setup

From the project root:

```powershell
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m spacy download en_core_web_md
uvicorn backend.main:app --reload
```

Backend default URL:

```text
http://127.0.0.1:8000
```

Useful endpoints:

- `GET /api/v1/health`
- `POST /api/v1/analyze-resume`
- `GET /api/v1/history`
- `DELETE /api/v1/history/{analysis_id}`
- `POST /api/v1/generate-pdf`

## Frontend Setup

From the project root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

If you want to override the backend base URL, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## How the Analysis Flow Works

1. The frontend uploads a resume and optional job description.
2. The backend validates the file and extracts text from PDF or DOCX input.
3. Groq parses the resume and job description into structured JSON.
4. The fine-tuned sentence-transformer model computes semantic similarity and supports skill validation.
5. The scoring engine produces ATS component scores and feedback.
6. Results can be saved to history and exported as PDF.

## Current Model Usage

NeuroHire uses the fine-tuned local model in `backend/ML_Model_fine_tune_BERT` by default for:

- Semantic similarity between resume and job description
- Skill-to-project and skill-to-experience validation

This model is loaded during FastAPI startup and stored on `app.state.embedder`.

## Build Commands

Frontend production build:

```powershell
Set-Location frontend
npm run build
```

## Troubleshooting

### Frontend shows `Failed to fetch`

- Make sure the backend is running on port `8000`.
- Make sure the frontend is using the correct `VITE_API_BASE_URL`.
- Local CORS is configured for `localhost` and `127.0.0.1` on any dev port.

### Resume parsing fails on Windows with `libmagic`

- The backend now falls back to file signature and extension-based detection.
- You do not need to install native `libmagic` for local Windows development.

### History endpoint fails

- Check `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env`.
- If they are missing, history calls return empty results instead of saved data.

## Development Notes

- Backend logs are written under `backend/logs/`.
- The frontend is designed as a single-page professional dashboard.
- The repository includes a local fine-tuned model directory, so clone size may be larger than a typical web app.
