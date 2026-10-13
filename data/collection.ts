export const colonyStatuses = [
  "planning",
  "establishing",
  "stable",
  "thriving",
  "declining",
  "no-longer-kept",
] as const;

export type ColonyStatus = typeof colonyStatuses[number];

export const colonyStatusLabels: Record<ColonyStatus, string> = {
  planning: "Planning",
  establishing: "Establishing",
  stable: "Stable",
  thriving: "Thriving",
  declining: "Declining",
  "no-longer-kept": "No longer kept",
};

export function isColonyStatus(value: string): value is ColonyStatus {
  return colonyStatuses.includes(value as ColonyStatus);
}
