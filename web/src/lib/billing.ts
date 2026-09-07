export const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 79,
} as const;

export type PlanKey = keyof typeof PLAN_PRICES;
