import { useRef } from 'react'
import { REGIOES, type Regiao, type Trecho } from '../types'

type SidePanelProps = {
  trechos: Trecho[]
  totalTrechos: number
  totalBandeiras: number
  bandeirasPorRegiao: Record<Regiao, number>
  filteredRegiao: Regiao | null
  selectedTrechoId: string | null
  onToggleRegiao: (regiao: Regiao) => void
  onFocusTrecho: (trecho: Trecho) => void
  onRemove: (id: string) => void
  onExport: () => void
  onImportFile: (file: File) => void
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SidePanel({
  trechos,
  totalTrechos,
  totalBandeiras,
  bandeirasPorRegiao,
  filteredRegiao,
  selectedTrechoId,
  onToggleRegiao,
  onFocusTrecho,
  onRemove,
  onExport,
  onImportFile,
}: SidePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listTitle = filteredRegiao ? `Trechos — ${filteredRegiao}` : 'Trechos'

  return (
    <aside className="side-panel">
      <header className="side-panel__brand">
        <div className="side-panel__logo" aria-hidden="true">
          MB
        </div>
        <div className="side-panel__brand-text">
          <strong>Mapa de Bandeiras</strong>
          <span>Belo Horizonte — MG</span>
        </div>
      </header>

      <div className="side-panel__body">
        <div className="side-panel__totals">
          <div className="metric-widget">
            <div className="metric-widget__label">Bandeiras</div>
            <div className="metric-widget__value">{totalBandeiras}</div>
          </div>
          <div className="metric-widget">
            <div className="metric-widget__label">Trechos</div>
            <div className="metric-widget__value">{totalTrechos}</div>
          </div>
        </div>

        <div className="side-panel__section-label">Por região</div>
        <ul className="region-summary">
          {REGIOES.map((regiao) => {
            const active = filteredRegiao === regiao
            return (
              <li key={regiao}>
                <button
                  type="button"
                  className={`region-summary__item region-summary__item--${regiao.toLowerCase()}${active ? ' is-active' : ''}`}
                  onClick={() => onToggleRegiao(regiao)}
                  aria-pressed={active}
                >
                  <span className="region-summary__name">{regiao}</span>
                  <span className="region-summary__value">
                    {bandeirasPorRegiao[regiao]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="side-panel__section-label">{listTitle}</div>

        {trechos.length === 0 ? (
          <p className="side-panel__empty">
            {filteredRegiao
              ? `Nenhum trecho na região ${filteredRegiao}.`
              : 'Nenhum trecho ainda. Clique em "Novo trecho" e marque início e fim ao longo da rua.'}
          </p>
        ) : (
          <ul className="trecho-list">
            {trechos.map((trecho) => (
              <li
                key={trecho.id}
                className={`trecho-item${selectedTrechoId === trecho.id ? ' is-selected' : ''}`}
              >
                <button
                  type="button"
                  className="trecho-item__main trecho-item__focus"
                  onClick={() => onFocusTrecho(trecho)}
                >
                  <div>
                    <p className="trecho-item__flags">
                      <strong>{trecho.bandeiras}</strong> bandeira
                      {trecho.bandeiras === 1 ? '' : 's'}
                      <span className="trecho-item__regiao"> · {trecho.regiao}</span>
                    </p>
                    <p className="trecho-item__meta">
                      {formatDistance(trecho.distanceMeters)} · {formatDate(trecho.createdAt)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  className="btn btn--danger-outline btn--small"
                  onClick={() => onRemove(trecho.id)}
                  aria-label={`Excluir trecho de ${trecho.bandeiras} bandeiras`}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="side-panel__footer">
        <p className="side-panel__footer-note">Dados salvos neste navegador</p>
        <div className="side-panel__footer-actions">
          <button type="button" className="btn btn--on-dark btn--small" onClick={onExport}>
            Exportar
          </button>
          <button
            type="button"
            className="btn btn--on-dark btn--small"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
        <p className="side-panel__credit">Caio Franco · 2026</p>
      </footer>
    </aside>
  )
}