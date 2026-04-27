import { memo } from "react";
import { useNPCStore } from "../../store/useNPCStore";
import { useWorldSimulationStore } from "../../store/useWorldSimulationStore";
import styles from "./SocietyDebugPanel.module.css";

export const SocietyDebugPanel = memo(function SocietyDebugPanel() {
  const societies = useWorldSimulationStore((state) => state.societies);
  const resources = useWorldSimulationStore((state) => state.resources);
  const npcs = useNPCStore((state) => state.npcs);
  const society = societies[0];

  return (
    <section className={styles.panel} aria-label="Digital society debug">
      <header>
        <strong>{society?.name ?? "Sem sociedade digital"}</strong>
        <span>{resources.length} energy nodes</span>
      </header>
      {society ? (
        <>
          <div className={styles.row}>
            <span>Lider</span>
            <strong>{npcs.find((npc) => npc.id === society.leaderId)?.name ?? "nenhum"}</strong>
          </div>
          <div className={styles.row}>
            <span>Membros</span>
            <strong>{society.members.length}</strong>
          </div>
          <div className={styles.row}>
            <span>Tech</span>
            <strong>{society.techLevel}</strong>
          </div>
          <div className={styles.grid}>
            {Object.entries(society.culture).map(([key, value]) => (
              <span key={key}>{key}: {Math.round(value)}</span>
            ))}
          </div>
          <div className={styles.roles}>
            {npcs.slice(0, 6).map((npc) => (
              <small key={npc.id}>{npc.name}: {npc.societyRole?.type ?? "wanderer"}</small>
            ))}
          </div>
        </>
      ) : (
        <small>NPCs proximos vao formar uma matriz digital automaticamente.</small>
      )}
    </section>
  );
});
