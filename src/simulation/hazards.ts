export type HazardKind = 'gasPocket'

export type HazardWorldMeta = {
  seed: number
  width: number
  height: number
  surfaceY: number
  openingX: number
}

export type HazardSource = {
  id: string
  kind: HazardKind
  position: { x: number; y: number }
  warningRadius: number
  warningDuration: number
  damage: number
}

export type HazardWarning = {
  id: string
  kind: HazardKind
  title: string
  detail: string
  secondsUntilImpact: number
  progress: number
  source: { x: number; y: number }
  depth: number
}

export type HazardState = {
  activeHazardId: string | null
  warningElapsed: number
  spentHazardIds: string[]
}

export type HazardStepInput = {
  state: HazardState
  world: HazardWorldMeta
  position: { x: number; y: number }
  hull: number
  deltaSeconds: number
}

export type HazardStepResult = {
  state: HazardState
  warning: HazardWarning | null
  damage: number
  runFailed: boolean
}

export const GAS_POCKET_START_DEPTH = 18
export const GAS_POCKET_SPACING = 10
export const GAS_POCKET_WARNING_RADIUS = 3.25
export const GAS_POCKET_WARNING_DURATION = 1.8
export const GAS_POCKET_DAMAGE = 26

const POCKET_OFFSETS = [0, -2, 2, -3, 3]

export function createHazardState(overrides: Partial<HazardState> = {}): HazardState {
  return {
    activeHazardId: overrides.activeHazardId ?? null,
    warningElapsed: overrides.warningElapsed ?? 0,
    spentHazardIds: [...(overrides.spentHazardIds ?? [])],
  }
}

export function listHazardSources(world: HazardWorldMeta): HazardSource[] {
  const firstDepth = world.surfaceY + GAS_POCKET_START_DEPTH
  const maxY = world.height - 4

  if (firstDepth > maxY) {
    return []
  }

  const sources: HazardSource[] = []
  const rotation = hashInt(world.seed, world.surfaceY, world.openingX) % POCKET_OFFSETS.length

  for (let index = 0; ; index += 1) {
    const yBase = firstDepth + index * GAS_POCKET_SPACING
    if (yBase > maxY) {
      break
    }

    const variance = hashInt(world.seed, index, world.height) % 3
    const y = Math.min(maxY, yBase + variance)
    const offset = POCKET_OFFSETS[(rotation + index) % POCKET_OFFSETS.length]
    const x = clamp(world.openingX + offset, 2, world.width - 3)

    sources.push({
      id: `gas-${index}-${x}-${y}`,
      kind: 'gasPocket',
      position: { x: x + 0.5, y: y + 0.5 },
      warningRadius: GAS_POCKET_WARNING_RADIUS,
      warningDuration: GAS_POCKET_WARNING_DURATION,
      damage: GAS_POCKET_DAMAGE,
    })
  }

  return sources
}

export function stepHazards({ state, world, position, hull, deltaSeconds }: HazardStepInput): HazardStepResult {
  const spentHazardIds = new Set(state.spentHazardIds)
  const activeSource = findClosestHazard(position, listHazardSources(world), spentHazardIds)

  if (!activeSource) {
    return {
      state: {
        ...state,
        activeHazardId: null,
        warningElapsed: 0,
      },
      warning: null,
      damage: 0,
      runFailed: false,
    }
  }

  const warningElapsed =
    state.activeHazardId === activeSource.id ? state.warningElapsed + deltaSeconds : deltaSeconds

  if (warningElapsed >= activeSource.warningDuration) {
    spentHazardIds.add(activeSource.id)

    return {
      state: {
        activeHazardId: null,
        warningElapsed: 0,
        spentHazardIds: [...spentHazardIds],
      },
      warning: null,
      damage: activeSource.damage,
      runFailed: hull - activeSource.damage <= 0,
    }
  }

  const secondsUntilImpact = Math.max(0, activeSource.warningDuration - warningElapsed)

  return {
    state: {
      activeHazardId: activeSource.id,
      warningElapsed,
      spentHazardIds: [...spentHazardIds],
    },
    warning: {
      id: activeSource.id,
      kind: activeSource.kind,
      title: 'Gas pocket detected',
      detail: `Volatile gas is building below. Reverse course or clear the area within ${secondsUntilImpact.toFixed(1)}s.`,
      secondsUntilImpact,
      progress: warningElapsed / activeSource.warningDuration,
      source: activeSource.position,
      depth: Math.max(0, activeSource.position.y - world.surfaceY),
    },
    damage: 0,
    runFailed: false,
  }
}

function findClosestHazard(
  position: { x: number; y: number },
  sources: HazardSource[],
  spentHazardIds: Set<string>,
): HazardSource | null {
  let nearest: HazardSource | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const source of sources) {
    if (spentHazardIds.has(source.id)) {
      continue
    }

    const distance = Math.hypot(position.x - source.position.x, position.y - source.position.y)
    if (distance > source.warningRadius || distance >= nearestDistance) {
      continue
    }

    nearest = source
    nearestDistance = distance
  }

  return nearest
}

function hashInt(a: number, b: number, c: number): number {
  let value = a ^ (b * 374761393) ^ (c * 668265263)
  value = (value ^ (value >>> 13)) >>> 0
  value = Math.imul(value, 1274126177) >>> 0
  return value ^ (value >>> 16)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
