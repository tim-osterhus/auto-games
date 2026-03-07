import { ORE_TUNING, type OreTuningDefinition, type OreTuningId } from './tuning'

export type OreId = OreTuningId

export type OreDefinition = {
  id: OreId
  label: string
  tier: 1 | 2 | 3 | 4
  sellValue: number
  depthMin: number
  depthMax: number
  chance: number
  openingEligible: boolean
}

export const ORE_DEFINITIONS: OreDefinition[] = ORE_TUNING.map((ore) => ({ ...ore })) satisfies OreTuningDefinition[]

const ORE_BY_ID = new Map(ORE_DEFINITIONS.map((ore) => [ore.id, ore]))

export function getOreDefinition(id: OreId): OreDefinition {
  const definition = ORE_BY_ID.get(id)
  if (!definition) {
    throw new Error(`Unknown ore id: ${id}`)
  }

  return definition
}

export function getOresForDepth(depth: number): OreDefinition[] {
  return ORE_DEFINITIONS.filter((ore) => depth >= ore.depthMin && depth <= ore.depthMax)
}

export function getOpeningOreDefinition(): OreDefinition {
  const ore = ORE_DEFINITIONS.find((definition) => definition.openingEligible)
  if (!ore) {
    throw new Error('Expected at least one opening-eligible ore definition')
  }

  return ore
}
