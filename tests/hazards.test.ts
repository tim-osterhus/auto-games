import { describe, expect, it } from 'vitest'
import {
  GAS_POCKET_START_DEPTH,
  GAS_POCKET_WARNING_DURATION,
  createHazardState,
  listHazardSources,
  stepHazards,
  type HazardWorldMeta,
} from '../src/simulation/hazards'

function createWorldMeta(overrides: Partial<HazardWorldMeta> = {}): HazardWorldMeta {
  return {
    seed: overrides.seed ?? 7,
    width: overrides.width ?? 48,
    height: overrides.height ?? 64,
    surfaceY: overrides.surfaceY ?? 6,
    openingX: overrides.openingX ?? 24,
  }
}

describe('hazards', () => {
  it('places early gas pockets starting at the first hazard depth band', () => {
    const world = createWorldMeta()
    const hazards = listHazardSources(world)

    expect(hazards.length).toBeGreaterThan(0)
    expect(hazards[0].position.y - 0.5).toBeGreaterThanOrEqual(world.surfaceY + GAS_POCKET_START_DEPTH)
    expect(hazards[0].position.y - 0.5).toBeLessThanOrEqual(world.surfaceY + GAS_POCKET_START_DEPTH + 2)
  })

  it('emits a warning before impact and counts down toward rupture', () => {
    const world = createWorldMeta()
    const [firstHazard] = listHazardSources(world)

    const firstStep = stepHazards({
      state: createHazardState(),
      world,
      position: { ...firstHazard.position },
      hull: 100,
      deltaSeconds: 0.6,
    })

    expect(firstStep.damage).toBe(0)
    expect(firstStep.warning).not.toBeNull()
    expect(firstStep.warning?.secondsUntilImpact).toBeCloseTo(GAS_POCKET_WARNING_DURATION - 0.6, 5)

    const secondStep = stepHazards({
      state: firstStep.state,
      world,
      position: { ...firstHazard.position },
      hull: 100,
      deltaSeconds: 0.6,
    })

    expect(secondStep.damage).toBe(0)
    expect(secondStep.warning?.secondsUntilImpact).toBeLessThan(firstStep.warning?.secondsUntilImpact ?? 0)
  })

  it('applies one-time hazard damage after the warning window and can fail the run', () => {
    const world = createWorldMeta()
    const [firstHazard] = listHazardSources(world)
    const warningStep = stepHazards({
      state: createHazardState(),
      world,
      position: { ...firstHazard.position },
      hull: 20,
      deltaSeconds: GAS_POCKET_WARNING_DURATION - 0.1,
    })

    expect(warningStep.warning).not.toBeNull()
    expect(warningStep.damage).toBe(0)

    const impactStep = stepHazards({
      state: warningStep.state,
      world,
      position: { ...firstHazard.position },
      hull: 20,
      deltaSeconds: 0.2,
    })

    expect(impactStep.warning).toBeNull()
    expect(impactStep.damage).toBeGreaterThan(0)
    expect(impactStep.runFailed).toBe(true)

    const postImpactStep = stepHazards({
      state: impactStep.state,
      world,
      position: { ...firstHazard.position },
      hull: 100,
      deltaSeconds: 0.5,
    })

    expect(postImpactStep.damage).toBe(0)
    expect(postImpactStep.warning).toBeNull()
  })
})
