import { describe, expect, it } from 'vitest'
import { SimulationLoop } from '../src/simulation/physics'
import {
  createGridWorld,
  createVehicleState,
  stepVehicle,
} from '../src/simulation/vehicle'

function runMovementPattern(frameDeltas: number[]) {
  const world = createGridWorld([
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ])
  let vehicle = createVehicleState({
    position: { x: 2.5, y: 1.5 },
    gravity: 0,
  })
  const loop = new SimulationLoop(1 / 60, (deltaSeconds) => {
    vehicle = stepVehicle(vehicle, { moveX: 1, moveY: 0, drill: false }, world, deltaSeconds)
  })

  for (const delta of frameDeltas) {
    loop.tick(delta)
  }

  return vehicle
}

function repeatDelta(delta: number, count: number): number[] {
  return Array.from({ length: count }, () => delta)
}

describe('SimulationLoop', () => {
  it('produces deterministic movement across different frame rates', () => {
    const sixtyFpsVehicle = runMovementPattern(repeatDelta(1 / 60, 120))
    const mixedFrameVehicle = runMovementPattern([
      ...repeatDelta(1 / 30, 20),
      ...repeatDelta(1 / 120, 40),
      ...repeatDelta(1 / 20, 20),
    ])

    expect(mixedFrameVehicle.position.x).toBeCloseTo(sixtyFpsVehicle.position.x, 6)
    expect(mixedFrameVehicle.position.y).toBeCloseTo(sixtyFpsVehicle.position.y, 6)
    expect(mixedFrameVehicle.velocity.x).toBeCloseTo(sixtyFpsVehicle.velocity.x, 6)
    expect(mixedFrameVehicle.velocity.y).toBeCloseTo(sixtyFpsVehicle.velocity.y, 6)
  })

  it('stops the vehicle when it reaches solid terrain', () => {
    const world = createGridWorld([
      '..........',
      '.....r....',
      '.....r....',
      '.....r....',
      '.....r....',
      '..........',
    ])
    let vehicle = createVehicleState({
      position: { x: 3.6, y: 1.5 },
      gravity: 0,
    })
    const loop = new SimulationLoop(1 / 60, (deltaSeconds) => {
      vehicle = stepVehicle(vehicle, { moveX: 1, moveY: 0, drill: false }, world, deltaSeconds)
    })

    for (const delta of repeatDelta(1 / 60, 90)) {
      loop.tick(delta)
    }

    expect(vehicle.position.x).toBeLessThan(4.65)
    expect(vehicle.velocity.x).toBe(0)
  })

  it('requires 0.35 seconds to drill dirt and 0.75 seconds to drill rock', () => {
    const dirtWorld = createGridWorld([
      '...',
      '.d.',
      '...',
    ])
    let dirtVehicle = createVehicleState({
      position: { x: 1.5, y: 0.55 },
      gravity: 0,
    })
    const dirtLoop = new SimulationLoop(1 / 60, (deltaSeconds) => {
      dirtVehicle = stepVehicle(
        dirtVehicle,
        { moveX: 0, moveY: 0, drill: true },
        dirtWorld,
        deltaSeconds,
      )
    })

    for (const delta of repeatDelta(1 / 60, 20)) {
      dirtLoop.tick(delta)
    }
    expect(dirtWorld.getCell(1, 1)).toBe('dirt')

    dirtLoop.tick(1 / 60)
    expect(dirtWorld.getCell(1, 1)).toBe('empty')

    const rockWorld = createGridWorld([
      '...',
      '.r.',
      '...',
    ])
    let rockVehicle = createVehicleState({
      position: { x: 1.5, y: 0.55 },
      gravity: 0,
    })
    const rockLoop = new SimulationLoop(1 / 60, (deltaSeconds) => {
      rockVehicle = stepVehicle(
        rockVehicle,
        { moveX: 0, moveY: 0, drill: true },
        rockWorld,
        deltaSeconds,
      )
    })

    for (const delta of repeatDelta(1 / 60, 44)) {
      rockLoop.tick(delta)
    }
    expect(rockWorld.getCell(1, 1)).toBe('rock')

    rockLoop.tick(1 / 60)
    expect(rockWorld.getCell(1, 1)).toBe('empty')
  })
})
