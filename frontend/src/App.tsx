import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  analyzeResume,
  deleteHistoryEntry,
  fetchHealth,
  fetchHistory,
  generateHistoryPdf,
  generatePdf,
  getApiBaseUrl,
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
  ats_compatibility: 'ATS Compatibility',
}

function formatDate(value: string): string {
  if (!value) {
    return 'No timestamp'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('Backend ready for analysis.')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeAnalysis = selectedAnalysis ?? analysis
  const componentChartData = activeAnalysis
    ? (Object.keys(componentMaxima) as ScoreKey[]).map((key) => ({
        label: componentLabels[key],
        value: activeAnalysis.component_scores[key],
        maxValue: componentMaxima[key],
      }))
    : []

  const historyScores = useMemo(() => history.map((entry) => entry.ats_score), [history])
  const skillValidationPct = activeAnalysis?.skill_validation_details?.validation_pct ?? 0
  const keywordMatch = activeAnalysis?.jd_match_analysis?.match_percentage ?? activeAnalysis?.keyword_match ?? 0
  const semanticMatch = (activeAnalysis?.jd_match_analysis?.semantic_similarity ?? 0) * 100

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [healthData, historyData] = await Promise.all([fetchHealth(), fetchHistory()])
        setHealth(healthData)
        setHistory(historyData)
        setStatusMessage('Connected to the NeuroHire analysis API.')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to reach backend'
        setErrorMessage(message)
        setStatusMessage('Waiting for backend connection.')
      } finally {
        setIsHistoryLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  async function reloadHistory() {
    try {
      const entries = await fetchHistory()
      setHistory(entries)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh history'
      setErrorMessage(message)
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resumeFile) {
      setErrorMessage('Select a resume file before running the analysis.')
      return
    }

    setIsAnalyzing(true)
    setErrorMessage(null)
    setStatusMessage(`Analyzing ${resumeFile.name}...`)

    try {
      const result = await analyzeResume(resumeFile, jobDescription)
      setAnalysis(result)
      setSelectedAnalysis(result)
      setStatusMessage('Analysis completed. Visuals and recommendations are updated.')
      await reloadHistory()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed'
      setErrorMessage(message)
      setStatusMessage('Analysis failed. Review the backend configuration and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleCurrentPdfDownload() {
    if (!activeAnalysis) {
      return
    }

    try {
      const blob = await generatePdf(activeAnalysis)
      downloadBlob(blob, 'neurohire-analysis-report.pdf')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF generation failed'
      setErrorMessage(message)
    }
  }

  async function handleHistoryPdfDownload(id: string) {
    try {
      const blob = await generateHistoryPdf(id)
      downloadBlob(blob, `neurohire-history-${id}.pdf`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Saved PDF generation failed'
      setErrorMessage(message)
    }
  }

  async function handleDeleteHistory(id: string) {
    try {
      await deleteHistoryEntry(id)
      if (selectedAnalysis && history.find((entry) => entry.id === id)?.analysis_result === selectedAnalysis) {
        setSelectedAnalysis(null)
      }
      await reloadHistory()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed'
      setErrorMessage(message)
    }
  }

  return (
    <div className="app-shell">
      <div className="background-orb background-orb--left" />
      <div className="background-orb background-orb--right" />

      <header className="hero-panel">
        <div className="hero-panel__copy">
          <span className="eyebrow">NeuroHire command center</span>
          <h1>Professional resume intelligence with a live ATS dashboard.</h1>
          <p>
            Upload a resume, compare it against a role, and review the result through score visuals,
            keyword gaps, and recruiter-ready feedback.
          </p>
          <div className="hero-panel__status-row">
            <div className={`status-pill ${health?.status === 'healthy' ? 'status-pill--good' : ''}`}>
              <span className="status-pill__dot" />
              {health?.status === 'healthy' ? 'Backend connected' : 'Backend pending'}
            </div>
            <div className="subtle-metadata">API: {getApiBaseUrl()}</div>
          </div>
        </div>

        <div className="hero-stats">
          <article>
            <strong>{Math.round(activeAnalysis?.ats_score ?? 0)}</strong>
            <span>ATS score</span>
          </article>
          <article>
            <strong>{Math.round(keywordMatch)}%</strong>
            <span>Keyword match</span>
          </article>
          <article>
            <strong>{Math.round(skillValidationPct)}%</strong>
            <span>Skill proof rate</span>
          </article>
          <article>
            <strong>{history.length}</strong>
            <span>Saved analyses</span>
          </article>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="panel panel--form">
          <div className="section-heading">
            <span>Analysis intake</span>
            <h2>Run a new evaluation</h2>
          </div>

          <form className="analyzer-form" onSubmit={handleAnalyze}>
            <label className="field-group field-group--file">
              <span>Resume file</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
              <small>{resumeFile ? resumeFile.name : 'PDF, DOC, or DOCX up to 5 MB'}</small>
            </label>

            <label className="field-group">
              <span>Job description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={10}
                placeholder="Paste the target role to unlock keyword gap analysis and semantic matching."
              />
            </label>

            <div className="action-row">
              <button type="submit" className="button button--primary" disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze resume'}
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={!activeAnalysis}
                onClick={() => void handleCurrentPdfDownload()}
              >
                Export current PDF
              </button>
            </div>
          </form>

          <div className="inline-status">
            <strong>{statusMessage}</strong>
            {errorMessage ? <p>{errorMessage}</p> : <p>Upload a document to populate the dashboard.</p>}
          </div>
        </section>

        <section className="panel panel--history">
          <div className="section-heading">
            <span>Saved results</span>
            <h2>History and score trend</h2>
          </div>

          <Sparkline points={historyScores} />

          <div className="history-list">
            {isHistoryLoading ? <p className="empty-state">Loading history...</p> : null}
            {!isHistoryLoading && history.length === 0 ? (
              <p className="empty-state">Saved analyses will appear here when Supabase history is configured.</p>
            ) : null}
            {history.map((entry) => (
              <article key={entry.id} className="history-item">
                <button
                  type="button"
                  className="history-item__body"
                  onClick={() => setSelectedAnalysis(entry.analysis_result)}
                >
                  <strong>{entry.resume_name || entry.filename}</strong>
                  <span>{formatDate(entry.created_at || entry.date)}</span>
                </button>
                <div className="history-item__meta">
                  <span>{Math.round(entry.ats_score)} ATS</span>
                  <button type="button" onClick={() => void handleHistoryPdfDownload(entry.id)}>
                    PDF
                  </button>
                  <button type="button" onClick={() => void handleDeleteHistory(entry.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--results panel--wide">
          <div className="section-heading">
            <span>Insight board</span>
            <h2>{activeAnalysis ? 'Resume performance breakdown' : 'Awaiting first analysis'}</h2>
          </div>

          {!activeAnalysis ? (
            <div className="empty-panel">
              <p>Run an analysis to unlock score visuals, keyword intelligence, and actionable fixes.</p>
            </div>
          ) : (
            <>
              <div className="results-overview">
                <ScoreRing
                  label="ATS Fit"
                  value={activeAnalysis.ats_score}
                  helper={activeAnalysis.interpretation || 'Overall resume readiness score.'}
                />
                <ScoreRing
                  label="Keyword Match"
                  value={keywordMatch}
                  helper="How closely the resume aligns with target role language."
                />
                <ScoreRing
                  label="Semantic Match"
                  value={semanticMatch}
                  helper="Embedding similarity between the resume and the job brief."
                />
              </div>

              <div className="results-grid">
                <BarChart title="Weighted component scoring" items={componentChartData} />

                <div className="chart-card">
                  <div className="section-heading">
                    <span>Validation</span>
                    <h3>Skill evidence coverage</h3>
                  </div>
                  <div className="validation-card">
                    <div className="validation-card__headline">
                      <strong>{Math.round(skillValidationPct)}%</strong>
                      <span>validated against projects or experience</span>
                    </div>
                    <div className="keyword-columns">
                      <div>
                        <h4>Validated</h4>
                        <div className="chip-cloud chip-cloud--positive">
                          {activeAnalysis.skill_validation_details?.validated.length ? (
                            activeAnalysis.skill_validation_details.validated.map((item: SkillValidationItem) => (
                              <span key={item.skill}>{item.skill}</span>
                            ))
                          ) : (
                            <span>No validated skills yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4>Needs proof</h4>
                        <div className="chip-cloud chip-cloud--negative">
                          {activeAnalysis.skill_validation_details?.unvalidated.length ? (
                            activeAnalysis.skill_validation_details.unvalidated.map((skill: string) => (
                              <span key={skill}>{skill}</span>
                            ))
                          ) : (
                            <span>No missing proof</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="section-heading">
                    <span>Keyword intelligence</span>
                    <h3>Matched versus missing terms</h3>
                  </div>
                  <div className="keyword-columns">
                    <div>
                      <h4>Matched</h4>
                      <div className="chip-cloud chip-cloud--positive">
                        {activeAnalysis.matched_keywords.length ? (
                          activeAnalysis.matched_keywords.map((keyword: string) => <span key={keyword}>{keyword}</span>)
                        ) : (
                          <span>Add a job description to compare keywords</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4>Missing</h4>
                      <div className="chip-cloud chip-cloud--negative">
                        {activeAnalysis.missing_keywords.length ? (
                          activeAnalysis.missing_keywords.map((keyword: string) => <span key={keyword}>{keyword}</span>)
                        ) : (
                          <span>No missing keywords detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-card chart-card--span-2">
                  <div className="section-heading">
                    <span>Actionable feedback</span>
                    <h3>Priority fixes and recruiter-facing guidance</h3>
                  </div>

                  <div className="summary-strip">
                    {activeAnalysis.issues_summary.slice(0, 4).map((issue: string) => (
                      <div key={issue} className="summary-strip__item">
                        {issue}
                      </div>
                    ))}
                  </div>

                  <div className="feedback-list">
                    {activeAnalysis.detailed_feedback.slice(0, 6).map((item: IssueDetail) => (
                      <article key={`${item.issue_title}-${item.where_it_appears}`} className="feedback-card">
                        <div className="feedback-card__header">
                          <span>{item.severity_level}</span>
                          <strong>{item.issue_title}</strong>
                        </div>
                        <p>{item.explanation}</p>
                        <dl>
                          <div>
                            <dt>Impact</dt>
                            <dd>{item.ats_impact}</dd>
                          </div>
                          <div>
                            <dt>Where</dt>
                            <dd>{item.where_it_appears}</dd>
                          </div>
                          <div>
                            <dt>Fix</dt>
                            <dd>{item.how_to_fix}</dd>
                          </div>
                        </dl>
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