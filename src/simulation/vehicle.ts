import { DRILL_RESISTANCE } from '../content/tuning'

export type SolidMaterial = 'dirt' | 'rock'
export type CellMaterial = 'empty' | SolidMaterial

export type Vector2 = {
  x: number
  y: number
}

export type DrillState = {
  target: { x: number; y: number } | null
  progress: number
  material: SolidMaterial | null
}

export type VehicleState = {
  position: Vector2
  velocity: Vector2
  facing: Vector2
  radius: number
  thrust: number
  lift: number
  gravity: number
  maxSpeed: number
  drill: DrillState
}

export type VehicleInput = {
  moveX: number
  moveY: number
  drill: boolean
}

export type GridWorld = {
  width: number
  height: number
  getCell: (x: number, y: number) => CellMaterial
  setCell: (x: number, y: number, material: CellMaterial) => void
}

export const DRILL_DURATIONS: Record<SolidMaterial, number> = DRILL_RESISTANCE

export function createVehicleState(overrides: Partial<VehicleState> = {}): VehicleState {
  return {
    position: overrides.position ?? { x: 2.5, y: 1.5 },
    velocity: overrides.velocity ?? { x: 0, y: 0 },
    facing: overrides.facing ?? { x: 0, y: 1 },
    radius: overrides.radius ?? 0.35,
    thrust: overrides.thrust ?? 18,
    lift: overrides.lift ?? 22,
    gravity: overrides.gravity ?? 16,
    maxSpeed: overrides.maxSpeed ?? 7.5,
    drill: overrides.drill ?? { target: null, progress: 0, material: null },
  }
}

export function createGridWorld(rows: string[]): GridWorld {
  const normalizedRows = rows.map((row) => Array.from(row))
  const height = normalizedRows.length
  const width = normalizedRows[0]?.length ?? 0

  return {
    width,
    height,
    getCell(x: number, y: number): CellMaterial {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return 'rock'
      }

      const cell = normalizedRows[y]?.[x] ?? '.'
      return cell === 'd' ? 'dirt' : cell === 'r' ? 'rock' : 'empty'
    },
    setCell(x: number, y: number, material: CellMaterial) {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return
      }

      normalizedRows[y][x] = material === 'dirt' ? 'd' : material === 'rock' ? 'r' : '.'
    },
  }
}

export function serializeGridWorld(world: GridWorld): string[] {
  return Array.from({ length: world.height }, (_, y) =>
    Array.from({ length: world.width }, (_, x) => {
      const material = world.getCell(x, y)
      return material === 'dirt' ? 'd' : material === 'rock' ? 'r' : '.'
    }).join(''),
  )
}

export function stepVehicle(
  state: VehicleState,
  input: VehicleInput,
  world: GridWorld,
  deltaSeconds: number,
): VehicleState {
  const moveX = clamp(input.moveX, -1, 1)
  const moveY = clamp(input.moveY, -1, 1)
  const desiredFacing =
    moveX !== 0 || moveY !== 0
      ? normalizeVector({ x: moveX, y: -moveY })
      : state.facing

  let velocity = {
    x: state.velocity.x + moveX * state.thrust * deltaSeconds,
    y: state.velocity.y + (state.gravity - moveY * state.lift) * deltaSeconds,
  }

  const speed = Math.hypot(velocity.x, velocity.y)
  if (speed > state.maxSpeed) {
    const scale = state.maxSpeed / speed
    velocity = {
      x: velocity.x * scale,
      y: velocity.y * scale,
    }
  }

  const movedX = moveAlongAxis(state.position, velocity.x * deltaSeconds, 'x', state.radius, world)
  const movedY = moveAlongAxis(movedX.position, velocity.y * deltaSeconds, 'y', state.radius, world)
  velocity = {
    x: movedX.blocked ? 0 : velocity.x,
    y: movedY.blocked ? 0 : velocity.y,
  }

  const nextState: VehicleState = {
    ...state,
    position: movedY.position,
    velocity,
    facing: desiredFacing,
    drill: updateDrill(state, desiredFacing, movedY.position, input.drill, world, deltaSeconds, state.radius),
  }

  return nextState
}

function updateDrill(
  previousState: VehicleState,
  facing: Vector2,
  position: Vector2,
  drilling: boolean,
  world: GridWorld,
  deltaSeconds: number,
  radius: number,
): DrillState {
  if (!drilling) {
    return { target: null, progress: 0, material: null }
  }

  const targetX = Math.floor(position.x + facing.x * (radius + 0.51))
  const targetY = Math.floor(position.y + facing.y * (radius + 0.51))
  const material = world.getCell(targetX, targetY)

  if (material === 'empty') {
    return { target: null, progress: 0, material: null }
  }

  const continuingSameTarget =
    previousState.drill.target?.x === targetX &&
    previousState.drill.target?.y === targetY &&
    previousState.drill.material === material

  const progress = (continuingSameTarget ? previousState.drill.progress : 0) + deltaSeconds
  if (progress >= DRILL_DURATIONS[material]) {
    world.setCell(targetX, targetY, 'empty')
    return { target: null, progress: 0, material: null }
  }

  return {
    target: { x: targetX, y: targetY },
    progress,
    material,
  }
}

function moveAlongAxis(
  position: Vector2,
  delta: number,
  axis: 'x' | 'y',
  radius: number,
  world: GridWorld,
): { position: Vector2; blocked: boolean } {
  if (delta === 0) {
    return { position, blocked: false }
  }

  const direction = Math.sign(delta)
  let remaining = Math.abs(delta)
  let nextPosition = position
  let blocked = false

  while (remaining > 0) {
    const step = Math.min(remaining, radius * 0.5)
    const candidate =
      axis === 'x'
        ? { x: nextPosition.x + direction * step, y: nextPosition.y }
        : { x: nextPosition.x, y: nextPosition.y + direction * step }

    if (isColliding(candidate, radius, world)) {
      blocked = true
      break
    }

    nextPosition = candidate
    remaining -= step
  }

  return { position: nextPosition, blocked }
}

function isColliding(position: Vector2, radius: number, world: GridWorld): boolean {
  const minX = Math.floor(position.x - radius)
  const maxX = Math.floor(position.x + radius)
  const minY = Math.floor(position.y - radius)
  const maxY = Math.floor(position.y + radius)

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const material = world.getCell(x, y)
      if (material === 'empty') {
        continue
      }

      const nearestX = clamp(position.x, x, x + 1)
      const nearestY = clamp(position.y, y, y + 1)
      const deltaX = position.x - nearestX
      const deltaY = position.y - nearestY

      if (deltaX * deltaX + deltaY * deltaY < radius * radius) {
        return true
      }
    }
  }

  return false
}

function normalizeVector(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y)
  if (length === 0) {
    return { x: 0, y: 1 }
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
