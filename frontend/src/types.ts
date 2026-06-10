export type ScoreKey =
  | 'formatting'
  | 'keywords'
  | 'content'
  | 'skill_validation'
  | 'ats_compatibility'

export interface ComponentScores {
  formatting: number
  keywords: number
  content: number
  skill_validation: number
  ats_compatibility: number
}

export interface JDComparison {
  match_percentage: number
  semantic_similarity: number
  matched_keywords: string[]
  missing_keywords: string[]
  skills_gap: string[]
}

export interface SkillValidationItem {
  skill: string
  projects: string[]
}

export interface SkillValidationDetails {
  validated: SkillValidationItem[]
  unvalidated: string[]
  total: number
  validated_count: number
  validation_pct: number
}

export interface IssueDetail {
  issue_title: string
  severity_level: string
  ats_impact: string
  explanation: string
  where_it_appears: string
  how_to_fix: string
  action_items: string[]
  example_improvement: string
}

export interface AnalysisResponse {
  ATS_score: number
  ats_score: number
  component_scores: ComponentScores
  issues_summary: string[]
  detailed_feedback: IssueDetail[]
  jd_match_analysis?: JDComparison | null
  skill_validation_details?: SkillValidationDetails | null
  keyword_match: number
  missing_keywords: string[]
  matched_keywords: string[]
  suggestions: string[]
  strengths: string[]
  critical_issues: string[]
  skills: string[]
  jd_comparison?: JDComparison | null
  warnings: string[]
  interpretation: string
}

export interface HistoryEntry {
  id: string
  filename: string
  resume_name: string
  job_title: string
  ats_score: number
  keyword_match: number
  missing_keywords: string[]
  date: string
  created_at: string
  analysis_result: AnalysisResponse
}

export interface HealthResponse {
  status: string
  nlp_loaded: boolean
  embedder_loaded: boolean
}