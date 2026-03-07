import type { EconomyState } from '../simulation'
import { getCargoUnits, getUpgradeStats } from '../simulation'

type HUDProps = {
  depth: number
  distanceToSurface: number
  economy: EconomyState
}

function formatPercent(value: number, max: number): string {
  if (max <= 0) {
    return '0%'
  }

  return `${Math.round((value / max) * 100)}%`
}

export function HUD({ depth, distanceToSurface, economy }: HUDProps) {
  const stats = getUpgradeStats(economy.upgrades)
  const cargoUnits = getCargoUnits(economy.cargo)
  const surfaceText =
    distanceToSurface <= 0.1 ? 'Surface reached' : `${distanceToSurface.toFixed(1)}m to surface`

  return (
    <section className="hud" aria-label="Vehicle heads-up display">
      <div className="hud-card hud-primary">
        <span className="label">Depth</span>
        <strong>{depth.toFixed(1)}m</strong>
      </div>
      <div className="hud-card">
        <span className="label">Fuel</span>
        <strong>
          {Math.round(economy.fuel)} / {stats.maxFuel}
        </strong>
        <span className="meter-copy">{formatPercent(economy.fuel, stats.maxFuel)}</span>
      </div>
      <div className="hud-card">
        <span className="label">Hull</span>
        <strong>
          {Math.round(economy.hull)} / {stats.maxHull}
        </strong>
        <span className="meter-copy">{formatPercent(economy.hull, stats.maxHull)}</span>
      </div>
      <div className="hud-card">
        <span className="label">Cargo</span>
        <strong>
          {cargoUnits} / {stats.cargoCapacity}
        </strong>
        <span className="meter-copy">{cargoUnits === stats.cargoCapacity ? 'Hold full' : 'Hold available'}</span>
      </div>
      <div className="hud-card hud-primary">
        <span className="label">Credits</span>
        <strong>{economy.credits}</strong>
      </div>
      <div className="surface-indicator" aria-live="polite">
        <span className="surface-arrow">↑</span>
        <div>
          <span className="label">Surface</span>
          <strong>{surfaceText}</strong>
        </div>
      </div>
    </section>
  )
}
