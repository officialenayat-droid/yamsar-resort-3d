/**
 * AudioEngine — a fully procedural Web Audio soundscape for The Yamsar Resort.
 * No audio files: every sound (river, wind, birds, santoor, bukhari fire, pops,
 * chimes, splashes) is synthesised from oscillators and generated noise buffers.
 *
 * Signal graph:
 *   ambienceBus (river + wind) ─┐
 *   dayBus (birds) ─────────────┤
 *   nightBus (santoor) ─────────┼─► master ─► compressor ─► destination
 *   fireBus (bukhari) ──────────┤      ▲
 *   sfxBus (UI + world fx) ─────┘      └── reverb (generated impulse) ◄─ sends
 */

type NoiseKind = 'white' | 'pink' | 'brown'

// D-major pentatonic (Pahadi flavour) for santoor phrases
const SANTOOR_SCALE = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0]

class AudioEngineImpl {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private reverb!: ConvolverNode
  private reverbSend!: GainNode
  private ambienceBus!: GainNode
  private dayBus!: GainNode
  private nightBus!: GainNode
  private fireBus!: GainNode
  private sfxBus!: GainNode
  private noise: Partial<Record<NoiseKind, AudioBuffer>> = {}
  private timer: number | null = null
  private muted = false
  private volume = 0.7
  private night = false
  private fireLevel = 0
  private lastTap = 0

  get ready() {
    return this.ctx !== null
  }

  /** Must be called from a user gesture (click/tap). Safe to call repeatedly. */
  init() {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.knee.value = 12
    comp.ratio.value = 3.5
    comp.connect(ctx.destination)

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(comp)

    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.makeImpulse(3.2, 2.6)
    const reverbOut = ctx.createGain()
    reverbOut.gain.value = 0.55
    this.reverb.connect(reverbOut).connect(this.master)
    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 1
    this.reverbSend.connect(this.reverb)

    const bus = (v: number) => {
      const g = ctx.createGain()
      g.gain.value = v
      g.connect(this.master)
      return g
    }
    this.ambienceBus = bus(1)
    this.dayBus = bus(this.night ? 0 : 1)
    this.nightBus = bus(this.night ? 1 : 0)
    this.fireBus = bus(0)
    this.sfxBus = bus(0.9)
    this.dayBus.connect(this.reverbSend)
    this.nightBus.connect(this.reverbSend)

    this.noise.white = this.makeNoise('white', 4)
    this.noise.pink = this.makeNoise('pink', 6)
    this.noise.brown = this.makeNoise('brown', 6)

    this.startRiver()
    this.startWind()
    this.startFireBed()
    this.applyFire()

    if (!this.muted) this.ramp(this.master.gain, this.volume, 2.5)
    this.timer = window.setInterval(() => this.tick(), 200)
    void ctx.resume()
  }

  // ───────────────────────── controls ─────────────────────────
  setMuted(m: boolean) {
    this.muted = m
    if (!this.ctx) return
    this.ramp(this.master.gain, m ? 0 : this.volume, 0.4)
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (!this.ctx || this.muted) return
    this.ramp(this.master.gain, this.volume, 0.15)
  }

  setNight(n: boolean) {
    this.night = n
    if (!this.ctx) return
    this.ramp(this.dayBus.gain, n ? 0 : 1, 2.5)
    this.ramp(this.nightBus.gain, n ? 1 : 0, 2.5)
    this.applyFire()
  }

  /** 0..1 — how many bukhari stoves are crackling nearby. */
  setFireLevel(level: number) {
    this.fireLevel = Math.max(0, Math.min(1, level))
    this.applyFire()
  }

  private applyFire() {
    if (!this.ctx) return
    const target = Math.min(1, (this.night ? 0.45 : 0) + this.fireLevel * 0.8)
    this.ramp(this.fireBus.gain, target, 1.5)
  }

  private get active() {
    return !!this.ctx && !this.muted && this.ctx.state === 'running'
  }

