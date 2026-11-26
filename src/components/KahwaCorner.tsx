import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Timer } from 'lucide-react'
import { RustamFox, Samovar } from '../svg/Illustrations'
import { actions, useStore } from '../state/store'
import { audio } from '../audio/AudioEngine'

type Ingredient = 'saffron' | 'cardamom' | 'almond'
type Phase = 'intro' | 'playing' | 'pour' | 'won' | 'lost'

const RECIPE: Record<Ingredient, { label: string; need: number; color: string }> = {
  saffron: { label: 'Saffron strands', need: 3, color: '#D96B27' },
  cardamom: { label: 'Crushed cardamom', need: 2, color: '#7f9a54' },
  almond: { label: 'Slivered almonds', need: 2, color: '#e3c595' },
}
const DURATION = 15

const LINES: Record<Phase, string> = {
  intro: 'Salaam! I’m Rustam. My samovar is coming to the boil. Help me brew a proper saffron kahwa before it bubbles over?',
  playing: 'Quick! Drag or tap each ingredient into the samovar: three saffron, two cardamom, two almonds.',
  pour: 'Wonderful, it smells of Pampore saffron fields! Now pour it into the cup.',
  won: 'Perfect kahwa! Golden, fragrant and warm. You brew like a true Kashmiri.',
  lost: 'Oh no, it boiled over! Never mind, the river gives us more water. Shall we try again?',
}

function IngredientIcon({ kind, size = 40 }: { kind: Ingredient; size?: number }) {
  if (kind === 'saffron')
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <path d="M20 36 C 18 26, 12 18, 8 6 M20 36 C 20 24, 20 16, 20 4 M20 36 C 22 26, 28 18, 32 6" stroke="#c4411c" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="8" cy="6" r="3" fill="#D96B27" />
        <circle cx="20" cy="4" r="3" fill="#D96B27" />
        <circle cx="32" cy="6" r="3" fill="#D96B27" />
      </svg>
    )
  if (kind === 'cardamom')
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <ellipse cx="14" cy="22" rx="8" ry="12" transform="rotate(-20 14 22)" fill="#8fae5e" stroke="#5e7a38" strokeWidth="2" />
        <ellipse cx="27" cy="20" rx="7" ry="11" transform="rotate(25 27 20)" fill="#7f9a54" stroke="#5e7a38" strokeWidth="2" />
        <circle cx="22" cy="30" r="2" fill="#3b2621" />
        <circle cx="18" cy="33" r="1.6" fill="#3b2621" />
      </svg>
    )
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <path d="M10 30 C 4 18, 14 6, 22 6 C 22 18, 18 28, 10 30 Z" fill="#e3c595" stroke="#a87d4a" strokeWidth="2" />
      <path d="M20 34 C 22 22, 30 12, 36 12 C 36 24, 30 32, 20 34 Z" fill="#edd5a8" stroke="#a87d4a" strokeWidth="2" />
    </svg>
  )
}

interface Flying {
  id: number
  kind: Ingredient
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export function KahwaCorner() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [counts, setCounts] = useState<Record<Ingredient, number>>({ saffron: 0, cardamom: 0, almond: 0 })
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [flying, setFlying] = useState<Flying[]>([])
  const [cupFill, setCupFill] = useState(0)
  const samovarRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const found = useStore((s) => s.found.kahwa)
  const uid = useRef(0)

