import { ECONOMY_TUNING, type UpgradeId } from '../content/tuning'
import { getOreDefinition, type OreId } from '../content/ores'
import {
  applyUpgrade,
  createUpgradeLevels,
  getUpgradeCost,
  getUpgradeStats,
  type UpgradeLevels,
} from './upgrades'

export type CargoHold = Partial<Record<OreId, number>>

export type EconomyState = {
  credits: number
  fuel: number
  hull: number
  cargo: CargoHold
  upgrades: UpgradeLevels
}

export type CargoSaleResult = {
  state: EconomyState
  creditsEarned: number
  unitsSold: number
}

export type ServiceResult = {
  state: EconomyState
  unitsRestored: number
  cost: number
}

export type UpgradePurchaseResult = {
  state: EconomyState
  purchasedLevel: number
  cost: number
}

export function createEconomyState(overrides: Partial<EconomyState> = {}): EconomyState {
  const upgrades = createUpgradeLevels(overrides.upgrades)
  const stats = getUpgradeStats(upgrades)

  return {
    credits: overrides.credits ?? ECONOMY_TUNING.startingCredits,
    fuel: clamp(overrides.fuel ?? ECONOMY_TUNING.startingFuel, 0, stats.maxFuel),
    hull: clamp(overrides.hull ?? ECONOMY_TUNING.startingHull, 0, stats.maxHull),
    cargo: { ...overrides.cargo },
    upgrades,
  }
}

export function getCargoUnits(cargo: CargoHold): number {
  return Object.values(cargo).reduce((total, quantity) => total + (quantity ?? 0), 0)
}

export function getCargoSaleValue(cargo: CargoHold): number {
  return Object.entries(cargo).reduce((total, [oreId, quantity]) => {
    if (!quantity) {
      return total
    }

    return total + getOreDefinition(oreId as OreId).sellValue * quantity
  }, 0)
}

export function addCargo(state: EconomyState, oreId: OreId, quantity = 1): EconomyState {
  if (quantity <= 0) {
    return state
  }

  const capacity = getUpgradeStats(state.upgrades).cargoCapacity
  const used = getCargoUnits(state.cargo)
  const accepted = Math.min(quantity, Math.max(0, capacity - used))

  if (accepted === 0) {
    return state
  }

  return {
    ...state,
    cargo: {
      ...state.cargo,
      [oreId]: (state.cargo[oreId] ?? 0) + accepted,
    },
  }
}

export function sellCargo(state: EconomyState): CargoSaleResult {
  const creditsEarned = getCargoSaleValue(state.cargo)
  const unitsSold = getCargoUnits(state.cargo)

  return {
    state: {
      ...state,
      credits: state.credits + creditsEarned,
      cargo: {},
    },
    creditsEarned,
    unitsSold,
  }
}

export function refuelAtBase(state: EconomyState, requestedUnits = Number.POSITIVE_INFINITY): ServiceResult {
  const maxFuel = getUpgradeStats(state.upgrades).maxFuel
  const missingFuel = Math.max(0, maxFuel - state.fuel)
  const desiredUnits = Math.min(missingFuel, requestedUnits)
  const affordableUnits = Math.floor(state.credits / ECONOMY_TUNING.fuelPricePerUnit)
  const unitsRestored = Math.max(0, Math.min(desiredUnits, affordableUnits))
  const cost = unitsRestored * ECONOMY_TUNING.fuelPricePerUnit

  return {
    state: {
      ...state,
      credits: state.credits - cost,
      fuel: state.fuel + unitsRestored,
    },
    unitsRestored,
    cost,
  }
}

export function repairAtBase(state: EconomyState, requestedPoints = Number.POSITIVE_INFINITY): ServiceResult {
  const maxHull = getUpgradeStats(state.upgrades).maxHull
  const missingHull = Math.max(0, maxHull - state.hull)
  const desiredPoints = Math.min(missingHull, requestedPoints)
  const affordablePoints = Math.floor(state.credits / ECONOMY_TUNING.repairPricePerPoint)
  const unitsRestored = Math.max(0, Math.min(desiredPoints, affordablePoints))
  const cost = unitsRestored * ECONOMY_TUNING.repairPricePerPoint

  return {
    state: {
      ...state,
      credits: state.credits - cost,
      hull: state.hull + unitsRestored,
    },
    unitsRestored,
    cost,
  }
}

export function purchaseUpgrade(state: EconomyState, id: UpgradeId): UpgradePurchaseResult {
  const currentLevel = state.upgrades[id]
  const cost = getUpgradeCost(id, currentLevel)

  if (state.credits < cost) {
    throw new Error(`Insufficient credits for ${id} upgrade`)
  }

  const upgrades = applyUpgrade(state.upgrades, id)
  const stats = getUpgradeStats(upgrades)

  return {
    state: {
      ...state,
      credits: state.credits - cost,
      upgrades,
      fuel: Math.min(state.fuel, stats.maxFuel),
      hull: Math.min(state.hull, stats.maxHull),
    },
    purchasedLevel: upgrades[id],
    cost,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
