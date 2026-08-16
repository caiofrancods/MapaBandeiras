import { useCallback, useMemo, useState } from 'react'
import { FlagModal } from './components/FlagModal'
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'
import { useTrechos } from './hooks/useTrechos'
import { buildStreetSegment } from './lib/segment'
import { buildExportPayload, parseImportPayload } from './storage'
import type { DraftRoute, DrawStep, LatLng, Regiao, Trecho } from './types'
import 'leaflet/dist/leaflet.css'
import './styles.css'

function stepHint(step: DrawStep): string | null {
  switch (step) {
    case 'awaitingStart':
      return 'Clique no início do trecho, sobre a rua'
    case 'awaitingEnd':
      return 'Clique no fim. Em curvas longas, faça outro trecho'
    case 'loading':
      return 'Ajustando o traço à via…'
    default:
      return null
  }
}

export default function App() {
  const {
    trechos,
    addTrecho,
    removeTrecho,
    replaceTrechos,
    totalBandeiras,
    bandeirasPorRegiao,
  } = useTrechos()
  const [drawStep, setDrawStep] = useState<DrawStep>('idle')
  const [draftStart, setDraftStart] = useState<LatLng | null>(null)
  const [draftRoute, setDraftRoute] = useState<DraftRoute | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filteredRegiao, setFilteredRegiao] = useState<Regiao | null>(null)
  const [focusTrecho, setFocusTrecho] = useState<Trecho | null>(null)

  const visibleTrechos = useMemo(
    () =>
      filteredRegiao
        ? trechos.filter((t) => t.regiao === filteredRegiao)
        : trechos,
    [trechos, filteredRegiao],
  )

  const resetDraft = useCallback(() => {
    setDrawStep('idle')
    setDraftStart(null)
    setDraftRoute(null)
  }, [])

  const startDrawing = useCallback(() => {
    setError(null)
    setDraftRoute(null)
    setDraftStart(null)
    setFocusTrecho(null)
    setDrawStep('awaitingStart')
    setSidebarOpen(false)
  }, [])

  const cancelDrawing = useCallback(() => {
    setError(null)
    resetDraft()
  }, [resetDraft])

  const handleMapClick = useCallback(
    async (point: LatLng) => {
      setError(null)

      if (drawStep === 'awaitingStart') {
        setDraftStart(point)
        setDrawStep('awaitingEnd')
        return
      }

      if (drawStep !== 'awaitingEnd' || !draftStart) return

      setDrawStep('loading')
      try {
        const route = await buildStreetSegment(draftStart, point)
        setDraftRoute(route)
        setDrawStep('idle')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao traçar o trecho.'
        setError(message)
        setDraftStart(null)
        setDraftRoute(null)
        setDrawStep('idle')
      }
    },
    [drawStep, draftStart],
  )

  const handleConfirmFlags = useCallback(
    (bandeiras: number, regiao: Regiao) => {
      if (!draftRoute) return
      addTrecho(draftRoute, bandeiras, regiao)
      resetDraft()
    },
    [addTrecho, draftRoute, resetDraft],
  )

  const handleToggleRegiao = useCallback((regiao: Regiao) => {
    setFilteredRegiao((current) => (current === regiao ? null : regiao))
    setFocusTrecho(null)
  }, [])

  const handleFocusTrecho = useCallback((trecho: Trecho) => {
    setFocusTrecho((current) => {
      if (current?.id === trecho.id) return null
      return { ...trecho }
    })
    setSidebarOpen(false)
  }, [])

  const handleRemove = useCallback(
    (id: string) => {
      removeTrecho(id)
      setFocusTrecho((current) => (current?.id === id ? null : current))
    },
    [removeTrecho],
  )

  const handleExport = useCallback(() => {
    const payload = buildExportPayload(trechos)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = url
    link.download = `mapa-bandeiras-${stamp}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [trechos])

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const imported = parseImportPayload(text)

        if (trechos.length > 0) {
          const ok = window.confirm(
            `Isso substitui os ${trechos.length} trecho(s) atuais por ${imported.length} do arquivo. Continuar?`,
          )
          if (!ok) return
        }

        replaceTrechos(imported)
        setFocusTrecho(null)
        setFilteredRegiao(null)
        setError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Não foi possível importar o arquivo.'
        window.alert(message)
      }
    },
    [replaceTrechos, trechos.length],
  )

  const hint = stepHint(drawStep)
  const drawingActive = drawStep !== 'idle' || !!draftRoute

  return (
    <div className={`app${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <SidePanel
        trechos={visibleTrechos}
        totalTrechos={trechos.length}
        totalBandeiras={totalBandeiras}
        bandeirasPorRegiao={bandeirasPorRegiao}
        filteredRegiao={filteredRegiao}
        selectedTrechoId={focusTrecho?.id ?? null}
        onToggleRegiao={handleToggleRegiao}
        onFocusTrecho={handleFocusTrecho}
        onRemove={handleRemove}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn-menu"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Abrir painel"
            >
              ☰
            </button>
            <div className="page-title">
              <h1>Belo Horizonte</h1>
              <span>Trechos ao longo das vias · curvas longas em partes</span>
            </div>
          </div>

          <div className="topbar-actions">
            {drawingActive ? (
              <button type="button" className="btn btn--outline" onClick={cancelDrawing}>
                Cancelar desenho
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={startDrawing}>
                Novo trecho
              </button>
            )}
          </div>
        </header>

        <main className="map-area">
          <div className="map-toolbar">
            {hint && <span className="map-chip">{hint}</span>}
            {error && <span className="map-chip map-chip--error">{error}</span>}
          </div>

          <MapView
            trechos={visibleTrechos}
            drawStep={drawStep}
            draftStart={draftStart}
            draftRoute={draftRoute}
            focusTrecho={focusTrecho}
            onMapClick={handleMapClick}
          />
        </main>
      </div>

      {draftRoute && (
        <FlagModal
          draft={draftRoute}
          onConfirm={handleConfirmFlags}
          onCancel={cancelDrawing}
        />
      )}
    </div>
  )
}