import { describe, expect, it } from 'vitest'
import { ECONOMY_TUNING, SESSION_TARGET_TUNING } from '../src/content/tuning'
import { getOreDefinition } from '../src/content/ores'
import {
  addCargo,
  createEconomyState,
  purchaseUpgrade,
  refuelAtBase,
  repairAtBase,
  sellCargo,
} from '../src/simulation/economy'
import {
  getDrillDuration,
  getUpgradeCost,
  getUpgradeStats,
} from '../src/simulation/upgrades'

function fillStarterCargoWithCopperTrips(trips: number) {
  let state = createEconomyState()

  for (let trip = 0; trip < trips; trip += 1) {
    for (let slot = 0; slot < getUpgradeStats(state.upgrades).cargoCapacity; slot += 1) {
      state = addCargo(state, 'copper')
    }

    state = sellCargo(state).state
  }

  return state
}

function getStarterCopperTripSaleValue() {
  return getUpgradeStats(createEconomyState().upgrades).cargoCapacity * getOreDefinition('copper').sellValue
}

function getStarterMinutesForCredits(targetCredits: number) {
  const tripCount = Math.ceil(targetCredits / getStarterCopperTripSaleValue())

  return {
    tripCount,
    elapsedMinutes: tripCount * SESSION_TARGET_TUNING.starterCopperTripMinutes,
  }
}

describe('economy', () => {
  it('sells cargo and clears the hold at base', () => {
    const stockedState = createEconomyState({
      cargo: {
        copper: 3,
        amber: 1,
      },
    })

    const sale = sellCargo(stockedState)

    expect(sale.creditsEarned).toBe(64)
    expect(sale.unitsSold).toBe(4)
    expect(sale.state.credits).toBe(64)
    expect(sale.state.cargo).toEqual({})
  })

  it('buys as much fuel and hull repair as credits allow', () => {
    const damagedState = createEconomyState({
      credits: 23,
      fuel: 52,
      hull: 94,
    })

    const refuel = refuelAtBase(damagedState)
    expect(refuel.unitsRestored).toBe(8)
    expect(refuel.cost).toBe(8 * ECONOMY_TUNING.fuelPricePerUnit)
    expect(refuel.state.fuel).toBe(60)
    expect(refuel.state.credits).toBe(7)

    const repair = repairAtBase(refuel.state)
    expect(repair.unitsRestored).toBe(2)
    expect(repair.cost).toBe(2 * ECONOMY_TUNING.repairPricePerPoint)
    expect(repair.state.hull).toBe(96)
    expect(repair.state.credits).toBe(1)
  })

  it('applies escalating upgrade costs and stat gains', () => {
    const firstEngineCost = getUpgradeCost('engine', 0)
    const secondEngineCost = getUpgradeCost('engine', 1)
    const upgraded = purchaseUpgrade(
      createEconomyState({
        credits: 400,
      }),
      'engine',
    ).state

    expect(secondEngineCost).toBeGreaterThan(firstEngineCost)
    expect(getUpgradeStats(upgraded.upgrades)).toMatchObject({
      thrust: 20.5,
      lift: 24.5,
      maxSpeed: 8.25,
    })
    expect(getDrillDuration('rock', upgraded.upgrades)).toBe(0.75)
  })

  it('supports one upgrade within 8 minutes of deterministic starter hauling', () => {
    const targetCredits = getUpgradeCost('cargo', 0)
    const { tripCount, elapsedMinutes } = getStarterMinutesForCredits(targetCredits)
    const eightMinuteState = fillStarterCargoWithCopperTrips(tripCount)

    expect(elapsedMinutes).toBeLessThanOrEqual(SESSION_TARGET_TUNING.firstUpgradeTargetMinutes)
    expect(tripCount).toBe(1)
    expect(eightMinuteState.credits).toBe(targetCredits)

    const purchase = purchaseUpgrade(eightMinuteState, 'cargo')
    expect(purchase.cost).toBe(targetCredits)
    expect(purchase.state.upgrades.cargo).toBe(1)
  })

  it('supports two upgrades within 15 minutes of deterministic starter hauling', () => {
    const targetCredits = getUpgradeCost('cargo', 0) + getUpgradeCost('drill', 0)
    const { tripCount, elapsedMinutes } = getStarterMinutesForCredits(targetCredits)
    const fifteenMinuteState = fillStarterCargoWithCopperTrips(tripCount)
    const afterCargo = purchaseUpgrade(fifteenMinuteState, 'cargo').state
    const afterDrill = purchaseUpgrade(afterCargo, 'drill').state

    expect(elapsedMinutes).toBeLessThanOrEqual(SESSION_TARGET_TUNING.secondUpgradeTargetMinutes)
    expect(tripCount).toBe(3)
    expect(fifteenMinuteState.credits).toBe(216)
    expect(afterCargo.credits).toBe(144)
    expect(afterDrill.credits).toBe(56)
    expect(afterDrill.upgrades.cargo).toBe(1)
    expect(afterDrill.upgrades.drill).toBe(1)
    expect(getDrillDuration('dirt', afterDrill.upgrades)).toBeCloseTo(0.35 / 1.2, 6)
  })
})
