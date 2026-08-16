import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { REGIOES, type DraftRoute, type Regiao } from '../types'

type FlagModalProps = {
  draft: DraftRoute
  onConfirm: (bandeiras: number, regiao: Regiao) => void
  onCancel: () => void
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function FlagModal({ draft, onConfirm, onCancel }: FlagModalProps) {
  const [value, setValue] = useState('')
  const [regiao, setRegiao] = useState<Regiao | ''>('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const n = Number(value)
    if (!Number.isInteger(n) || n < 0) {
      setError('Informe um número inteiro maior ou igual a zero.')
      return
    }
    if (!regiao) {
      setError('Selecione a região do trecho.')
      return
    }
    onConfirm(n, regiao)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="flag-modal-title">Registrar bandeiras</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal__hint">
              Distância ao longo da via:{' '}
              <strong>{formatDistance(draft.distanceMeters)}</strong>
            </p>

            <label className="field">
              <span>Quantidade de bandeiras</span>
              <input
                ref={inputRef}
                className="form-control"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(null)
                }}
                placeholder="Ex.: 12"
              />
            </label>

            <fieldset className="field field--region">
              <legend>Região</legend>
              <div className="region-options" role="radiogroup" aria-label="Região">
                {REGIOES.map((option) => (
                  <label
                    key={option}
                    className={`region-option${regiao === option ? ' is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="regiao"
                      value={option}
                      checked={regiao === option}
                      onChange={() => {
                        setRegiao(option)
                        setError(null)
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Salvar trecho
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}