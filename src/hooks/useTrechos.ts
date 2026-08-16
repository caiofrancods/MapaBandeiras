import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadTrechos, saveTrechos } from '../storage'
import { REGIOES, type DraftRoute, type Regiao, type Trecho } from '../types'

export function useTrechos() {
  const [trechos, setTrechos] = useState<Trecho[]>(() => loadTrechos())

  useEffect(() => {
    saveTrechos(trechos)
  }, [trechos])

  const addTrecho = useCallback(
    (draft: DraftRoute, bandeiras: number, regiao: Regiao) => {
      const trecho: Trecho = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        start: draft.start,
        end: draft.end,
        geometry: draft.geometry,
        distanceMeters: draft.distanceMeters,
        bandeiras,
        regiao,
      }
      setTrechos((prev) => [trecho, ...prev])
    },
    [],
  )

  const removeTrecho = useCallback((id: string) => {
    setTrechos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const replaceTrechos = useCallback((next: Trecho[]) => {
    setTrechos(next)
  }, [])

  const totalBandeiras = useMemo(
    () => trechos.reduce((sum, t) => sum + t.bandeiras, 0),
    [trechos],
  )

  const bandeirasPorRegiao = useMemo(() => {
    const counts = Object.fromEntries(REGIOES.map((r) => [r, 0])) as Record<
      Regiao,
      number
    >
    for (const trecho of trechos) {
      counts[trecho.regiao] += trecho.bandeiras
    }
    return counts
  }, [trechos])

  return {
    trechos,
    addTrecho,
    removeTrecho,
    replaceTrechos,
    totalBandeiras,
    bandeirasPorRegiao,
  }
}