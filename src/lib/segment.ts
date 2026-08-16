import type { DraftRoute, LatLng } from '../types'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

type OsrmRoute = {
  distance: number
  geometry: [number, number][]
}

type OsrmResponse = {
  code: string
  routes?: Array<{
    distance: number
    geometry: {
      coordinates: [number, number][]
    }
  }>
}

async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<OsrmRoute | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  // radiuses=50 ajuda a “grudar” o clique na via mais próxima
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&radiuses=50;50`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = (await response.json()) as OsrmResponse
  if (data.code !== 'Ok' || !data.routes?.[0]) return null

  const route = data.routes[0]
  return {
    distance: route.distance,
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  }
}

/**
 * Acompanha a geometria da rua entre A e B, escolhendo o menor caminho
 * entre os dois sentidos (A→B e B→A). Isso evita voltas longas por causa
 * de mão única quando os pontos estão na mesma via.
 */
export async function buildStreetSegment(
  start: LatLng,
  end: LatLng,
): Promise<DraftRoute> {
  const [forward, reverse] = await Promise.all([
    fetchOsrmRoute(start, end),
    fetchOsrmRoute(end, start),
  ])

  if (!forward && !reverse) {
    throw new Error(
      'Não há via contínua entre esses pontos. Aproxime os cliques da rua ou divida o trecho.',
    )
  }

  let best: OsrmRoute
  if (forward && reverse) {
    best =
      forward.distance <= reverse.distance
        ? forward
        : {
            distance: reverse.distance,
            // Inverte para manter a polilinha no sentido do clique (início → fim)
            geometry: [...reverse.geometry].reverse(),
          }
  } else {
    best = (forward ?? reverse)!
    if (!forward && reverse) {
      best = {
        distance: reverse.distance,
        geometry: [...reverse.geometry].reverse(),
      }
    }
  }

  return {
    start,
    end,
    geometry: best.geometry,
    distanceMeters: best.distance,
  }
}