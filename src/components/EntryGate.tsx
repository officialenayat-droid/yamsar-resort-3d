import { AnimatePresence, motion } from 'framer-motion'
import { Headphones } from 'lucide-react'
import { Crest } from '../svg/Illustrations'
import { actions, useStore } from '../state/store'

/** "Listen to Yamsar" — the parchment sensory gate that unlocks Web Audio. */
export function EntryGate() {
  const entered = useStore((s) => s.entered)
  return (
    <AnimatePresence>
      {!entered && (
        <motion.div
          key="gate"
          className="paper paper-vignette fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6"
          exit={{ y: '-100%', rotateX: 25, opacity: 0.6 }}
          transition={{ duration: 1.1, ease: [0.7, 0, 0.3, 1] }}
          style={{ transformOrigin: 'top center' }}
        >
          {/* deckled corner flourishes */}
          <svg className="pointer-events-none absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
            <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="#6E473B" strokeOpacity="0.35" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
            <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke="#6E473B" strokeOpacity="0.2" strokeWidth="0.3" strokeDasharray="1 1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60" aria-hidden>
            <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0 160 L120 70 L200 110 L330 30 L450 120 L560 60 L700 130 L820 50 L960 120 L1080 70 L1200 120 V160 Z" fill="#1C352D" opacity="0.12" />
              <path d="M0 160 L90 110 L240 140 L380 90 L520 140 L660 100 L800 150 L940 100 L1100 140 L1200 110 V160 Z" fill="#1C352D" opacity="0.15" />
            </svg>
          </div>

          <div className="relative flex max-w-xl flex-col items-center text-center">
            <motion.div initial={{ scale: 0.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 11, delay: 0.15 }}>
              <Crest size={196} className="drop-shadow-[0_14px_20px_rgba(110,71,59,0.25)]" />
            </motion.div>
            <motion.p
              className="mt-7 text-xs font-semibold uppercase tracking-[0.4em] text-glacier"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Listen to Yamsar
            </motion.p>
            <motion.h1
              className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-pine sm:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              Suddenly, <em className="font-normal text-cedar">the Himalayas rise.</em>
            </motion.h1>
            <motion.p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
              A storybook valley of cedar cabins, glacier light and the rushing Sindh River in Kullan, Sonamarg. It’s best explored with sound.
            </motion.p>
            <motion.div className="mt-9 flex flex-col items-center gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
              <button
                onClick={() => actions.enter(true)}
                className="btn-primary btn-pop inline-flex items-center gap-3 rounded-full px-9 py-4 text-sm font-bold tracking-[0.25em]"
                autoFocus
              >
                <Headphones size={18} /> ENTER WITH SOUND
              </button>
              <button onClick={() => actions.enter(false)} className="font-display text-[15px] italic text-cedar underline decoration-cedar/30 underline-offset-4 hover:decoration-cedar">
                Continue without sound
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
