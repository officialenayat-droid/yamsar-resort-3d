import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Printer, Repeat2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { PostcardArt } from '../svg/Illustrations'
import { actions, useStore } from '../state/store'
import { ADVENTURES } from '../data'
import { audio } from '../audio/AudioEngine'

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

function Stamp() {
  return (
    <svg viewBox="0 0 120 140" className="h-full w-full" aria-label="Snow leopard postage stamp">
      <defs>
        <mask id="perf">
          <rect width="120" height="140" fill="#fff" />
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <circle cx={6 + i * 13.5} cy="0" r="4" fill="#000" />
              <circle cx={6 + i * 13.5} cy="140" r="4" fill="#000" />
            </g>
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i}>
              <circle cx="0" cy={6 + i * 13} r="4" fill="#000" />
              <circle cx="120" cy={6 + i * 13} r="4" fill="#000" />
            </g>
          ))}
        </mask>
      </defs>
      <g mask="url(#perf)">
        <rect width="120" height="140" fill="#fbf7ef" />
        <rect x="9" y="9" width="102" height="122" fill="#2B7A78" />
        <path d="M9 100 L36 62 L52 78 L72 48 L111 100 V131 H9 Z" fill="#e8eef0" />
        <path d="M72 48 L80 60 L72 58 L66 62 Z M36 62 L42 71 L36 69 L31 72 Z" fill="#fff" />
        <rect x="9" y="104" width="102" height="27" fill="#1C352D" />
        {/* snow leopard cub */}
        <ellipse cx="60" cy="102" rx="20" ry="16" fill="#e9e5dc" />
        <path d="M44 92 l4 -12 l8 8 Z M76 92 l-4 -12 l-8 8 Z" fill="#cfc8bb" />
        <circle cx="53" cy="99" r="2.6" fill="#2b241f" />
        <circle cx="67" cy="99" r="2.6" fill="#2b241f" />
        <ellipse cx="60" cy="106" rx="3" ry="2" fill="#d9908a" />
        {[
          [50, 90],
          [70, 92],
          [60, 88],
          [46, 104],
          [74, 106],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#3b3532" />
        ))}
        <text x="60" y="28" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="#fbf7ef">
          ₹ 25
        </text>
        <text x="60" y="125" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="7" letterSpacing="2" fill="#fbf7ef">
          SONAMARG
        </text>
      </g>
    </svg>
  )
}

function Postmark() {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden>
      <defs>
        <path id="pm-arc" d="M 20 70 A 50 50 0 0 1 120 70" />
        <path id="pm-arc2" d="M 24 78 A 46 46 0 0 0 116 78" />
      </defs>
      <g fill="none" stroke="#6E473B" strokeWidth="2.4" opacity="0.8">
        <circle cx="70" cy="70" r="60" />
        <circle cx="70" cy="70" r="40" />
      </g>
      <text fill="#6E473B" opacity="0.85" fontFamily="var(--font-sans)" fontWeight="700" fontSize="10" letterSpacing="3" textAnchor="middle">
        <textPath href="#pm-arc" startOffset="50%">KULLAN · SONAMARG</textPath>
      </text>
      <text fill="#6E473B" opacity="0.85" fontFamily="var(--font-sans)" fontWeight="700" fontSize="9" letterSpacing="3" textAnchor="middle">
        <textPath href="#pm-arc2" startOffset="50%">KASHMIR</textPath>
      </text>
      <text x="70" y="74" textAnchor="middle" fill="#6E473B" opacity="0.85" fontFamily="var(--font-sans)" fontWeight="700" fontSize="11">
        {today()}
      </text>
    </svg>
  )
}

