import { REGIOES, type Regiao, type Trecho } from './types'

export const STORAGE_KEY = 'mapa-bandeiras:v2'
export const EXPORT_VERSION = 2

export type ExportPayload = {
  version: number
  exportedAt: string
  trechos: Trecho[]
}

export function loadTrechos(): Trecho[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTrecho)
  } catch {
    return []
  }
}

export function saveTrechos(trechos: Trecho[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trechos))
}

export function buildExportPayload(trechos: Trecho[]): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    trechos,
  }
}

export function parseImportPayload(raw: string): Trecho[] {
  const parsed = JSON.parse(raw) as unknown

  if (Array.isArray(parsed)) {
    const trechos = parsed.filter(isTrecho)
    if (trechos.length === 0 && parsed.length > 0) {
      throw new Error('Arquivo sem trechos válidos.')
    }
    return trechos
  }

  if (parsed && typeof parsed === 'object') {
    const payload = parsed as Record<string, unknown>
    if (Array.isArray(payload.trechos)) {
      const trechos = payload.trechos.filter(isTrecho)
      if (trechos.length === 0 && payload.trechos.length > 0) {
        throw new Error('Arquivo sem trechos válidos.')
      }
      return trechos
    }
  }

  throw new Error('Formato de arquivo inválido.')
}

export function isTrecho(value: unknown): value is Trecho {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.createdAt === 'string' &&
    typeof t.bandeiras === 'number' &&
    typeof t.distanceMeters === 'number' &&
    isRegiao(t.regiao) &&
    Array.isArray(t.geometry) &&
    isLatLng(t.start) &&
    isLatLng(t.end)
  )
}

function isRegiao(value: unknown): value is Regiao {
  return typeof value === 'string' && (REGIOES as readonly string[]).includes(value)
}

function isLatLng(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return typeof p.lat === 'number' && typeof p.lng === 'number'
}