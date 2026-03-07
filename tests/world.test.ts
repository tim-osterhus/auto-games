import { describe, expect, it } from 'vitest'
import { getOreDefinition } from '../src/content/ores'
import {
  CLEAR_PATH_DEPTH,
  createGeneratedWorld,
  resolveSeed,
} from '../src/simulation/world'

describe('world generation', () => {
  it('uses query parameter seed overrides deterministically', () => {
    const querySeed = resolveSeed(11, '?seed=77')
    const fromQuery = createGeneratedWorld({ seed: 11, search: '?seed=77' })
    const fromExplicitSeed = createGeneratedWorld({ seed: querySeed })

    expect(querySeed).toBe(77)
    expect(fromQuery.serialize()).toEqual(fromExplicitSeed.serialize())
    expect(fromQuery.guaranteedOre).toEqual(fromExplicitSeed.guaranteedOre)
  })

  it('produces identical layouts for matching seeds', () => {
    const first = createGeneratedWorld({ seed: 20260307 })
    const second = createGeneratedWorld({ seed: 20260307 })

    expect(first.serialize()).toEqual(second.serialize())
    expect(first.spawn).toEqual(second.spawn)
    expect(first.guaranteedOre).toEqual(second.guaranteedOre)
  })

  it('creates a visible opening, clear descent path, and reachable sellable opening ore across seeds', () => {
    for (let seed = 0; seed < 24; seed += 1) {
      const world = createGeneratedWorld({ seed })
      const { openingX, surfaceY, guaranteedOre } = world
      const ore = getOreDefinition(guaranteedOre.oreId)

      expect(world.getTile(openingX, surfaceY)).toBe('empty')

      for (let y = surfaceY; y <= surfaceY + CLEAR_PATH_DEPTH; y += 1) {
        expect(world.getTile(openingX - 1, y)).toBe('empty')
        expect(world.getTile(openingX, y)).toBe('empty')
        expect(world.getTile(openingX + 1, y)).toBe('empty')
      }

      expect(ore.sellValue).toBeGreaterThan(0)
      expect(guaranteedOre.y).toBeLessThanOrEqual(surfaceY + 12)
      expect(Math.abs(guaranteedOre.x - openingX)).toBe(2)
      expect(world.getTile(guaranteedOre.x, guaranteedOre.y)).toBe(guaranteedOre.oreId)
      expect(world.getTile(guaranteedOre.x + Math.sign(openingX - guaranteedOre.x), guaranteedOre.y)).toBe(
        'empty',
      )
    }
  })

  it('removes generated tiles when drilled', () => {
    const world = createGeneratedWorld({ seed: 9 })
    const { x, y } = world.guaranteedOre

    expect(world.drillTile(x, y)).toBe(true)
    expect(world.getTile(x, y)).toBe('empty')
    expect(world.drillTile(x, y)).toBe(false)
  })
})