function Back({ stamped }: { stamped: boolean }) {
  return (
    <div className="paper relative grid h-full grid-cols-[1.15fr_1fr] gap-4 p-5 sm:p-7">
      <div className="flex flex-col border-r border-cedar/25 pr-4">
        <p className="font-hand text-[clamp(16px,2.6vw,26px)] leading-snug text-pine">
          Dear you,
          <br />
          I lit a Bukhari, shook the snow off a deodar (and met a shy leopard cub!), caught a shooting star over Thajiwas and brewed saffron kahwa with
          a fox called Rustam.
          <br />
          The Sindh never stops singing here.
        </p>
        <p className="mt-auto font-hand text-[clamp(16px,2.4vw,24px)] text-cedar">With love from Kullan ✦</p>
      </div>
      <div className="relative flex flex-col">
        <div className="ml-auto aspect-[6/7] w-[38%]">
          <Stamp />
        </div>
        <AnimatePresence>
          {stamped && (
            <motion.div
              className="absolute right-[18%] top-[6%] aspect-square w-[46%]"
              initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: -12 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.5 }}
              onAnimationStart={() => window.setTimeout(() => audio.stamp(), 600)}
            >
              <Postmark />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-auto space-y-4 pb-2 font-hand text-[clamp(14px,2.2vw,22px)] text-ink/80">
          <div className="border-b border-cedar/35 pb-1">To: a fellow wanderer</div>
          <div className="border-b border-cedar/35 pb-1">wherever the river takes you</div>
          <div className="border-b border-cedar/35 pb-1 text-[0.8em] text-cedar">The Yamsar Resort · Kullan, Sonamarg</div>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.3em] text-cedar/60">Little Adventures Keepsake · No. 4 of 4</div>
    </div>
  )
}

export function PostcardModal() {
  const open = useStore((s) => s.postcardOpen)
  const found = useStore((s) => s.found)
  const count = Object.values(found).filter(Boolean).length
  const unlocked = count === 4
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (!open) return
    setFlipped(false)
    if (!unlocked) return
    // flip over to reveal the stamping moment
    const t = window.setTimeout(() => {
      setFlipped(true)
      audio.paper()
    }, 1400)
    return () => window.clearTimeout(t)
  }, [open, unlocked])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="postcard"
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => actions.setPostcard(false)}
          >
            <motion.div
              className="w-full max-w-3xl"
              initial={{ y: 60, rotate: -6, scale: 0.85 }}
              animate={{ y: 0, rotate: -1.5, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Sonamarg keepsake postcard"
            >
              <div className="flip-scene aspect-[3/2] w-full">
                <div
                  className={`flip-card relative h-full w-full cursor-pointer ${flipped ? 'is-flipped' : ''}`}
                  onClick={() => {
                    setFlipped((f) => !f)
                    audio.paper()
                  }}
                >
                  <div className="flip-face absolute inset-0 overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
                    <div className="relative h-full w-full overflow-hidden rounded-md">
                      <PostcardArt className="h-full w-full" />
                      {!unlocked && (
                        <div className="absolute inset-0 grid place-items-center bg-pine/70 text-center text-parchment backdrop-blur-[2px]">
                          <div className="px-6">
                            <Lock className="mx-auto mb-2" />
                            <div className="font-display text-2xl font-semibold">{count} of 4 adventures found</div>
                            <ul className="mt-3 space-y-1 text-sm text-parchment/85">
                              {ADVENTURES.map((a) => (
                                <li key={a.id}>
                                  {found[a.id] ? '✦' : '○'} {a.title}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-3 text-xs text-parchment/70">Complete them all to stamp your keepsake.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flip-face flip-back absolute inset-0 overflow-hidden rounded-xl shadow-2xl">
                    <Back stamped={unlocked && flipped} />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-parchment px-5 py-2.5 text-sm font-semibold text-pine shadow btn-pop"
                  onClick={() => {
                    setFlipped((f) => !f)
                    audio.paper()
                  }}
                >
                  <Repeat2 size={16} /> Flip
                </button>
                {unlocked && (
                  <button className="btn-primary btn-pop inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold" onClick={() => window.print()}>
                    <Printer size={16} /> Print keepsake
                  </button>
                )}
                <button className="grid h-10 w-10 place-items-center rounded-full bg-parchment/90 text-pine shadow btn-pop" onClick={() => actions.setPostcard(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {unlocked &&
        createPortal(
          <div className="print-only">
            <div className="print-page">
              <PostcardArt className="h-full w-full" />
            </div>
            <div className="print-page">
              <Back stamped />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