  // ───────────────────────── ambience beds ─────────────────────────
  private loopNoise(kind: NoiseKind) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise[kind]!
    src.loop = true
    src.loopStart = Math.random()
    src.start(0, Math.random() * 2)
    return src
  }

  private lfo(freq: number, depth: number, target: AudioParam, type: OscillatorType = 'sine') {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = depth
    o.connect(g).connect(target)
    o.start()
  }

  /** Sindh River: low brown-noise rush + sparkly bandpassed white noise. */
  private startRiver() {
    const ctx = this.ctx!
    const body = this.loopNoise('brown')
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 850
    const bodyGain = ctx.createGain()
    bodyGain.gain.value = 0.32
    body.connect(lp).connect(bodyGain).connect(this.ambienceBus)
    this.lfo(0.11, 0.06, bodyGain.gain)

    const sparkle = this.loopNoise('white')
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 0.8
    const spGain = ctx.createGain()
    spGain.gain.value = 0.035
    sparkle.connect(bp).connect(spGain).connect(this.ambienceBus)
    this.lfo(0.37, 0.015, spGain.gain)
    this.lfo(0.05, 600, bp.frequency)
  }

  /** Alpine pine breeze: pink noise through a slowly sweeping bandpass. */
  private startWind() {
    const ctx = this.ctx!
    const src = this.loopNoise('pink')
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 520
    bp.Q.value = 1.4
    const g = ctx.createGain()
    g.gain.value = 0.11
    src.connect(bp).connect(g).connect(this.ambienceBus)
    this.lfo(0.063, 320, bp.frequency)
    this.lfo(0.041, 0.07, g.gain)
  }

  /** Warm low rumble of a wood stove — crackles are added in tick(). */
  private startFireBed() {
    const ctx = this.ctx!
    const src = this.loopNoise('brown')
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 240
    const g = ctx.createGain()
    g.gain.value = 0.35
    src.connect(lp).connect(g).connect(this.fireBus)
    this.lfo(0.9, 0.12, g.gain, 'triangle')
  }

  // ───────────────────────── scheduler ─────────────────────────
  private tick() {
    if (!this.active) return
    if (!this.night && Math.random() < 0.045) this.birdPhrase()
    if (this.night && Math.random() < 0.05) this.santoorPhrase()
    const crackleRate = (this.night ? 0.35 : 0) + this.fireLevel * 1.4
    let n = crackleRate
    while (n > 0) {
      if (Math.random() < Math.min(1, n) * 0.55) this.crackle(Math.random() * 0.18)
      n -= 1
    }
  }

  private birdPhrase() {
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.02
    const base = 2600 + Math.random() * 1800
    const chirps = 2 + Math.floor(Math.random() * 4)
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.6 - 0.8
    pan.connect(this.dayBus)
    for (let i = 0; i < chirps; i++) {
      const st = t + i * (0.08 + Math.random() * 0.06)
      const o = ctx.createOscillator()
      o.type = 'sine'
      const f = base * (1 + (Math.random() - 0.5) * 0.15)
      o.frequency.setValueAtTime(f, st)
      o.frequency.exponentialRampToValueAtTime(f * (1.25 + Math.random() * 0.3), st + 0.035)
      o.frequency.exponentialRampToValueAtTime(f * 0.9, st + 0.075)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, st)
      g.gain.linearRampToValueAtTime(0.045, st + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.085)
      o.connect(g).connect(pan)
      o.start(st)
      o.stop(st + 0.1)
    }
  }

  /** Hammered-dulcimer style pluck: detuned string course + bright transient. */
  private santoorNote(freq: number, when: number, vel = 1, dest?: AudioNode) {
    const ctx = this.ctx!
    const out = ctx.createGain()
    out.gain.setValueAtTime(0, when)
    out.gain.linearRampToValueAtTime(0.11 * vel, when + 0.004)
    out.gain.exponentialRampToValueAtTime(0.0001, when + 2.2)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(7000, when)
    lp.frequency.exponentialRampToValueAtTime(1400, when + 0.8)
    lp.connect(out).connect(dest ?? this.nightBus)
    const detunes = [-6, 0, 5]
    for (const d of detunes) {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = freq
      o.detune.value = d
      o.connect(lp)
      o.start(when)
      o.stop(when + 2.3)
    }
    const h = ctx.createOscillator()
    h.type = 'sine'
    h.frequency.value = freq * 3.01
    const hg = ctx.createGain()
    hg.gain.setValueAtTime(0.04 * vel, when)
    hg.gain.exponentialRampToValueAtTime(0.0001, when + 0.4)
    h.connect(hg).connect(lp)
    h.start(when)
    h.stop(when + 0.45)
  }

  private santoorPhrase() {
    const ctx = this.ctx!
    let t = ctx.currentTime + 0.05
    let idx = Math.floor(Math.random() * 5)
    const len = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < len; i++) {
      const f = SANTOOR_SCALE[idx]
      this.santoorNote(f, t, 0.6 + Math.random() * 0.4)
      if (Math.random() < 0.3) this.santoorNote(f, t + 0.07, 0.4) // tremolo re-strike
      t += 0.16 + Math.random() * 0.22
      idx = Math.max(0, Math.min(SANTOOR_SCALE.length - 1, idx + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))))
    }
  }

  private crackle(delay = 0) {
    const ctx = this.ctx!
    const t = ctx.currentTime + delay
    const src = ctx.createBufferSource()
    src.buffer = this.noise.white!
    const dur = 0.004 + Math.random() * 0.025
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1200 + Math.random() * 3000
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.06 + Math.random() * 0.22, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(hp).connect(g).connect(this.fireBus)
    src.start(t, Math.random() * 3, dur + 0.01)
  }

  // ───────────────────────── one-shot SFX ─────────────────────────
  /** Soft wooden pop (pitch drop + knock). */
  pop(pitch = 1, delay = 0, vol = 1) {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime + delay
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(560 * pitch, t)
    o.frequency.exponentialRampToValueAtTime(130 * pitch, t + 0.09)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.42 * vol, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(g).connect(this.sfxBus)
    o.start(t)
    o.stop(t + 0.18)

    const k = ctx.createOscillator()
    k.type = 'triangle'
    k.frequency.setValueAtTime(1500 * pitch, t)
    const kg = ctx.createGain()
    kg.gain.setValueAtTime(0.12 * vol, t)
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    k.connect(kg).connect(this.sfxBus)
    k.start(t)
    k.stop(t + 0.04)
    this.noiseBurst('white', t, 0.025, 'bandpass', 1900, 0.09 * vol, 2)
  }

  /** Mountain wind chime — inharmonic bell partials into the reverb. */
  chime(delay = 0, vol = 1) {
    if (!this.active) return
    const ctx = this.ctx!
    const notes = [1174.66, 1479.98, 880, 1318.51, 1760]
    notes.forEach((f, i) => {
      const t = ctx.currentTime + delay + i * (0.09 + Math.random() * 0.08)
      for (const [mult, amp, dec] of [
        [1, 0.05, 2.6],
        [2.76, 0.018, 1.2],
        [5.4, 0.008, 0.6],
      ] as const) {
        const o = ctx.createOscillator()
        o.type = 'sine'
        o.frequency.value = f * mult
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(amp * vol, t + 0.004)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dec)
        o.connect(g)
        g.connect(this.sfxBus)
        g.connect(this.reverbSend)
        o.start(t)
        o.stop(t + dec + 0.05)
      }
    })
  }

  /** The signature pop-up reveal: wind gust + cascade of wooden pops + chime. */
  popReveal() {
    if (!this.active) return
    this.gust(0, 1.8, 0.16)
    const steps = [0, 0.14, 0.3, 0.42, 0.58, 0.72, 0.9, 1.05, 1.2]
    steps.forEach((d, i) => this.pop(0.8 + (i % 4) * 0.12 + Math.random() * 0.06, d, 0.8))
    this.chime(0.95, 1)
  }

  gust(delay = 0, dur = 1.5, vol = 0.12) {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime + delay
    const src = ctx.createBufferSource()
    src.buffer = this.noise.pink!
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.1
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(1600, t + dur * 0.5)
    bp.frequency.exponentialRampToValueAtTime(500, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(bp).connect(g).connect(this.sfxBus)
    src.start(t, Math.random() * 3, dur + 0.1)
  }

  /** Tiny wooden tap for hovers — throttled. */
  tap() {
    if (!this.active) return
    const nowMs = performance.now()
    if (nowMs - this.lastTap < 70) return
    this.lastTap = nowMs
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(1100 + Math.random() * 200, t)
    o.frequency.exponentialRampToValueAtTime(650, t + 0.03)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.06, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    o.connect(g).connect(this.sfxBus)
    o.start(t)
    o.stop(t + 0.06)
  }

  click() {
    this.pop(1.25, 0, 0.55)
  }

  splash() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.noise.white!
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 0.9
    bp.frequency.setValueAtTime(2600, t)
    bp.frequency.exponentialRampToValueAtTime(420, t + 0.5)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    src.connect(bp).connect(g).connect(this.sfxBus)
    g.connect(this.reverbSend)
    src.start(t, Math.random() * 3, 0.7)
    // droplet bloops
    for (let i = 0; i < 4; i++) {
      const st = t + 0.08 + i * 0.07 + Math.random() * 0.05
      const o = ctx.createOscillator()
      o.type = 'sine'
      const f = 900 + Math.random() * 900
      o.frequency.setValueAtTime(f, st)
      o.frequency.exponentialRampToValueAtTime(f * 2.1, st + 0.05)
      const dg = ctx.createGain()
      dg.gain.setValueAtTime(0.07, st)
      dg.gain.exponentialRampToValueAtTime(0.0001, st + 0.07)
      o.connect(dg).connect(this.sfxBus)
      o.start(st)
      o.stop(st + 0.08)
    }
  }

  rustle() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.noise.pink!
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 0.6
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    for (let i = 0; i < 10; i++) {
      g.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.22, t + 0.05 + i * 0.08)
      g.gain.linearRampToValueAtTime(0.02, t + 0.09 + i * 0.08)
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
    src.connect(bp).connect(g).connect(this.sfxBus)
    src.start(t, Math.random() * 3, 1.3)
    // soft snow "shhh" falling
    this.noiseBurst('pink', t + 0.4, 1.4, 'highpass', 5000, 0.05)
  }

  /** Snow-leopard cub chuff. */
  chuff() {
    if (!this.active) return
    const ctx = this.ctx!
    for (let i = 0; i < 2; i++) {
      const t = ctx.currentTime + i * 0.16
      this.noiseBurst('brown', t, 0.12, 'bandpass', 500, 0.35, 1.5)
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.setValueAtTime(240, t)
      o.frequency.exponentialRampToValueAtTime(150, t + 0.1)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.08, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
      o.connect(g).connect(this.sfxBus)
      o.start(t)
      o.stop(t + 0.14)
    }
  }

  whoosh(vol = 0.12) {
    this.gust(0, 1.1, vol)
  }

  /** Discovery fanfare: ascending santoor arpeggio + chime. */
  discover() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.02
    ;[293.66, 369.99, 440, 587.33, 739.99].forEach((f, i) => this.santoorNote(f, t + i * 0.09, 1, this.sfxBus))
    this.chime(0.4, 0.8)
  }

  sparkle() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    for (let i = 0; i < 8; i++) {
      const st = t + i * 0.045
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = 1800 + i * 260 + Math.random() * 100
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.05, st)
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.35)
      o.connect(g)
      g.connect(this.sfxBus)
      g.connect(this.reverbSend)
      o.start(st)
      o.stop(st + 0.4)
    }
  }

  /** Bukhari ignition: match strike, whoomph of air, then crackles. */
  ignite() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    this.noiseBurst('white', t, 0.12, 'highpass', 3000, 0.18)
    const src = ctx.createBufferSource()
    src.buffer = this.noise.brown!
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(150, t + 0.1)
    lp.frequency.exponentialRampToValueAtTime(2400, t + 0.5)
    lp.frequency.exponentialRampToValueAtTime(400, t + 1.4)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t + 0.1)
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.45)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
    src.connect(lp).connect(g).connect(this.sfxBus)
    src.start(t + 0.1, Math.random() * 3, 1.6)
    for (let i = 0; i < 14; i++) this.crackle(0.3 + Math.random() * 1.4)
  }

  bubble() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime + Math.random() * 0.05
    const o = ctx.createOscillator()
    o.type = 'sine'
    const f = 180 + Math.random() * 160
    o.frequency.setValueAtTime(f, t)
    o.frequency.exponentialRampToValueAtTime(f * 3, t + 0.06)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.09, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
    o.connect(g).connect(this.sfxBus)
    o.start(t)
    o.stop(t + 0.1)
  }

  drop() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(820, t)
    o.frequency.exponentialRampToValueAtTime(170, t + 0.13)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.25, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    o.connect(g).connect(this.sfxBus)
    o.start(t)
    o.stop(t + 0.2)
    this.noiseBurst('white', t + 0.02, 0.08, 'bandpass', 1400, 0.08, 1.5)
  }

  pour() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    this.noiseBurst('white', t, 1.6, 'bandpass', 1100, 0.12, 2.5)
    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.bubble(), 100 + i * 140)
    }
  }

  stamp() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(48, t + 0.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    o.connect(g).connect(this.sfxBus)
    o.start(t)
    o.stop(t + 0.3)
    this.noiseBurst('brown', t, 0.12, 'lowpass', 900, 0.4)
  }

  paper() {
    if (!this.active) return
    const t = this.ctx!.currentTime
    this.noiseBurst('pink', t, 0.28, 'bandpass', 2400, 0.12, 0.7)
  }

  fail() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    ;[440, 369.99, 293.66].forEach((f, i) => this.santoorNote(f, t + i * 0.16, 0.8, this.sfxBus))
  }

  success() {
    if (!this.active) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    ;[293.66, 369.99, 440, 587.33, 440, 587.33, 739.99, 880].forEach((f, i) =>
      this.santoorNote(f, t + i * 0.11, 0.9, this.sfxBus),
    )
    this.chime(0.8, 0.9)
  }

  // ───────────────────────── helpers ─────────────────────────
  private noiseBurst(
    kind: NoiseKind,
    t: number,
    dur: number,
    filter: BiquadFilterType,
    freq: number,
    vol: number,
    q = 1,
  ) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise[kind]!
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.01, dur * 0.2))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(this.sfxBus)
    src.start(t, Math.random() * 3, dur + 0.05)
  }

  private ramp(p: AudioParam, v: number, time: number) {
    const ctx = this.ctx!
    const t = ctx.currentTime
    p.cancelScheduledValues(t)
    p.setValueAtTime(p.value, t)
    p.linearRampToValueAtTime(v, t + time)
  }

  private makeNoise(kind: NoiseKind, seconds: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        if (kind === 'white') d[i] = w
        else if (kind === 'pink') {
          // Paul Kellet's refined pink-noise filter
          b0 = 0.99886 * b0 + w * 0.0555179
          b1 = 0.99332 * b1 + w * 0.0750759
          b2 = 0.969 * b2 + w * 0.153852
          b3 = 0.8665 * b3 + w * 0.3104856
          b4 = 0.55 * b4 + w * 0.5329522
          b5 = -0.7616 * b5 - w * 0.016898
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
          b6 = w * 0.115926
        } else {
          last = (last + 0.02 * w) / 1.02
          d[i] = last * 3.5
        }
      }
      // crossfade the loop seam
      const fade = Math.floor(ctx.sampleRate * 0.05)
      for (let i = 0; i < fade; i++) {
        const k = i / fade
        d[i] = d[i] * k + d[len - fade + i] * (1 - k)
      }
    }
    return buf
  }

  private makeImpulse(seconds: number, decay: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return buf
  }

  dispose() {
    if (this.timer) clearInterval(this.timer)
    void this.ctx?.close()
    this.ctx = null
  }
}

export const audio = new AudioEngineImpl()
export type AudioEngine = AudioEngineImpl
