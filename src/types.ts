export type LatLng = {
  lat: number
  lng: number
}

export const REGIOES = ['Leste', 'Centro', 'Oeste', 'Norte', 'Sul'] as const

export type Regiao = (typeof REGIOES)[number]

export type Trecho = {
  id: string
  createdAt: string
  start: LatLng
  end: LatLng
  geometry: [number, number][]
  distanceMeters: number
  bandeiras: number
  regiao: Regiao
}

export type DraftRoute = {
  start: LatLng
  end: LatLng
  geometry: [number, number][]
  distanceMeters: number
}

export type DrawStep = 'idle' | 'awaitingStart' | 'awaitingEnd' | 'loading'