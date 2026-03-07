import { startTransition, useEffect, useRef, useState } from 'react'
import './App.css'
import { playSound, type SoundCue } from './audio/sounds'
import { getOreDefinition } from './content'
import { DebugOverlay, HUD, HazardView } from './render'
import { SimulationLoop } from './simulation/physics'
import {
  addCargo,
  createHazardState,
  createEconomyState,
  createGeneratedWorld,
  createVehicleState,
  getCargoUnits,
  stepHazards,
  getUpgradeStats,
  isSellableOre,
  refuelAtBase,
  repairAtBase,
  sellCargo,
  stepVehicle,
  type EconomyState,
  type GridWorld,
  type HazardWarning,
  type VehicleInput,
  type VehicleState,
} from './simulation'

const FIXED_DELTA_SECONDS = 1 / 60
const LOW_FUEL_RATIO = 0.2
const SURFACE_CLEARANCE = 0.5
const BASE_FUEL_DRAIN = 1.2
const MOVE_FUEL_DRAIN = 1.6
const DRILL_FUEL_DRAIN = 2.8
const IMPACT_DAMAGE_THRESHOLD = 5

type Feedback = {
  id: number
  kind: SoundCue
  title: string
  detail: string
}

type TimedFeedback = Feedback & {
  expiresAt: number
}

type FrameSnapshot = {
  vehicle: VehicleState
  terrainRows: string[]
  economy: EconomyState
  fps: number
  feedbacks: Feedback[]
  hazardWarning: HazardWarning | null
  runFailed: boolean
}

function createWorldAdapter(world: ReturnType<typeof createGeneratedWorld>): GridWorld {
  return {
    width: world.width,
    height: world.height,
    getCell(x, y) {
      const tile = world.getTile(x, y)
      if (tile === 'empty') {
        return 'empty'
      }

      if (tile === 'dirt') {
        return 'dirt'
      }

      return 'rock'
    },
    setCell(x, y, material) {
      world.setTile(x, y, material === 'empty' ? 'empty' : material)
    },
  }
}

function createSnapshot(
  vehicle: VehicleState,
  terrainRows: string[],
  economy: EconomyState,
  fps: number,
  feedbacks: Feedback[],
  hazardWarning: HazardWarning | null,
  runFailed: boolean,
): FrameSnapshot {
  return {
    vehicle: {
      ...vehicle,
      position: { ...vehicle.position },
      velocity: { ...vehicle.velocity },
      facing: { ...vehicle.facing },
      drill: {
        ...vehicle.drill,
        target: vehicle.drill.target ? { ...vehicle.drill.target } : null,
      },
    },
    terrainRows: [...terrainRows],
    economy: {
      ...economy,
      cargo: { ...economy.cargo },
      upgrades: { ...economy.upgrades },
    },
    fps,
    feedbacks: feedbacks.map((feedback) => ({ ...feedback })),
    hazardWarning: hazardWarning
      ? {
          ...hazardWarning,
          source: { ...hazardWarning.source },
        }
      : null,
    runFailed,
  }
}

function readInput(pressedKeys: Set<string>): VehicleInput {
  const left = pressedKeys.has('arrowleft') || pressedKeys.has('a')
  const right = pressedKeys.has('arrowright') || pressedKeys.has('d')
  const up = pressedKeys.has('arrowup') || pressedKeys.has('w')
  const down = pressedKeys.has('arrowdown') || pressedKeys.has('s')

  return {
    moveX: Number(right) - Number(left),
    moveY: Number(up) - Number(down),
    drill: pressedKeys.has(' ') || pressedKeys.has('space'),
  }
}

