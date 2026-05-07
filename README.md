# HelloMrPig - Civilizacao Digital 3D

Rede social 3D em terceira pessoa com NPCs autonomos, sociedades emergentes e expansao procedural de cidades digitais neon.

## FreeCAD Product Engineering

Este workspace tambem inclui a Skill `freecad-product-engineering` para transformar um `technical engineering sketch concept` em um produto 3D mecanico, parametrico e pronto para impressao 3D usando FreeCAD como fonte de verdade.

Nesta fase, nao use Blender. O fluxo prioriza FreeCAD, medidas em milimetros, pecas separadas, arquivo nativo `.FCStd`, STEP, STL individual e relatorios tecnicos.

### Como preparar um conceito

1. Edite `input/concept.md` com o briefing tecnico do produto.
2. Coloque imagens, sketches tecnicos e referencias visuais em `input/sketches/`.
3. Ajuste `specs/product-spec.json` com medidas, modulos e regras de impressao.
4. Se precisar de um novo briefing, use `.agents/skills/freecad-product-engineering/assets/concept.template.md`.
5. Se precisar reiniciar a especificacao, use `.agents/skills/freecad-product-engineering/assets/product-spec.template.json`.

### Como rodar o fluxo com Codex

Peça ao Codex para usar a Skill `freecad-product-engineering` e transformar o conceito em CAD FreeCAD. O fluxo esperado é:

- ler `input/concept.md`;
- ler imagens em `input/sketches/`;
- ler ou criar `specs/product-spec.json`;
- gerar `output/reports/assumptions.md`;
- gerar `output/reports/cad_plan.md`;
- criar modelo parametrico no FreeCAD;
- separar cada peca fisica em objeto proprio;
- validar impressao 3D;
- exportar `.FCStd`, `.step` e `.stl` individual por peca;
- gerar `output/reports/print_report.md`.

### Como verificar o MCP FreeCAD

No Codex, rode `/mcp` e confira se o servidor `freecad` aparece ativo.

A configuracao inicial fica em `.codex/config.toml`:

```toml
[mcp_servers.freecad]
command = "uvx"
args = ["freecad-mcp"]
startup_timeout_sec = 30
tool_timeout_sec = 180
enabled = true
required = false
```

O comando pode precisar de ajuste conforme o MCP FreeCAD instalado localmente.

### Scripts CAD

```bash
python .agents/skills/freecad-product-engineering/scripts/create_project_structure.py
python .agents/skills/freecad-product-engineering/scripts/validate_printability.py
FreeCADCmd .agents/skills/freecad-product-engineering/scripts/generate_freecad_base.py
FreeCADCmd .agents/skills/freecad-product-engineering/scripts/export_freecad_files.py output/cad/kazento_cable_vector.FCStd
```

Use `freecadcmd` no lugar de `FreeCADCmd` se esse for o executavel disponivel no seu sistema.

### Arquivos gerados pelo fluxo FreeCAD

- `output/cad/kazento_cable_vector.FCStd`
- `output/cad/kazento_cable_vector.step`
- `output/cad/{part_name}.step`
- `output/print/{part_name}.stl`
- `output/reports/assumptions.md`
- `output/reports/cad_plan.md`
- `output/reports/print_report.md`

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
