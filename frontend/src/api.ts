import type { AnalysisResponse, HealthResponse, HistoryEntry } from './types'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '')
const USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? 'local-demo-user'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'x-user-id': USER_ID,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let detail = response.statusText

    try {
      const body = (await response.json()) as { detail?: string }
      detail = body.detail ?? detail
    } catch {
      detail = response.statusText
    }

    throw new Error(detail || 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/v1/health')
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>('/api/v1/history')
}

export async function analyzeResume(file: File, jobDescription: string): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('resume', file)
  formData.append('job_description', jobDescription)

  return request<AnalysisResponse>('/api/v1/analyze-resume', {
    method: 'POST',
    body: formData,
  })
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await request<void>(`/api/v1/history/${id}`, {
    method: 'DELETE',
  })
}

export async function generatePdf(analysis: AnalysisResponse): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': USER_ID,
    },
    body: JSON.stringify(analysis),
  })

  if (!response.ok) {
    throw new Error('Unable to generate PDF report')
  }

  return response.blob()
}

export async function generateHistoryPdf(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/${id}/pdf`, {
    headers: {
      'x-user-id': USER_ID,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to generate saved PDF report')
  }

  return response.blob()
}