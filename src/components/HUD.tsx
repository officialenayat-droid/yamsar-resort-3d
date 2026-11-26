import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, Flame, Mail, Moon, Sparkles, Sun, TreePine, Volume2, VolumeX, X } from 'lucide-react'
import { actions, useStore } from '../state/store'
import { ADVENTURES, type AdventureId, type CameraPreset } from '../data'
import { Crest } from '../svg/Illustrations'

const ICONS: Record<AdventureId, typeof Flame> = { bukhari: Flame, deodar: TreePine, star: Sparkles, kahwa: Coffee }

/** Global fixed HUD: brand, sound controls, tracker, book button. */
export function HUD() {
  const entered = useStore((s) => s.entered)
  const soundOn = useStore((s) => s.soundOn)
  const volume = useStore((s) => s.volume)
  if (!entered) return null
  return (
    <>
      <motion.header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-5"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <a href="#top" className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-parchment/90 py-1.5 pl-1.5 pr-4 shadow-lg backdrop-blur btn-pop">
          <Crest size={38} />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[15px] font-semibold text-pine">The Yamsar Resort</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-cedar">Kullan · Sonamarg</span>
          </span>
        </a>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-parchment/90 p-1 shadow-lg backdrop-blur">
            <button
              className={`grid h-9 w-9 place-items-center rounded-full btn-pop ${soundOn ? 'bg-pine text-parchment' : 'text-pine'}`}
              onClick={() => actions.toggleSound()}
              aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => actions.setVolume(Number(e.target.value))}
              className="slider hidden w-20 sm:block"
              aria-label="Volume"
              disabled={!soundOn}
            />
            <span className="w-1 sm:w-2" />
          </div>
          <button className="btn-primary btn-pop rounded-full px-4 py-2.5 text-sm font-semibold sm:px-5" onClick={() => actions.openBooking()}>
            Book a cabin
          </button>
        </div>
      </motion.header>
      <Tracker />
    </>
  )
}

function Tracker() {
  const found = useStore((s) => s.found)
  const open = useStore((s) => s.trackerOpen)
  const count = Object.values(found).filter(Boolean).length
  return (
    <div className="fixed bottom-3 right-3 z-40 sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {open && (
          <motion.div
            className="storycard absolute bottom-16 right-0 w-[min(88vw,320px)] rounded-3xl p-5"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-pine">Little Adventures</h3>
              <button onClick={() => actions.setTracker(false)} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <ol className="space-y-3">
              {ADVENTURES.map((a, i) => {
                const Icon = ICONS[a.id]
                const done = found[a.id]
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${done ? 'bg-saffron text-white' : 'bg-parchment-deep text-cedar'}`}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <div className={`text-sm font-semibold ${done ? 'text-pine line-through decoration-saffron/60' : 'text-ink'}`}>
                        {i + 1}. {a.title}
                      </div>
                      <div className="text-xs leading-snug text-ink/60">{a.hint}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <button
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold btn-pop ${count === 4 ? 'btn-primary' : 'border border-cedar/20 text-cedar'}`}
              onClick={() => actions.setPostcard(true)}
            >
              <Mail size={15} /> {count === 4 ? 'Open your keepsake postcard' : 'Peek at the postcard'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="flex items-center gap-3 rounded-full bg-parchment/95 py-2 pl-2 pr-4 shadow-xl backdrop-blur btn-pop"
        onClick={() => actions.setTracker(!open)}
        aria-expanded={open}
        aria-label={`${count} of 4 little adventures discovered`}
      >
        <span className="flex -space-x-1.5">
          {ADVENTURES.map((a) => {
            const Icon = ICONS[a.id]
            return (
              <motion.span
                key={a.id}
                animate={found[a.id] ? { scale: [1, 1.5, 1], rotate: [0, -15, 0] } : {}}
                transition={{ duration: 0.6 }}
                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-parchment ${found[a.id] ? 'bg-saffron text-white' : 'bg-parchment-deep text-cedar/60'}`}
              >
                <Icon size={13} />
              </motion.span>
            )
          })}
        </span>
        <span className="text-sm font-semibold text-pine">
          {count} of 4 <span className="hidden font-normal text-ink/60 sm:inline">Discovered</span>
        </span>
      </button>
    </div>
  )
}

/** In-hero world controls: day/night, camera presets, the pop-up trigger. */
export function WorldControls() {
  const night = useStore((s) => s.night)
  const camera = useStore((s) => s.camera)
  const entered = useStore((s) => s.entered)
  if (!entered) return null
  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'overview', label: 'Valley Overview' },
    { id: 'river', label: 'Riverfront Chalets' },
    { id: 'glacier', label: 'Glacier Ridge' },
  ]
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex flex-col items-center gap-3 px-3 sm:bottom-5 sm:flex-row sm:items-end sm:justify-between sm:px-5"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.6, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-parchment/90 p-1 shadow-lg backdrop-blur no-scrollbar">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => actions.setCamera(p.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:text-[13px] ${camera === p.id ? 'bg-pine text-parchment' : 'text-pine hover:bg-pine/10'}`}
            aria-pressed={camera === p.id}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="pointer-events-auto flex items-center gap-2 sm:mb-[68px]">
        <button
          onClick={() => actions.pop()}
          className="rounded-full border-2 border-parchment/80 bg-pine/85 px-4 py-2.5 text-xs font-semibold tracking-wide text-parchment shadow-lg backdrop-blur btn-pop sm:text-[13px]"
        >
          ▲ Pop Up The Himalayas
        </button>
        <button
          onClick={() => actions.setNight(!night)}
          className="relative flex h-11 w-[84px] items-center rounded-full p-1 shadow-lg transition-colors duration-700"
          style={{ background: night ? '#1d2742' : '#cfe3ee' }}
          aria-label={night ? 'Switch to day' : 'Switch to night'}
          aria-pressed={night}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className={`grid h-9 w-9 place-items-center rounded-full shadow ${night ? 'ml-auto bg-[#f4efdf] text-[#1d2742]' : 'bg-saffron text-white'}`}
          >
            {night ? <Moon size={17} /> : <Sun size={17} />}
          </motion.span>
        </button>
      </div>
    </motion.div>
  )
}

export function Toast() {
  const toast = useStore((s) => s.toast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="storycard flex max-w-sm items-start gap-3 rounded-2xl px-5 py-3.5"
            initial={{ y: -30, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="mt-0.5 text-saffron">✦</span>
            <div>
              <div className="font-display text-[15px] font-semibold text-pine">{toast.title}</div>
              {toast.body && <div className="text-xs text-ink/65">{toast.body}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
