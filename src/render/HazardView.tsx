import type { HazardWarning } from '../simulation'

type HazardViewProps = {
  warning: HazardWarning | null
  runFailed: boolean
}

export function HazardView({ warning, runFailed }: HazardViewProps) {
  if (!warning && !runFailed) {
    return null
  }

  if (runFailed) {
    return (
      <section className="hazard-view hazard-view-failed" aria-live="assertive">
        <span className="label">Critical failure</span>
        <strong>Rig disabled</strong>
        <p>Hull integrity collapsed after a gas-pocket rupture. Surface recovery is required.</p>
      </section>
    )
  }

  if (!warning) {
    return null
  }

  const activeWarning = warning
  const urgencyClass = activeWarning.secondsUntilImpact <= 0.75 ? 'hazard-view-critical' : 'hazard-view-warning'

  return (
    <section className={`hazard-view ${urgencyClass}`} aria-live="assertive">
      <span className="label">{activeWarning.title}</span>
      <strong>{activeWarning.secondsUntilImpact.toFixed(1)}s to rupture</strong>
      <p>{activeWarning.detail}</p>
    </section>
  )
}
