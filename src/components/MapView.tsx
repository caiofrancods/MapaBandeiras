import { useEffect, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import type { DraftRoute, DrawStep, LatLng, Regiao, Trecho } from '../types'

/** Centro de Belo Horizonte — MG */
const BELO_HORIZONTE: LatLng = { lat: -19.9167, lng: -43.9345 }

export const REGIAO_COLORS: Record<Regiao, string> = {
  Leste: '#C4704F',
  Centro: '#0F766E',
  Oeste: '#3B6FA0',
  Norte: '#C25A00',
  Sul: '#9B6BB0',
}

const pinIcon = L.divIcon({
  className: 'map-pin-wrap',
  html: '<span class="map-pin" aria-hidden="true"></span>',
  iconSize: [22, 28],
  iconAnchor: [11, 26],
})

type MapViewProps = {
  trechos: Trecho[]
  drawStep: DrawStep
  draftStart: LatLng | null
  draftRoute: DraftRoute | null
  focusTrecho: Trecho | null
  onMapClick: (point: LatLng) => void
}

function MapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean
  onMapClick: (point: LatLng) => void
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(id)
  }, [map])
  return null
}

function FocusTrecho({ trecho }: { trecho: Trecho | null }) {
  const map = useMap()
  const previousIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (trecho && trecho.geometry.length > 0) {
      const bounds = L.latLngBounds(trecho.geometry.map(([lat, lng]) => [lat, lng]))
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17, animate: true })
      previousIdRef.current = trecho.id
      return
    }

    // Saiu do foco de um trecho → volta a BH
    if (previousIdRef.current) {
      map.setView([BELO_HORIZONTE.lat, BELO_HORIZONTE.lng], 13, { animate: true })
      previousIdRef.current = null
    }
  }, [map, trecho])

  return null
}

export function MapView({
  trechos,
  drawStep,
  draftStart,
  draftRoute,
  focusTrecho,
  onMapClick,
}: MapViewProps) {
  const drawing =
    drawStep === 'awaitingStart' ||
    drawStep === 'awaitingEnd' ||
    drawStep === 'loading'

  return (
    <MapContainer
      center={[BELO_HORIZONTE.lat, BELO_HORIZONTE.lng]}
      zoom={13}
      className={`map-container${drawing ? ' map-container--drawing' : ''}`}
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InvalidateSize />
      <FocusTrecho trecho={focusTrecho} />
      <MapClickHandler
        enabled={drawStep === 'awaitingStart' || drawStep === 'awaitingEnd'}
        onMapClick={onMapClick}
      />

      {trechos.map((trecho) => (
        <Polyline
          key={trecho.id}
          positions={trecho.geometry}
          pathOptions={{
            color: REGIAO_COLORS[trecho.regiao],
            weight: focusTrecho?.id === trecho.id ? 7 : 5,
            opacity: focusTrecho && focusTrecho.id !== trecho.id ? 0.35 : 0.9,
          }}
        />
      ))}

      {draftRoute && (
        <Polyline
          positions={draftRoute.geometry}
          pathOptions={{
            color: '#0B3D3A',
            weight: 5,
            opacity: 0.75,
            dashArray: '8 8',
          }}
        />
      )}

      {draftStart && (
        <Marker position={[draftStart.lat, draftStart.lng]} icon={pinIcon} />
      )}
      {draftRoute && (
        <Marker position={[draftRoute.end.lat, draftRoute.end.lng]} icon={pinIcon} />
      )}
    </MapContainer>
  )
}