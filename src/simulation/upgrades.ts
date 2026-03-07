import {
  BASE_UPGRADE_STATS,
  DRILL_RESISTANCE,
  UPGRADE_STAT_INCREMENTS,
  UPGRADE_TUNING,
  type DrillMaterialId,
  type UpgradeId,
} from '../content/tuning'

export type UpgradeLevels = Record<UpgradeId, number>

export type UpgradeDefinition = {
  id: UpgradeId
  label: string
  baseCost: number
  costMultiplier: number
  maxLevel: number
}

export type UpgradeStats = {
  thrust: number
  lift: number
  maxSpeed: number
  maxFuel: number
  maxHull: number
  cargoCapacity: number
  drillSpeedMultiplier: number
}

const UPGRADE_BY_ID = new Map(UPGRADE_TUNING.map((upgrade) => [upgrade.id, upgrade]))

export function createUpgradeLevels(overrides: Partial<UpgradeLevels> = {}): UpgradeLevels {
  return {
    engine: overrides.engine ?? 0,
    fuel: overrides.fuel ?? 0,
    cargo: overrides.cargo ?? 0,
    drill: overrides.drill ?? 0,
  }
}

export function getUpgradeDefinition(id: UpgradeId): UpgradeDefinition {
  const definition = UPGRADE_BY_ID.get(id)
  if (!definition) {
    throw new Error(`Unknown upgrade id: ${id}`)
  }

  return definition
}

export function getUpgradeCost(id: UpgradeId, currentLevel: number): number {
  const definition = getUpgradeDefinition(id)
  return Math.round(definition.baseCost * definition.costMultiplier ** currentLevel)
}

export function canPurchaseUpgrade(levels: UpgradeLevels, id: UpgradeId): boolean {
  return levels[id] < getUpgradeDefinition(id).maxLevel
}

export function applyUpgrade(levels: UpgradeLevels, id: UpgradeId): UpgradeLevels {
  if (!canPurchaseUpgrade(levels, id)) {
    throw new Error(`Upgrade ${id} is already at max level`)
  }

  return {
    ...levels,
    [id]: levels[id] + 1,
  }
}

export function getUpgradeStats(levels: UpgradeLevels): UpgradeStats {
  return {
    thrust: BASE_UPGRADE_STATS.thrust + levels.engine * UPGRADE_STAT_INCREMENTS.engine.thrust,
    lift: BASE_UPGRADE_STATS.lift + levels.engine * UPGRADE_STAT_INCREMENTS.engine.lift,
    maxSpeed: BASE_UPGRADE_STATS.maxSpeed + levels.engine * UPGRADE_STAT_INCREMENTS.engine.maxSpeed,
    maxFuel: BASE_UPGRADE_STATS.maxFuel + levels.fuel * UPGRADE_STAT_INCREMENTS.fuel.maxFuel,
    maxHull: BASE_UPGRADE_STATS.maxHull,
    cargoCapacity: BASE_UPGRADE_STATS.cargoCapacity + levels.cargo * UPGRADE_STAT_INCREMENTS.cargo.cargoCapacity,
    drillSpeedMultiplier:
      BASE_UPGRADE_STATS.drillSpeedMultiplier +
      levels.drill * UPGRADE_STAT_INCREMENTS.drill.drillSpeedMultiplier,
  }
}

export function getDrillDuration(material: DrillMaterialId, levels: UpgradeLevels): number {
  return DRILL_RESISTANCE[material] / getUpgradeStats(levels).drillSpeedMultiplier
}
