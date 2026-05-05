# HelloMrPig - Civilizacao Digital 3D

Rede social 3D em terceira pessoa com NPCs autonomos, sociedades emergentes e expansao procedural de cidades digitais neon.

## Estado Atual

- Simulacao de sociedade digital com `core_node`, estruturas e caminhos neon.
- NPCs com papeis sociais (`collector`, `architect`, `guardian`, `researcher`, `connector`, `leader`, `scout`).
- Recursos digitais (`energy`, `data`, `matter`, `signal`, `core`).
- Renderizacao 3D com React Three Fiber + Three.js.

## Stack

- React 18
- TypeScript
- Vite
- Three.js
- @react-three/fiber + @react-three/drei
- Zustand

## Como Rodar

```bash
npm install
npm run dev
```

App local: `http://localhost:3000`

## Scripts

- `npm run dev`: ambiente local
- `npm run typecheck`: validacao de tipos
- `npm run build`: build de producao
- `npm run preview`: preview local do build
- `npm run check`: checagem rapida (tipos)

## Estrutura Principal

- `src/simulation`: logica de simulacao (sociedade, recursos, construcao, jobs)
- `src/components`: visualizacao 3D e UI
- `src/store`: estado global
- `src/world`: definicao de planetas e geracao procedural
- `src/theme`: identidade visual neon/TRON

## O que falta para virar "projeto de verdade"

- Testes automatizados de simulacao (unitarios para planner, jobs e economy loop).
- Persistencia versionada de save (migracoes formais de schema).
- Metricas e telemetria de simulacao (fps, tick time, taxa de crescimento social).
- Balanceamento sistematico (custos, regen, prioridades de construcao por papel).
- Pipeline de release (versao, changelog, deploy preview).
- Observabilidade de erros em runtime.

## Proximo Sprint Recomendado (objetivo)

1. Adicionar testes unitarios para `BuildingPlanner`, `ConstructionSystem`, `NPCJobSystem`.
2. Introduzir camada `saveVersion` e migradores de estado.
3. Criar painel de diagnostico com KPI de sociedade (energia media, expansao, estabilidade, paths ativos).
4. Fechar CI com typecheck + testes.
