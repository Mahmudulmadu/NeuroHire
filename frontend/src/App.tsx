import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { useAuth } from './AuthContext.tsx'
import { AuthPage } from './AuthPage.tsx'
import {
  analyzeResume,
  deleteHistoryEntry,
  fetchHealth,
  fetchHistory,
  generateHistoryPdf,
  generatePdf,
} from './api.ts'
import { BarChart } from './components/BarChart.tsx'
import { ScoreRing } from './components/ScoreRing.tsx'
import { Sparkline } from './components/Sparkline.tsx'
import type {
  AnalysisResponse,
  HealthResponse,
  HistoryEntry,
  ScoreKey,
  SkillValidationItem,
  IssueDetail,
} from './types.ts'

const componentMaxima: Record<ScoreKey, number> = {
  formatting: 20,
  keywords: 25,
  content: 25,
  skill_validation: 15,
  ats_compatibility: 15,
}

const componentLabels: Record<ScoreKey, string> = {
  formatting: 'Formatting',
  keywords: 'Keywords',
  content: 'Content',
  skill_validation: 'Skill Validation',
  ats_compatibility: 'ATS Compat.',
}

function formatDate(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function App() {
  const { user, loading: authLoading, signOut, isConfigured } = useAuth()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('Ready.')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeAnalysis = selectedAnalysis ?? analysis

  const componentChartData = activeAnalysis
    ? (Object.keys(componentMaxima) as ScoreKey[]).map((key) => ({
        label: componentLabels[key],
        value: activeAnalysis.component_scores[key],
        maxValue: componentMaxima[key],
      }))
    : []

  const historyScores = useMemo(() => history.map((e) => e.ats_score), [history])
  const skillValidationPct = activeAnalysis?.skill_validation_details?.validation_pct ?? 0
  const keywordMatch = activeAnalysis?.jd_match_analysis?.match_percentage ?? activeAnalysis?.keyword_match ?? 0
  const semanticMatch = (activeAnalysis?.jd_match_analysis?.semantic_similarity ?? 0) * 100

  useEffect(() => {
    async function load() {
      try {
        const [h, hist] = await Promise.all([fetchHealth(), fetchHistory()])
        setHealth(h)
        setHistory(hist)
        setStatusMessage('Connected.')
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Cannot reach backend')
        setStatusMessage('Disconnected.')
      } finally {
        setIsHistoryLoading(false)
      }
    }
    void load()
  }, [])

  async function reloadHistory() {
    try {
      setHistory(await fetchHistory())
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'History refresh failed')
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resumeFile) {
      setErrorMessage('Select a resume file first.')
      return
    }
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setErrorMessage(null)
    setStatusMessage(`Analyzing ${resumeFile.name}...`)

    // Simulated progress: ramp up to 90% while waiting for the API
    const steps = [8, 18, 30, 45, 58, 68, 78, 85, 90]
    let stepIdx = 0
    const timer = setInterval(() => {
      if (stepIdx < steps.length) {
        setAnalysisProgress(steps[stepIdx])
        stepIdx++
      }
    }, 800)

    try {
      const result = await analyzeResume(resumeFile, jobDescription)
      clearInterval(timer)
      setAnalysisProgress(100)
      setAnalysis(result)
      setSelectedAnalysis(result)
      setStatusMessage('Analysis complete.')
      await reloadHistory()
    } catch (err) {
      clearInterval(timer)
      setAnalysisProgress(0)
      setErrorMessage(err instanceof Error ? err.message : 'Analysis failed')
      setStatusMessage('Error.')
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisProgress(0)
      }, 600)
    }
  }

  async function handlePdfDownload() {
    if (!activeAnalysis) return
    try {
      const blob = await generatePdf(activeAnalysis)
      downloadBlob(blob, 'neurohire-report.pdf')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'PDF failed')
    }
  }

  async function handleHistoryPdf(id: string) {
    try {
      const blob = await generateHistoryPdf(id)
      downloadBlob(blob, `neurohire-${id}.pdf`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'PDF failed')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteHistoryEntry(id)
      if (selectedAnalysis && history.find((e) => e.id === id)?.analysis_result === selectedAnalysis) {
        setSelectedAnalysis(null)
      }
      await reloadHistory()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p></div>
      </div>
    )
  }

  if (isConfigured && !user) {
    return <AuthPage />
  }

  return (
    <div className="app-shell">
      <div className="bg-gradient" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">N</div>
          <span className="header__title">NeuroHire</span>
        </div>
        <div className="header__right">
          <div className="header__status">
            <span className={`header__dot ${health?.status === 'healthy' ? 'header__dot--connected' : ''}`} />
            <span>{health?.status === 'healthy' ? 'Connected' : 'Offline'}</span>
          </div>
          {user && <span className="header__email">{user.email}</span>}
          {user && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => void signOut()}>
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* ── Stats Row ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__value">{Math.round(activeAnalysis?.ats_score ?? 0)}</div>
          <div className="stat-card__label">ATS Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{Math.round(keywordMatch)}%</div>
          <div className="stat-card__label">Keyword Match</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{Math.round(skillValidationPct)}%</div>
          <div className="stat-card__label">Skill Proof</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{history.length}</div>
          <div className="stat-card__label">Analyses</div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <main className="main-grid">
        {/* Left: Form */}
        <section className="panel">
          <div className="panel__header">
            <div className="panel__eyebrow">Analyze</div>
            <h2 className="panel__title">Upload & Evaluate</h2>
          </div>

          <form className="form" onSubmit={handleAnalyze}>
            <div className="field">
              <label className="field__label">Resume</label>
              <input
                className="field__input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
              <span className="field__hint">
                {resumeFile ? resumeFile.name : 'PDF, DOC, or DOCX — up to 5 MB'}
              </span>
            </div>

            <div className="field">
              <label className="field__label">Job Description (optional)</label>
              <textarea
                className="field__textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste a job description for keyword gap analysis..."
              />
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!activeAnalysis}
                onClick={() => void handlePdfDownload()}
              >
                Export PDF
              </button>
            </div>
          </form>

          {isAnalyzing && (
            <div className="progress-pill">
              <div className="progress-pill__bar">
                <div
                  className="progress-pill__fill"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <span className="progress-pill__label">{analysisProgress}%</span>
            </div>
          )}

          <div className="status-bar">
            <div className="status-bar__text">{statusMessage}</div>
            {errorMessage && <div className="status-bar__error">{errorMessage}</div>}
          </div>
        </section>

        {/* Right: History */}
        <section className="panel">
          <div className="panel__header">
            <div className="panel__eyebrow">History</div>
            <h2 className="panel__title">Past Analyses</h2>
          </div>

          <Sparkline points={historyScores} />

          <div className="history-list">
            {isHistoryLoading && <p className="empty-state">Loading...</p>}
            {!isHistoryLoading && history.length === 0 && (
              <p className="empty-state">No saved analyses yet.</p>
            )}
            {history.map((entry) => (
              <article key={entry.id} className="history-item">
                <button
                  type="button"
                  className="history-item__body"
                  onClick={() => setSelectedAnalysis(entry.analysis_result)}
                >
                  <div className="history-item__name">{entry.resume_name || entry.filename}</div>
                  <div className="history-item__date">{formatDate(entry.created_at || entry.date)}</div>
                </button>
                <div className="history-item__actions">
                  <span className="history-item__score">{Math.round(entry.ats_score)}</span>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void handleHistoryPdf(entry.id)}>
                    PDF
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => void handleDelete(entry.id)}>
                    ✕
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Full-width: Results */}
        <section className="panel panel--full">
          <div className="panel__header">
            <div className="panel__eyebrow">Results</div>
            <h2 className="panel__title">
              {activeAnalysis ? 'Performance Breakdown' : 'Awaiting Analysis'}
            </h2>
          </div>

          {!activeAnalysis ? (
            <div className="empty-state">
              Upload a resume and run analysis to see insights here.
            </div>
          ) : (
            <>
              {/* Score Rings */}
              <div className="scores-row">
                <ScoreRing label="ATS Fit" value={activeAnalysis.ats_score} helper="Overall readiness" />
                <ScoreRing label="Keywords" value={keywordMatch} helper="Role alignment" />
                <ScoreRing label="Semantic" value={semanticMatch} helper="Embedding similarity" />
              </div>

              {/* Detail Cards */}
              <div className="results-grid">
                {/* Component Bar Chart */}
                <BarChart title="Component Scores" items={componentChartData} />

                {/* Skill Validation */}
                <div className="results-card">
                  <div className="results-card__eyebrow">Validation</div>
                  <div className="results-card__title">Skill Evidence</div>
                  <div className="validation-headline">
                    <span className="validation-headline__value">{Math.round(skillValidationPct)}%</span>
                    <span className="validation-headline__label">validated</span>
                  </div>
                  <div className="keyword-grid">
                    <div>
                      <div className="keyword-group__title">Validated</div>
                      <div className="chip-cloud">
                        {activeAnalysis.skill_validation_details?.validated.length ? (
                          activeAnalysis.skill_validation_details.validated.map((item: SkillValidationItem) => (
                            <span key={item.skill} className="chip chip--success">{item.skill}</span>
                          ))
                        ) : (
                          <span className="chip chip--success">None yet</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="keyword-group__title">Needs Proof</div>
                      <div className="chip-cloud">
                        {activeAnalysis.skill_validation_details?.unvalidated.length ? (
                          activeAnalysis.skill_validation_details.unvalidated.map((skill: string) => (
                            <span key={skill} className="chip chip--danger">{skill}</span>
                          ))
                        ) : (
                          <span className="chip chip--danger">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyword Intelligence */}
                <div className="results-card">
                  <div className="results-card__eyebrow">Keywords</div>
                  <div className="results-card__title">Matched vs Missing</div>
                  <div className="keyword-grid">
                    <div>
                      <div className="keyword-group__title">Matched</div>
                      <div className="chip-cloud">
                        {activeAnalysis.matched_keywords.length ? (
                          activeAnalysis.matched_keywords.map((kw: string) => (
                            <span key={kw} className="chip chip--success">{kw}</span>
                          ))
                        ) : (
                          <span className="chip chip--success">Paste a JD to compare</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="keyword-group__title">Missing</div>
                      <div className="chip-cloud">
                        {activeAnalysis.missing_keywords.length ? (
                          activeAnalysis.missing_keywords.map((kw: string) => (
                            <span key={kw} className="chip chip--danger">{kw}</span>
                          ))
                        ) : (
                          <span className="chip chip--danger">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="results-card results-card--full">
                  <div className="results-card__eyebrow">Feedback</div>
                  <div className="results-card__title">Priority Fixes</div>

                  {activeAnalysis.issues_summary.length > 0 && (
                    <div className="issue-strip">
                      {activeAnalysis.issues_summary.slice(0, 4).map((issue: string) => (
                        <div key={issue} className="issue-strip__item">{issue}</div>
                      ))}
                    </div>
                  )}

                  <div className="feedback-grid">
                    {activeAnalysis.detailed_feedback.slice(0, 6).map((item: IssueDetail) => (
                      <article key={`${item.issue_title}-${item.where_it_appears}`} className="feedback-card">
                        <div className="feedback-card__severity">{item.severity_level}</div>
                        <div className="feedback-card__title">{item.issue_title}</div>
                        <p className="feedback-card__desc">{item.explanation}</p>
                        <div className="feedback-card__meta">
                          <div className="feedback-card__meta-row">
                            <span className="feedback-card__meta-label">Impact</span>
                            <span className="feedback-card__meta-value">{item.ats_impact}</span>
                          </div>
                          <div className="feedback-card__meta-row">
                            <span className="feedback-card__meta-label">Where</span>
                            <span className="feedback-card__meta-value">{item.where_it_appears}</span>
                          </div>
                          <div className="feedback-card__meta-row">
                            <span className="feedback-card__meta-label">Fix</span>
                            <span className="feedback-card__meta-value">{item.how_to_fix}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
