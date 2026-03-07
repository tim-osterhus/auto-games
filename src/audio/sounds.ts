export type SoundCue = 'ore' | 'damage' | 'lowFuel' | 'cargoFull' | 'surface'

let audioContext: AudioContext | null = null

const SOUND_MAP: Record<
  SoundCue,
  {
    frequency: number
    duration: number
    type: OscillatorType
    gain: number
    rampTo?: number
  }
> = {
  ore: { frequency: 720, duration: 0.08, type: 'triangle', gain: 0.045, rampTo: 960 },
  damage: { frequency: 140, duration: 0.18, type: 'sawtooth', gain: 0.06, rampTo: 96 },
  lowFuel: { frequency: 260, duration: 0.24, type: 'square', gain: 0.04, rampTo: 190 },
  cargoFull: { frequency: 430, duration: 0.16, type: 'square', gain: 0.04, rampTo: 430 },
  surface: { frequency: 520, duration: 0.22, type: 'sine', gain: 0.05, rampTo: 780 },
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext

  if (!AudioCtor) {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioCtor()
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return audioContext
}

export function playSound(cue: SoundCue): void {
  const context = getAudioContext()
  if (!context) {
    return
  }

  const { duration, frequency, gain, rampTo, type } = SOUND_MAP[cue]
  const startAt = context.currentTime
  const endAt = startAt + duration
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  if (typeof rampTo === 'number') {
    oscillator.frequency.linearRampToValueAtTime(rampTo, endAt)
  }

  gainNode.gain.setValueAtTime(0.0001, startAt)
  gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(startAt)
  oscillator.stop(endAt)
}