function getCellClass(cell: string): string {
  if (cell === '.') {
    return 'cell-empty'
  }

  if (cell === 'd') {
    return 'cell-dirt'
  }

  if (cell === 'r') {
    return 'cell-rock'
  }

  if (cell === 'c') {
    return 'cell-copper'
  }

  if (cell === 'a') {
    return 'cell-amber'
  }

  if (cell === 'z') {
    return 'cell-azure'
  }

  return 'cell-crimsonite'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function App() {
  const worldRef = useRef(createGeneratedWorld())
  const adapterWorldRef = useRef(createWorldAdapter(worldRef.current))
  const economyRef = useRef(createEconomyState())
  const vehicleRef = useRef(
    createVehicleState({
      position: { ...worldRef.current.spawn },
      ...getUpgradeStats(economyRef.current.upgrades),
    }),
  )
  const pressedKeysRef = useRef(new Set<string>())
  const feedbacksRef = useRef<TimedFeedback[]>([])
  const feedbackIdRef = useRef(0)
  const hazardStateRef = useRef(createHazardState())
  const lowFuelAlertedRef = useRef(false)
  const cargoFullAlertedRef = useRef(false)
  const hazardWarningRef = useRef<HazardWarning | null>(null)
  const runFailedRef = useRef(false)
  const atSurfaceRef = useRef(vehicleRef.current.position.y <= worldRef.current.surfaceY - SURFACE_CLEARANCE)
  const loopRef = useRef(
    new SimulationLoop(FIXED_DELTA_SECONDS, (deltaSeconds: number) => {
      const world = worldRef.current
      const adapterWorld = adapterWorldRef.current
      const previousVehicle = vehicleRef.current
      const previousEconomy = economyRef.current
      const input = readInput(pressedKeysRef.current)
      const stats = getUpgradeStats(previousEconomy.upgrades)
      const movementIntent = Math.abs(input.moveX) + Math.abs(input.moveY)
      const canSpendFuel = previousEconomy.fuel > 0 && !runFailedRef.current
      const effectiveInput = canSpendFuel ? input : { moveX: 0, moveY: 0, drill: false }
      const drilledTile =
        previousVehicle.drill.target === null
          ? null
          : world.getTile(previousVehicle.drill.target.x, previousVehicle.drill.target.y)

      vehicleRef.current = stepVehicle(previousVehicle, effectiveInput, adapterWorld, deltaSeconds)

      let nextEconomy: EconomyState = previousEconomy
      const fuelDrain =
        deltaSeconds *
        (BASE_FUEL_DRAIN + movementIntent * MOVE_FUEL_DRAIN + Number(effectiveInput.drill) * DRILL_FUEL_DRAIN)

      if (fuelDrain > 0) {
        nextEconomy = {
          ...nextEconomy,
          fuel: clamp(nextEconomy.fuel - fuelDrain, 0, stats.maxFuel),
        }
      }

      const previousSpeed = Math.hypot(previousVehicle.velocity.x, previousVehicle.velocity.y)
      const nextSpeed = Math.hypot(vehicleRef.current.velocity.x, vehicleRef.current.velocity.y)
      const movedDistance = Math.hypot(
        vehicleRef.current.position.x - previousVehicle.position.x,
        vehicleRef.current.position.y - previousVehicle.position.y,
      )

      if (
        previousSpeed >= IMPACT_DAMAGE_THRESHOLD &&
        nextSpeed <= previousSpeed * 0.35 &&
        movedDistance < previousSpeed * deltaSeconds * 0.6
      ) {
        const damage = Math.max(4, Math.round((previousSpeed - IMPACT_DAMAGE_THRESHOLD + 1) * 2))
        nextEconomy = {
          ...nextEconomy,
          hull: clamp(nextEconomy.hull - damage, 0, stats.maxHull),
        }

        const now = performance.now()
        const feedback: TimedFeedback = {
          id: feedbackIdRef.current,
          kind: 'damage',
          title: 'Hull impact',
          detail: `Lost ${damage} hull from a hard collision`,
          expiresAt: now + 1800,
        }
        feedbackIdRef.current += 1
        feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
        playSound('damage')
      }

      if (!runFailedRef.current) {
        const hazardStep = stepHazards({
          state: hazardStateRef.current,
          world: worldRef.current,
          position: vehicleRef.current.position,
          hull: nextEconomy.hull,
          deltaSeconds,
        })

        hazardStateRef.current = hazardStep.state
        hazardWarningRef.current = hazardStep.warning

        if (hazardStep.damage > 0) {
          const nextHull = clamp(nextEconomy.hull - hazardStep.damage, 0, stats.maxHull)
          nextEconomy = {
            ...nextEconomy,
            hull: nextHull,
          }
          runFailedRef.current = hazardStep.runFailed

          const now = performance.now()
          const feedback: TimedFeedback = {
            id: feedbackIdRef.current,
            kind: 'damage',
            title: hazardStep.runFailed ? 'Gas pocket rupture' : 'Gas burst',
            detail: hazardStep.runFailed
              ? 'Critical hull loss. The rig is disabled.'
              : `Lost ${hazardStep.damage} hull from an ignited gas pocket`,
            expiresAt: now + 2200,
          }
          feedbackIdRef.current += 1
          feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
          playSound('damage')
        }
      } else {
        hazardWarningRef.current = null
      }

      if (
        previousVehicle.drill.target &&
        previousVehicle.drill.target.x >= 0 &&
        previousVehicle.drill.target.y >= 0 &&
        drilledTile &&
        world.getTile(previousVehicle.drill.target.x, previousVehicle.drill.target.y) === 'empty' &&
        isSellableOre(drilledTile)
      ) {
        const cargoBefore = getCargoUnits(nextEconomy.cargo)
        const cargoAttempt = addCargo(nextEconomy, drilledTile)
        const cargoAfter = getCargoUnits(cargoAttempt.cargo)
        const now = performance.now()

        if (cargoAfter === cargoBefore) {
          if (!cargoFullAlertedRef.current) {
            const feedback: TimedFeedback = {
              id: feedbackIdRef.current,
              kind: 'cargoFull',
              title: 'Cargo full',
              detail: 'Return to the surface to unload ore',
              expiresAt: now + 2200,
            }
            feedbackIdRef.current += 1
            feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
            cargoFullAlertedRef.current = true
            playSound('cargoFull')
          }
        } else {
          nextEconomy = cargoAttempt
          const ore = getOreDefinition(drilledTile)
          const feedback: TimedFeedback = {
            id: feedbackIdRef.current,
            kind: 'ore',
            title: `${ore.label} collected`,
            detail: `Stored 1 unit worth ${ore.sellValue} credits`,
            expiresAt: now + 1600,
          }
          feedbackIdRef.current += 1
          feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
          playSound('ore')

          if (cargoAfter >= stats.cargoCapacity && cargoBefore < stats.cargoCapacity && !cargoFullAlertedRef.current) {
            const cargoFeedback: TimedFeedback = {
              id: feedbackIdRef.current,
              kind: 'cargoFull',
              title: 'Cargo full',
              detail: 'Return to the surface to unload ore',
              expiresAt: now + 2200,
            }
            feedbackIdRef.current += 1
            feedbacksRef.current = [cargoFeedback, ...feedbacksRef.current].slice(0, 4)
            cargoFullAlertedRef.current = true
            playSound('cargoFull')
          }
        }
      }

      if (nextEconomy.fuel <= stats.maxFuel * LOW_FUEL_RATIO && !lowFuelAlertedRef.current) {
        const now = performance.now()
        const feedback: TimedFeedback = {
          id: feedbackIdRef.current,
          kind: 'lowFuel',
          title: 'Low fuel',
          detail: 'Climb back to the surface soon',
          expiresAt: now + 2400,
        }
        feedbackIdRef.current += 1
        feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
        lowFuelAlertedRef.current = true
        playSound('lowFuel')
      }

      if (nextEconomy.fuel > stats.maxFuel * LOW_FUEL_RATIO) {
        lowFuelAlertedRef.current = false
      }

      const cargoUnits = getCargoUnits(nextEconomy.cargo)
      if (cargoUnits < stats.cargoCapacity) {
        cargoFullAlertedRef.current = false
      }

      const isAtSurface = vehicleRef.current.position.y <= world.surfaceY - SURFACE_CLEARANCE
      if (isAtSurface && !atSurfaceRef.current) {
        const cargoSale = sellCargo(nextEconomy)
        const refuelResult = refuelAtBase(cargoSale.state)
        const repairResult = repairAtBase(refuelResult.state)
        nextEconomy = repairResult.state

        const now = performance.now()
        const summary =
          cargoSale.unitsSold > 0
            ? `Sold ${cargoSale.unitsSold} units for ${cargoSale.creditsEarned} credits`
            : 'Docked for refuel and repairs'
        const feedback: TimedFeedback = {
          id: feedbackIdRef.current,
          kind: 'surface',
          title: 'Surface return',
          detail: summary,
          expiresAt: now + 2200,
        }
        feedbackIdRef.current += 1
        feedbacksRef.current = [feedback, ...feedbacksRef.current].slice(0, 4)
        playSound('surface')
      }
      atSurfaceRef.current = isAtSurface

      economyRef.current = nextEconomy
    }),
  )
  const [debugEnabled, setDebugEnabled] = useState(false)
  const [snapshot, setSnapshot] = useState(() =>
    createSnapshot(vehicleRef.current, worldRef.current.serialize(), economyRef.current, 60, [], null, false),
  )

  useEffect(() => {
    const handleKeyChange = (event: KeyboardEvent, isPressed: boolean) => {
      const key = event.key.toLowerCase()

      if (key === '`' && isPressed && !event.repeat) {
        event.preventDefault()
        setDebugEnabled((enabled) => !enabled)
        return
      }

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault()
      }

      if (isPressed) {
        pressedKeysRef.current.add(key)
      } else {
        pressedKeysRef.current.delete(key)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => handleKeyChange(event, true)
    const onKeyUp = (event: KeyboardEvent) => handleKeyChange(event, false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    let animationFrameId = 0
    let lastFrameTime = performance.now()

    const update = (now: number) => {
      const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.25)
      lastFrameTime = now
      loopRef.current.tick(deltaSeconds)

      feedbacksRef.current = feedbacksRef.current.filter((feedback) => feedback.expiresAt > now)

      const nextSnapshot = createSnapshot(
        vehicleRef.current,
        worldRef.current.serialize(),
        economyRef.current,
        deltaSeconds > 0 ? 1 / deltaSeconds : 60,
        feedbacksRef.current,
        hazardWarningRef.current,
        runFailedRef.current,
      )

      startTransition(() => {
        setSnapshot(nextSnapshot)
      })

      animationFrameId = window.requestAnimationFrame(update)
    }

    animationFrameId = window.requestAnimationFrame(update)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const depth = Math.max(0, snapshot.vehicle.position.y - worldRef.current.surfaceY)
  const distanceToSurface = Math.max(0, snapshot.vehicle.position.y - worldRef.current.surfaceY)

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Corebound prototype</p>
        <h1>Mine deep. Surface smart.</h1>
        <p className="lede">
          Arrow keys or WASD thrust the rig, space drills, and the HUD tracks your run in real time. Press `
          to toggle the debug overlay.
        </p>
      </section>

      <section className="panel">
        <HUD depth={depth} distanceToSurface={distanceToSurface} economy={snapshot.economy} />
        <HazardView warning={snapshot.hazardWarning} runFailed={snapshot.runFailed} />

        <div className="status-strip">
          <div>
            <span className="label">Velocity</span>
            <strong>
              {snapshot.vehicle.velocity.x.toFixed(2)}, {snapshot.vehicle.velocity.y.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="label">Drill</span>
            <strong>
              {snapshot.vehicle.drill.target
                ? `${snapshot.vehicle.drill.material} ${snapshot.vehicle.drill.progress.toFixed(2)}s`
                : 'idle'}
            </strong>
          </div>
          <div>
            <span className="label">Seed</span>
            <strong>{worldRef.current.seed}</strong>
          </div>
        </div>

        <div className="playfield">
          <div className="feedback-stack" aria-live="polite">
            {snapshot.feedbacks.map((feedback) => (
              <article key={feedback.id} className={`feedback-card feedback-${feedback.kind}`}>
                <span className="label">{feedback.title}</span>
                <strong>{feedback.detail}</strong>
              </article>
            ))}
          </div>

          <div className="world-frame">
            <div className="world">
              {snapshot.terrainRows.map((row, y) => (
                <div
                  key={y}
                  className="row"
                  style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                >
                  {Array.from(row).map((cell, x) => {
                    const vehicleCellX = Math.floor(snapshot.vehicle.position.x)
                    const vehicleCellY = Math.floor(snapshot.vehicle.position.y)
                    const isVehicle = vehicleCellX === x && vehicleCellY === y

                    return (
                      <span
                        key={`${x}-${y}`}
                        className={`cell ${getCellClass(cell)}${isVehicle ? ' cell-vehicle' : ''}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {debugEnabled ? (
        <DebugOverlay
          seed={worldRef.current.seed}
          fps={snapshot.fps}
          position={snapshot.vehicle.position}
        />
      ) : null}
    </main>
  )
}

export default App
