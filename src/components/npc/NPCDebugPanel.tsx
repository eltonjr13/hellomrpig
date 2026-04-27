import { memo } from "react";
import { useNPCStore } from "../../store/useNPCStore";
import styles from "./NPCDebugPanel.module.css";

export const NPCDebugPanel = memo(function NPCDebugPanel() {
  const npcs = useNPCStore((state) => state.npcs);
  const selectedNpcId = useNPCStore((state) => state.selectedNpcId);
  const selectNPC = useNPCStore((state) => state.selectNPC);
  const npc = npcs.find((candidate) => candidate.id === selectedNpcId) ?? npcs[0];

  if (!npc) return null;

  return (
    <section className={styles.panel} aria-label="NPC debug">
      <header className={styles.header}>
        <strong>{npc.name}</strong>
        <select value={npc.id} onChange={(event) => selectNPC(event.target.value)}>
          {npcs.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </header>

      <div className={styles.row}>
        <span>Humor</span>
        <strong>
          {npc.mood.current} {Math.round(npc.mood.intensity * 100)}%
        </strong>
      </div>
      <div className={styles.row}>
        <span>Acao</span>
        <strong>{npc.currentAction}</strong>
      </div>
      <div className={styles.row}>
        <span>Funcao</span>
        <strong>{npc.societyRole?.type ?? "wanderer"}</strong>
      </div>

      <div className={styles.grid}>
        {Object.entries(npc.needs).map(([key, value]) => (
          <Meter key={key} label={key} value={value} />
        ))}
      </div>

      {npc.inventory ? (
        <div className={styles.block}>
          <span>Inventario</span>
          <small>
            {Object.entries(npc.inventory.items)
              .map(([key, value]) => `${key} ${Math.floor(value)}`)
              .join(" - ")}
          </small>
        </div>
      ) : null}

      <div className={styles.block}>
        <span>Objetivo</span>
        <strong>
          {npc.goals[0]?.type ?? "none"} - {npc.goals[0]?.priority ?? 0}
        </strong>
      </div>

      <div className={styles.block}>
        <span>Memorias</span>
        {npc.memory.slice(0, 3).map((memory) => (
          <small key={`${memory.timestamp}-${memory.description}`}>
            {memory.type}: {memory.description}
          </small>
        ))}
      </div>

      <div className={styles.grid}>
        {Object.entries(npc.learning.behaviorWeights).map(([key, value]) => (
          <Meter key={key} label={key} value={value * 40} />
        ))}
      </div>
    </section>
  );
});

function Meter({ label, value }: { label: string; value: number }) {
  const width = Math.max(4, Math.min(100, value));

  return (
    <div className={styles.meter}>
      <span>{label}</span>
      <div>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
