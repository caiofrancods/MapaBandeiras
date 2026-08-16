# Mapa de Bandeiras

Aplicação web para marcar trechos de rua com a quantidade de bandeiras políticas instaladas.

## Como usar

1. Instale as dependências e suba o servidor local:

```bash
npm install
npm run dev
```

2. Abra o endereço mostrado no terminal (em geral `http://localhost:5173`).
3. Clique em **Novo trecho**.
4. Clique no **início** e depois no **fim** do trecho no mapa (linha reta; em curvas, faça trechos separados).
5. Informe quantas bandeiras há no trecho, escolha a **região** (Leste, Centro, Oeste, Norte ou Sul) e salve.
6. O painel esquerdo lista os traços, o total geral e o resumo por região. Os dados ficam no `localStorage` do navegador.

## Stack

- Vite + React + TypeScript
- Leaflet + OpenStreetMap (mapa gratuito, foco em Belo Horizonte — MG)
- Trechos em linha reta (sem roteamento de carro)
