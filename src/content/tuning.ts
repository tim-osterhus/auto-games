export type OreTuningId = 'copper' | 'amber' | 'azure' | 'crimsonite'
export type DrillMaterialId = 'dirt' | 'rock'
export type UpgradeId = 'engine' | 'fuel' | 'cargo' | 'drill'

export type OreTuningDefinition = {
  id: OreTuningId
  label: string
  tier: 1 | 2 | 3 | 4
  sellValue: number
  depthMin: number
  depthMax: number
  chance: number
  openingEligible: boolean
}

export type UpgradeTuningDefinition = {
  id: UpgradeId
  label: string
  baseCost: number
  costMultiplier: number
  maxLevel: number
}

export const ORE_TUNING: OreTuningDefinition[] = [
  {
    id: 'copper',
    label: 'Copper',
    tier: 1,
    sellValue: 12,
    depthMin: 8,
    depthMax: 22,
    chance: 0.09,
    openingEligible: true,
  },
  {
    id: 'amber',
    label: 'Amber',
    tier: 2,
    sellValue: 28,
    depthMin: 18,
    depthMax: 34,
    chance: 0.065,
    openingEligible: false,
  },
  {
    id: 'azure',
    label: 'Azure',
    tier: 3,
    sellValue: 55,
    depthMin: 30,
    depthMax: 48,
    chance: 0.05,
    openingEligible: false,
  },
  {
    id: 'crimsonite',
    label: 'Crimsonite',
    tier: 4,
    sellValue: 96,
    depthMin: 44,
    depthMax: 63,
    chance: 0.04,
    openingEligible: false,
  },
]

export const DRILL_RESISTANCE: Record<DrillMaterialId, number> = {
  dirt: 0.35,
  rock: 0.75,
}

export const ECONOMY_TUNING = {
  startingCredits: 0,
  startingFuel: 60,
  startingHull: 100,
  fuelPricePerUnit: 2,
  repairPricePerPoint: 3,
} as const

export const SESSION_TARGET_TUNING = {
  starterCopperTripMinutes: 3.75,
  firstUpgradeTargetMinutes: 8,
  secondUpgradeTargetMinutes: 15,
} as const

export const UPGRADE_TUNING: UpgradeTuningDefinition[] = [
  { id: 'engine', label: 'Engine', baseCost: 110, costMultiplier: 1.6, maxLevel: 5 },
  { id: 'fuel', label: 'Fuel Tank', baseCost: 96, costMultiplier: 1.55, maxLevel: 5 },
  { id: 'cargo', label: 'Cargo Rack', baseCost: 72, costMultiplier: 1.55, maxLevel: 5 },
  { id: 'drill', label: 'Drill Head', baseCost: 88, costMultiplier: 1.6, maxLevel: 5 },
]

export const BASE_UPGRADE_STATS = {
  thrust: 18,
  lift: 22,
  maxSpeed: 7.5,
  maxFuel: 60,
  maxHull: 100,
  cargoCapacity: 6,
  drillSpeedMultiplier: 1,
} as const

export const UPGRADE_STAT_INCREMENTS = {
  engine: {
    thrust: 2.5,
    lift: 2.5,
    maxSpeed: 0.75,
  },
  fuel: {
    maxFuel: 15,
  },
  cargo: {
    cargoCapacity: 2,
  },
  drill: {
    drillSpeedMultiplier: 0.2,
  },
} as const
