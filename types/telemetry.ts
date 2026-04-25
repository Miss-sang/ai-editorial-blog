export interface TelemetryTopQuery {
  query: string
  count: number
}

export interface TelemetryRecentAiEvent {
  id: string
  feature: string
  status: string
  model: string
  articleSlug: string | null
  createdAt: string
}

export interface TelemetrySummaryResponse {
  provider: 'database' | 'fallback'
  configured: boolean
  pageVisitsLast7Days: number
  searchesLast7Days: number
  aiRequestsLast7Days: number
  topQueries: TelemetryTopQuery[]
  recentAiEvents: TelemetryRecentAiEvent[]
}
