import {
  getOpeningOreDefinition,
  getOreDefinition,
  getOresForDepth,
  type OreId,
} from '../content/ores'

export type TileMaterial = 'empty' | 'dirt' | 'rock' | OreId

export type WorldPosition = {
  x: number
  y: number
}

export type GeneratedWorld = {
  seed: number
  width: number
  height: number
  surfaceY: number
  openingX: number
  spawn: WorldPosition
  guaranteedOre: WorldPosition & { oreId: OreId }
  getTile: (x: number, y: number) => TileMaterial
  setTile: (x: number, y: number, material: TileMaterial) => void
  drillTile: (x: number, y: number) => boolean
  serialize: () => string[]
}

export type WorldGenerationOptions = {
  seed?: number
  search?: string
  width?: number
  height?: number
}

export const DEFAULT_WORLD_WIDTH = 48
export const DEFAULT_WORLD_HEIGHT = 64
export const DEFAULT_SURFACE_Y = 6
export const CLEAR_PATH_DEPTH = 24
export const CLEAR_PATH_WIDTH = 3

const ROCK_START_DEPTH = 22

const TILE_TO_CHAR: Record<TileMaterial, string> = {
  empty: '.',
  dirt: 'd',
  rock: 'r',
  copper: 'c',
  amber: 'a',
  azure: 'z',
  crimsonite: 'm',
}

const CHAR_TO_TILE = new Map(
  Object.entries(TILE_TO_CHAR).map(([material, char]) => [char, material as TileMaterial]),
)

export function createGeneratedWorld(options: WorldGenerationOptions = {}): GeneratedWorld {
  const width = options.width ?? DEFAULT_WORLD_WIDTH
  const height = options.height ?? DEFAULT_WORLD_HEIGHT
  const surfaceY = DEFAULT_SURFACE_Y
  const openingX = Math.floor(width / 2)
  const seed = resolveSeed(options.seed ?? 1, options.search)
  const random = createMulberry32(seed)

  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => createBaseTile(x, y, surfaceY, openingX, random)),
  )

  carveOpening(tiles, openingX, surfaceY, Math.min(height - 2, surfaceY + CLEAR_PATH_DEPTH))
  populateOre(tiles, random, surfaceY, openingX)

  const openingOre = getOpeningOreDefinition()
  const guaranteedOreY = Math.min(surfaceY + 7 + Math.floor(random() * 5), height - 3)
  const guaranteedOreX = openingX + (random() < 0.5 ? -2 : 2)
  tiles[guaranteedOreY][guaranteedOreX] = openingOre.id

  const spawn = { x: openingX + 0.5, y: surfaceY - 1.5 }

  return {
    seed,
    width,
    height,
    surfaceY,
    openingX,
    spawn,
    guaranteedOre: {
      x: guaranteedOreX,
      y: guaranteedOreY,
      oreId: openingOre.id,
    },
    getTile(x: number, y: number): TileMaterial {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return 'rock'
      }

      return tiles[y][x]
    },
    setTile(x: number, y: number, material: TileMaterial) {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return
      }

      tiles[y][x] = material
    },
    drillTile(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return false
      }

      if (tiles[y][x] === 'empty') {
        return false
      }

      tiles[y][x] = 'empty'
      return true
    },
    serialize() {
      return serializeWorldTiles(tiles)
    },
  }
}

export function resolveSeed(defaultSeed = 1, search = getDefaultSearch()): number {
  const params = new URLSearchParams(search)
  const rawSeed = params.get('seed')

  if (rawSeed === null || rawSeed.trim() === '') {
    return normalizeSeed(defaultSeed)
  }

  const parsedSeed = Number.parseInt(rawSeed, 10)
  return Number.isFinite(parsedSeed) ? normalizeSeed(parsedSeed) : normalizeSeed(defaultSeed)
}

export function createMulberry32(seed: number): () => number {
  let state = normalizeSeed(seed)

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let result = Math.imul(state ^ (state >>> 15), state | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function serializeWorldTiles(tiles: TileMaterial[][]): string[] {
  return tiles.map((row) => row.map((tile) => TILE_TO_CHAR[tile]).join(''))
}

export function deserializeWorldTiles(rows: string[]): TileMaterial[][] {
  return rows.map((row) =>
    Array.from(row, (char) => {
      const tile = CHAR_TO_TILE.get(char)
      if (!tile) {
        throw new Error(`Unknown world tile character: ${char}`)
      }

      return tile
    }),
  )
}

export function isSellableOre(tile: TileMaterial): tile is OreId {
  if (tile === 'empty' || tile === 'dirt' || tile === 'rock') {
    return false
  }

  return getOreDefinition(tile).sellValue > 0
}

function createBaseTile(
  x: number,
  y: number,
  surfaceY: number,
  openingX: number,
  random: () => number,
): TileMaterial {
  if (y < surfaceY) {
    return 'empty'
  }

  if (y === surfaceY) {
    return Math.abs(x - openingX) <= 1 ? 'empty' : 'dirt'
  }

  if (Math.abs(x - openingX) <= 1 && y <= surfaceY + 2) {
    return 'empty'
  }

  const rockChance = y < ROCK_START_DEPTH ? 0.08 : Math.min(0.62, 0.18 + (y - ROCK_START_DEPTH) * 0.018)
  return random() < rockChance ? 'rock' : 'dirt'
}

function carveOpening(
  tiles: TileMaterial[][],
  openingX: number,
  surfaceY: number,
  clearPathEndY: number,
): void {
  for (let y = surfaceY; y <= clearPathEndY; y += 1) {
    for (let x = openingX - 1; x <= openingX + 1; x += 1) {
      tiles[y][x] = 'empty'
    }
  }
}

function populateOre(
  tiles: TileMaterial[][],
  random: () => number,
  surfaceY: number,
  openingX: number,
): void {
  for (let y = surfaceY + 2; y < tiles.length; y += 1) {
    const oresForDepth = getOresForDepth(y)
    if (oresForDepth.length === 0) {
      continue
    }

    for (let x = 1; x < tiles[y].length - 1; x += 1) {
      if (tiles[y][x] === 'empty') {
        continue
      }

      if (Math.abs(x - openingX) <= 2 && y <= surfaceY + CLEAR_PATH_DEPTH) {
        continue
      }

      for (const ore of oresForDepth) {
        if (random() <= ore.chance) {
          tiles[y][x] = ore.id
          break
        }
      }
    }
  }
}

function getDefaultSearch(): string {
  const candidate = globalThis as { location?: { search?: string } }
  return candidate.location?.search ?? ''
}

function normalizeSeed(seed: number): number {
  return seed >>> 0
}
