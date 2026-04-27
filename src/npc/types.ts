export type NPCMoodName = "happy" | "neutral" | "angry" | "sad" | "afraid" | "excited";
export type NPCMemoryType = "player_interaction" | "location_event" | "npc_interaction" | "danger" | "reward";
export type NPCGoalType = "explore" | "socialize" | "rest" | "avoid" | "protect" | "follow" | "build";
export type NPCGoalStatus = "active" | "completed" | "failed";
export type NPCSocietyRole = "wanderer" | "collector" | "architect" | "guardian" | "researcher" | "connector" | "leader" | "scout";
export type NPCAction =
  | "wander"
  | "go_to_safe_place"
  | "approach_player"
  | "avoid_player"
  | "talk_to_npc"
  | "rest"
  | "explore_area"
  | "follow_player"
  | "return_home"
  | "protect";

export type NPCPosition = {
  x: number;
  y: number;
  z: number;
};

export type NPCPersonality = {
  openness: number;
  aggression: number;
  curiosity: number;
  social: number;
  fear: number;
  loyalty: number;
};

export type NPCNeeds = {
  energy: number;
  hunger: number;
  social: number;
  safety: number;
  purpose: number;
};

export type NPCMood = {
  current: NPCMoodName;
  intensity: number;
};

export type NPCMemoryRecord = {
  type: NPCMemoryType;
  targetId: string;
  description: string;
  impact: number;
  timestamp: number;
};

export type NPCRelationship = {
  targetId: string;
  targetType: "player" | "npc";
  trust: number;
  fear: number;
  affinity: number;
  lastInteraction: number;
};

export type NPCGoal = {
  id: string;
  type: NPCGoalType;
  priority: number;
  status: NPCGoalStatus;
};

export type NPCBehaviorWeights = {
  explore: number;
  socialize: number;
  rest: number;
  avoid: number;
  follow: number;
};

export type NPCLearning = {
  preferredLocations: string[];
  avoidedLocations: string[];
  trustedPlayers: string[];
  dangerousPlayers: string[];
  behaviorWeights: NPCBehaviorWeights;
  actionHistory: NPCActionHistory[];
};

export type NPCActionHistory = {
  action: NPCAction;
  reward: number;
  timestamp: number;
  stateVector: number[];
};

export type NPCRoutineSlot = {
  hour: number;
  goal: NPCGoalType;
  locationId: string;
};

export type NPC = {
  id: string;
  name: string;
  planetId: string;
  role: "farmer" | "builder" | "merchant" | "wanderer";
  societyId?: string | null;
  societyRole?: {
    type: NPCSocietyRole;
    priority: number;
    assignedBy: "self" | "society" | "leader";
  };
  inventory?: {
    energy: number;
    data: number;
    matter: number;
    signal: number;
    core: number;
  };
  position: NPCPosition;
  targetPosition: NPCPosition;
  homePosition: NPCPosition;
  personality: NPCPersonality;
  needs: NPCNeeds;
  mood: NPCMood;
  memory: NPCMemoryRecord[];
  relationships: NPCRelationship[];
  goals: NPCGoal[];
  learning: NPCLearning;
  routine: NPCRoutineSlot[];
  currentAction: NPCAction;
  lastDecisionAt: number;
};

export type NPCWorldState = {
  planetId: string;
  planetRadius: number;
  now: number;
  delta: number;
  player: {
    id: string;
    position: NPCPosition;
  };
  npcs: NPC[];
};

export type NPCDecision = {
  action: NPCAction;
  targetPosition?: NPCPosition;
  reason: string;
  score: number;
};
