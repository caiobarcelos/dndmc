# DNDMC — Conversor 5E → 3.5E

MVP em Vite + React + Tailwind para reconstruir monstros de D&D 5E em blocos de estatística no formato de D&D 3.5E.

## Recursos atuais

- Formulário editável para dados da criatura.
- Conversão assistida de tipo, tamanho, HD, PV, BAB, Agarrar, CA, saves e ataque principal.
- Prévia visual em estilo pergaminho/bloco de monstro 3.5E.
- Download do bloco em `.txt`.
- Download dos dados em `.json`.
- Download da ficha visual em `.png`.
- Copiar bloco para a área de transferência.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica automaticamente o build da branch `main` no GitHub Pages.

Como o repositório se chama `dndmc`, o Vite usa:

```js
base: '/dndmc/'
```

## Observação

A conversão é uma reconstrução assistida. A 3.5E exige campos que não existem diretamente na 5E, como BAB, Agarrar, perícias por tipo, talentos e progressão de Dados de Vida. O resultado deve ser revisado pelo mestre antes de entrar em mesa.
