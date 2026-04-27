import type { Planet, PlanetWorld } from "../PlanetManager";
import { generatePlanetTerrain } from "../procedural/generatePlanetTerrain";
import { getPlanetSurfacePosition } from "../procedural/planetGeometry";

export function createSocialPlanetWorld(planet: Planet): PlanetWorld {
  const prefix = planet.id;
  const generatedTerrain = generatePlanetTerrain(planet, {
    chunkSize: 20,
    chunkRadius: 6,
    objectDensity: 1.7,
    treeColor: "#57cc99",
    rockColor: "#dee2e6",
    fieldColor: "#80ed99",
    pathColor: "#6c757d",
    accentColor: "#8338ec",
  });

  return {
    instanceKey: `${planet.id}:${planet.seed}`,
    planet,
    radius: planet.radius,
    playableRadius: planet.radius * 0.64,
    spawnPoint: getPlanetSurfacePosition(planet.radius, 0, 1.5),
    spawnRotationY: Math.PI,
    environment: {
      skyColor: "#8db7ff",
      groundColor: "#24364f",
      fogColor: "#8aa4cc",
      fogNear: 120,
      fogFar: 420,
      ambientIntensity: 0.72,
      sunIntensity: 2.8,
      starCount: 1200,
    },
    spawnObjects: [
      {
        id: `${prefix}-avenue-main`,
        type: "path",
        position: [0, 0.01, -7],
        color: "#5c677d",
        scale: [5, 0.03, 28],
        collision: false,
      },
      {
        id: `${prefix}-plaza-floor`,
        type: "path",
        position: [0, 0.012, -8],
        color: "#6c757d",
        scale: [24, 0.03, 16],
        collision: false,
      },
      { id: `${prefix}-hub-market`, type: "market", position: [0, 0.85, -13], color: "#ffbe0b", scale: [5.5, 1.7, 3.2] },
      { id: `${prefix}-left-house`, type: "house", position: [-9, 0.9, -7], color: "#3a86ff", scale: [3.1, 1.8, 3], rotationY: 0.15 },
      { id: `${prefix}-right-house`, type: "house", position: [9, 0.9, -7], color: "#ff006e", scale: [3.1, 1.8, 3], rotationY: -0.15 },
      { id: `${prefix}-meeting-well`, type: "well", position: [0, 0.45, -3], color: "#adb5bd", scale: 1.35 },
      { id: `${prefix}-left-storage`, type: "storage", position: [-5.8, 0.7, -15], color: "#8338ec", scale: [2.4, 1.4, 2.4] },
      { id: `${prefix}-right-storage`, type: "storage", position: [5.8, 0.7, -15], color: "#fb5607", scale: [2.4, 1.4, 2.4] },
      { id: `${prefix}-community-field`, type: "field", position: [0, 0.05, 5.5], color: "#80ed99", scale: [11, 0.1, 4], collision: false },
      { id: `${prefix}-shade-tree-1`, type: "tree", position: [-12, 0, 2], color: "#57cc99", scale: 1.1 },
      { id: `${prefix}-shade-tree-2`, type: "tree", position: [12, 0, 2], color: "#57cc99", scale: 1.1 },
      { id: `${prefix}-marker-rock-1`, type: "rock", position: [-3.5, 0.3, -1], color: "#dee2e6", scale: [0.9, 0.55, 0.9] },
      { id: `${prefix}-marker-rock-2`, type: "rock", position: [3.5, 0.3, -1], color: "#dee2e6", scale: [0.9, 0.55, 0.9] },
      ...generatedTerrain,
    ],
    npcs: [
      {
        id: `${prefix}-npc-host`,
        name: "Lia",
        role: "merchant",
        position: [0, 0, -12],
        targetPosition: [3, 0, -12],
        mood: "curious",
        aiProfile: {
          goal: "Receber jogadores e orientar encontros sociais na praca.",
          memory: ["A praca fica mais ativa perto do hub central."],
        },
      },
      {
        id: `${prefix}-npc-builder`,
        name: "Caio",
        role: "builder",
        position: [-7, 0, -6],
        targetPosition: [-2, 0, -3],
        mood: "moving",
        aiProfile: {
          goal: "Organizar espacos compartilhados para os jogadores visiveis.",
          memory: ["Os bancos da praca foram reposicionados para conversa."],
        },
      },
      {
        id: `${prefix}-npc-farmer`,
        name: "Mina",
        role: "farmer",
        position: [4, 0, 5],
        targetPosition: [-4, 0, 5],
        mood: "idle",
        aiProfile: {
          goal: "Cuidar do jardim comunitario usado em eventos sociais.",
          memory: ["Visitantes costumam se reunir perto das arvores."],
        },
      },
      {
        id: `${prefix}-npc-wanderer-1`,
        name: "Theo",
        role: "wanderer",
        position: [8, 0, -3],
        targetPosition: [0, 0, -4],
        mood: "moving",
        aiProfile: {
          goal: "Circular pela praca e reagir a outros jogadores.",
          memory: ["O ponto central facilita encontrar grupos."],
        },
      },
      {
        id: `${prefix}-npc-wanderer-2`,
        name: "Nina",
        role: "wanderer",
        position: [-8, 0, -3],
        targetPosition: [0, 0, -4],
        mood: "moving",
        aiProfile: {
          goal: "Criar movimento visivel para simular jogadores proximos.",
          memory: ["Rotas curtas mantem a praca movimentada."],
        },
      },
    ],
  };
}