  // countdown
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'pour') return
    const start = performance.now()
    const startLeft = timeLeft
    const iv = window.setInterval(() => {
      const left = Math.max(0, startLeft - (performance.now() - start) / 1000)
      setTimeLeft(left)
      if (Math.random() < 0.5) audio.bubble()
      if (left <= 0) {
        window.clearInterval(iv)
        setPhase('lost')
        audio.fail()
      }
    }, 200)
    return () => window.clearInterval(iv)
  }, [phase])

  const total = counts.saffron + counts.cardamom + counts.almond
  const complete = (Object.keys(RECIPE) as Ingredient[]).every((k) => counts[k] >= RECIPE[k].need)

  useEffect(() => {
    if (phase === 'playing' && complete) {
      setPhase('pour')
      audio.chime(0, 0.6)
    }
  }, [complete, phase])

  const start = () => {
    setCounts({ saffron: 0, cardamom: 0, almond: 0 })
    setTimeLeft(DURATION)
    setCupFill(0)
    setPhase('playing')
    audio.pop(1)
  }

  const add = (kind: Ingredient, fromEl?: HTMLElement | null) => {
    if (phase !== 'playing') return
    if (counts[kind] >= RECIPE[kind].need) {
      audio.tap()
      return
    }
    setCounts((c) => ({ ...c, [kind]: c[kind] + 1 }))
    audio.drop()
    // fly an ingredient from the jar into the samovar
    const stage = stageRef.current?.getBoundingClientRect()
    const sam = samovarRef.current?.getBoundingClientRect()
    const fr = fromEl?.getBoundingClientRect()
    if (stage && sam) {
      const from = fr ? { x: fr.left + fr.width / 2 - stage.left, y: fr.top + fr.height / 2 - stage.top } : { x: sam.left - stage.left, y: 0 }
      const to = { x: sam.left + sam.width / 2 - stage.left, y: sam.top + sam.height * 0.24 - stage.top }
      const f: Flying = { id: ++uid.current, kind, from, to }
      setFlying((a) => [...a, f])
      window.setTimeout(() => setFlying((a) => a.filter((q) => q.id !== f.id)), 700)
    }
  }

  const onDragEnd = (kind: Ingredient, point: { x: number; y: number }, el: HTMLElement | null) => {
    const r = samovarRef.current?.getBoundingClientRect()
    if (!r) return
    if (point.x > r.left && point.x < r.right && point.y > r.top && point.y < r.bottom) add(kind, el)
  }

  const pour = () => {
    if (phase !== 'pour') return
    audio.pour()
    setCupFill(1)
    window.setTimeout(() => {
      setPhase('won')
      audio.success()
      actions.discover('kahwa')
    }, 1500)
  }

  const mood = phase === 'lost' ? 'worried' : phase === 'won' ? 'proud' : 'happy'
  const urgent = timeLeft < 5 && (phase === 'playing' || phase === 'pour')

  return (
    <section id="kahwa" className="relative overflow-hidden bg-pine py-24 text-parchment">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'var(--paper-noise)' }} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-saffron">Little adventure · Rustam’s Kahwa Corner</p>
          <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Brew with Rustam</h2>
          <p className="mt-4 text-lg text-parchment/80">
            Every afternoon our resident fox host sets the copper samovar going by the deodars. Get the saffron, cardamom and almonds in before it
            boils over. You have fifteen seconds.
          </p>
        </div>

        <div ref={stageRef} className="relative grid items-center gap-8 rounded-[2rem] border border-parchment/15 bg-pine-soft/60 p-5 sm:p-8 md:grid-cols-[1fr_1.1fr_1fr]">
          {/* Rustam + speech */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <motion.div
              key={phase}
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="relative max-w-xs rounded-2xl bg-parchment p-4 text-[15px] leading-snug text-ink shadow-xl"
            >
              {LINES[phase]}
              <span className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-parchment" />
            </motion.div>
            <RustamFox mood={mood} className="bob h-56 w-auto drop-shadow-xl sm:h-64" />
          </div>

          {/* Samovar */}
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2 font-display text-2xl" aria-live="polite">
              <Timer size={20} className={urgent ? 'text-saffron' : 'text-parchment/70'} />
              <span className={urgent ? 'text-saffron' : ''}>{phase === 'playing' || phase === 'pour' ? `${timeLeft.toFixed(1)}s` : `${DURATION}s`}</span>
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-parchment/15">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${(timeLeft / DURATION) * 100}%`, background: urgent ? '#D96B27' : '#2B7A78' }}
              />
            </div>
            <motion.div
              ref={samovarRef}
              className="relative mt-4 w-48 sm:w-56"
              animate={urgent ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
              transition={urgent ? { repeat: Infinity, duration: 0.4 } : {}}
            >
              <Samovar boiling={phase === 'playing' || phase === 'pour'} tint={Math.min(1, total / 7)} className="w-full" />
              {phase === 'pour' && (
                <button onClick={pour} className="btn-primary btn-pop absolute -right-4 bottom-14 rounded-full px-4 py-2 text-sm font-semibold sm:-right-10">
                  Pour ☕
                </button>
              )}
            </motion.div>
            {/* cup */}
            <div className="relative -mt-6 ml-28 h-14 w-16">
              <svg viewBox="0 0 64 56" className="h-full w-full" aria-hidden>
                <path d="M6 10 H52 L46 46 H12 Z" fill="#f4efe6" stroke="#c7956a" strokeWidth="2" />
                <clipPath id="cup-clip">
                  <path d="M8 12 H50 L45 44 H13 Z" />
                </clipPath>
                <rect
                  x="0"
                  y={44 - 32 * cupFill}
                  width="64"
                  height="40"
                  fill="#e0a13a"
                  clipPath="url(#cup-clip)"
                  style={{ transition: 'y 1.4s ease-in-out' }}
                />
                <path d="M52 18 C 64 18, 64 34, 49 34" stroke="#c7956a" strokeWidth="3" fill="none" />
                <ellipse cx="29" cy="50" rx="26" ry="4" fill="#c7956a" opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Ingredients */}
          <div className="flex flex-col gap-3">
            {(Object.keys(RECIPE) as Ingredient[]).map((k) => {
              const r = RECIPE[k]
              const done = counts[k] >= r.need
              return (
                <div key={k} className="flex items-center gap-3 rounded-2xl bg-parchment/95 p-3 text-ink">
                  <motion.button
                    drag={phase === 'playing' && !done}
                    dragSnapToOrigin
                    dragElastic={0.8}
                    whileDrag={{ scale: 1.2, zIndex: 50 }}
                    whileTap={{ scale: 0.9 }}
                    onDragEnd={(e, info) => {
                      const pe = e as PointerEvent
                      const pt = typeof pe.clientX === 'number' ? { x: pe.clientX, y: pe.clientY } : { x: info.point.x - window.scrollX, y: info.point.y - window.scrollY }
                      onDragEnd(k, pt, e.target as HTMLElement)
                    }}
                    onTap={(e) => add(k, e.target as HTMLElement)}
                    disabled={phase !== 'playing' || done}
                    className={`relative grid h-16 w-16 shrink-0 cursor-grab touch-none place-items-center rounded-xl border-2 ${done ? 'border-glacier bg-glacier/10' : 'border-cedar/30 bg-white'} disabled:cursor-default`}
                    aria-label={`Add ${r.label}`}
                  >
                    <IngredientIcon kind={k} />
                  </motion.button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="mt-1 flex gap-1.5">
                      {Array.from({ length: r.need }).map((_, i) => (
                        <span key={i} className="h-2.5 w-6 rounded-full transition-colors" style={{ background: i < counts[k] ? r.color : '#e1d7c6' }} />
                      ))}
                    </div>
                  </div>
                  <span className="font-display text-lg text-cedar">
                    {counts[k]}/{r.need}
                  </span>
                </div>
              )
            })}
            <div className="mt-2">
              {(phase === 'intro' || phase === 'lost') && (
                <button onClick={start} className="btn-primary btn-pop w-full rounded-full px-6 py-3.5 font-semibold">
                  {phase === 'lost' ? (
                    <span className="inline-flex items-center gap-2">
                      <RotateCcw size={16} /> Try again
                    </span>
                  ) : (
                    'Start brewing (15s)'
                  )}
                </button>
              )}
              {phase === 'won' && (
                <div className="flex flex-col gap-2">
                  <div className="rounded-2xl bg-saffron/15 p-3 text-center text-sm text-parchment">
                    {found ? '✦ Adventure stamped in your keepsake tracker' : ''}
                  </div>
                  <button onClick={start} className="w-full rounded-full border border-parchment/30 px-6 py-3 text-sm font-semibold btn-pop">
                    Brew another cup
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* flying ingredients */}
          <AnimatePresence>
            {flying.map((f) => (
              <motion.div
                key={f.id}
                className="pointer-events-none absolute z-40"
                style={{ left: 0, top: 0 }}
                initial={{ x: f.from.x - 18, y: f.from.y - 18, scale: 1, rotate: 0, opacity: 1 }}
                animate={{ x: [f.from.x - 18, (f.from.x + f.to.x) / 2 - 18, f.to.x - 18], y: [f.from.y - 18, Math.min(f.from.y, f.to.y) - 90, f.to.y - 18], scale: [1, 1.2, 0.5], rotate: 200, opacity: [1, 1, 0] }}
                transition={{ duration: 0.65, ease: 'easeIn' }}
              >
                <IngredientIcon kind={f.kind} size={36} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
