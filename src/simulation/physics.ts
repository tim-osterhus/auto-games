export class SimulationLoop {
  private accumulatorSeconds = 0
  private readonly fixedDeltaSeconds: number
  private readonly onStep: (deltaSeconds: number) => void
  private readonly maxFrameSeconds: number
  private readonly maxStepsPerTick: number

  constructor(
    fixedDeltaSeconds: number,
    onStep: (deltaSeconds: number) => void,
    maxFrameSeconds = 0.25,
    maxStepsPerTick = 12,
  ) {
    this.fixedDeltaSeconds = fixedDeltaSeconds
    this.onStep = onStep
    this.maxFrameSeconds = maxFrameSeconds
    this.maxStepsPerTick = maxStepsPerTick
  }

  tick(frameSeconds: number): number {
    this.accumulatorSeconds += Math.min(frameSeconds, this.maxFrameSeconds)

    let steps = 0
    while (
      this.accumulatorSeconds >= this.fixedDeltaSeconds &&
      steps < this.maxStepsPerTick
    ) {
      this.onStep(this.fixedDeltaSeconds)
      this.accumulatorSeconds -= this.fixedDeltaSeconds
      steps += 1
    }

    return steps
  }
}
