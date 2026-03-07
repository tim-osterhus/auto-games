type DebugOverlayProps = {
  seed: number
  fps: number
  position: {
    x: number
    y: number
  }
}

export function DebugOverlay({ seed, fps, position }: DebugOverlayProps) {
  return (
    <aside className="debug-overlay" aria-label="Debug overlay">
      <div>
        <span className="label">Seed</span>
        <strong>{seed}</strong>
      </div>
      <div>
        <span className="label">FPS</span>
        <strong>{fps.toFixed(0)}</strong>
      </div>
      <div>
        <span className="label">Position</span>
        <strong>
          {position.x.toFixed(2)}, {position.y.toFixed(2)}
        </strong>
      </div>
    </aside>
  )
}
