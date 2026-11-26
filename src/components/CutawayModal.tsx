import { AnimatePresence, motion } from 'framer-motion'
import { BedDouble, Flame, Maximize2, Mountain, Users, X } from 'lucide-react'
import { actions, useStore } from '../state/store'
import { inr, type CabinId } from '../data'
import { useConfig, useStay } from '../state/config'

export function CutawayModal() {
  const id = useStore((s) => s.cutaway)
  return (
    <AnimatePresence>
      {id && (
        <motion.div
          key="cutaway"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => actions.closeCutaway()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cabin interior"
            className="storycard relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            initial={{ y: 80, scale: 0.9, rotateX: 12, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ y: 60, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CutawayBody id={id} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CutawayBody({ id }: { id: CabinId }) {
  const stay = useStay(id)
  const { settings } = useConfig()
  const lit = useStore((s) => s.lit[id])
  const night = useStore((s) => s.night)
  return (
    <div className="grid md:grid-cols-[1.35fr_1fr]">
      <button
        className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-parchment/90 text-pine shadow btn-pop"
        onClick={() => actions.closeCutaway()}
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <div className="relative aspect-[640/440] overflow-hidden rounded-t-3xl bg-[#2a2320] md:aspect-auto md:min-h-[440px] md:rounded-l-3xl md:rounded-tr-none">
        <Interior id={id} lit={lit} night={night} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-sm text-parchment">
          {lit ? (
            <span className="inline-flex items-center gap-2">
              <Flame size={16} className="text-saffron" /> The Bukhari is crackling. Pull up a namda rug.
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Flame size={16} className="text-saffron" /> Tap the cast-iron Bukhari stove to light it.
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-glacier">Signature stay</p>
        <h3 className="font-display text-3xl font-semibold leading-tight text-pine">{stay.name}</h3>
        <p className="font-display text-lg italic text-cedar">{stay.tagline}</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat icon={<Users size={16} />} label={`Sleeps ${stay.sleeps}`} />
          <Stat icon={<Maximize2 size={16} />} label={stay.size} />
          <Stat icon={<Mountain size={16} />} label={stay.view || 'Valley view'} />
        </div>
        <ul className="space-y-2 text-[15px] text-ink/85">
          {stay.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" /> {f}
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink/70">
          <BedDouble size={15} className="mr-1 inline" /> Check-in from {settings.checkInTime} · check-out by {settings.checkOutTime}
          {settings.petsAllowed ? ' · pets welcome' : ''}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-cedar/20 pt-4">
          <div>
            <div className="font-display text-2xl font-semibold text-pine">{inr(stay.rate)}</div>
            <div className="text-xs text-ink/60">
              per night{stay.weekendRate ? ` · Fri & Sat ${inr(stay.weekendRate)}` : ''}
              {settings.breakfastIncluded ? ' · breakfast included' : ''}
            </div>
          </div>
          {stay.active ? (
            <button className="btn-primary btn-pop rounded-full px-6 py-3 text-sm font-semibold" onClick={() => actions.openBooking(id)}>
              Reserve this stay
            </button>
          ) : (
            <span className="rounded-full bg-parchment-deep px-4 py-2 text-sm text-cedar">Not open for booking right now</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-parchment-deep/70 px-2.5 py-2 text-pine">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  )
}

/** Hand-built SVG cross-section of each cabin interior with a clickable Bukhari. */
function Interior({ id, lit, night }: { id: CabinId; lit: boolean; night: boolean }) {
  const sky = night ? '#1c2741' : '#bcd6e2'
  const peak = night ? '#55627a' : '#93a5ae'
  const view = (clip: string) => (
    <g clipPath={`url(#${clip})`}>
      <rect x="0" y="0" width="640" height="440" fill={sky} />
      {night && [60, 140, 220, 300, 380, 460, 540].map((x, i) => <circle key={x} cx={x + (i % 2) * 20} cy={70 + (i % 3) * 30} r="1.6" fill="#fff" />)}
      <path d="M0 330 L120 170 L190 240 L300 130 L400 250 L470 190 L640 330 Z" fill={peak} />
      <path d="M120 170 L140 200 L122 194 L104 202 Z M300 130 L326 168 L304 160 L284 170 Z M470 190 L488 214 L470 210 L456 216 Z" fill="#fbfbfb" />
      <rect x="0" y="300" width="640" height="140" fill={night ? '#22392d' : '#6f8f52'} />
      {id === 'riverfront' && <path d="M0 340 C 160 320, 320 360, 640 330 V440 H0 Z" fill="#2B7A78" />}
    </g>
  )

  return (
    <svg viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 block h-full w-full" role="img" aria-label={`Interior of the ${id} cabin`}>
      <defs>
        <clipPath id="win-aframe">
          <path d="M248 330 L320 172 L392 330 Z" />
        </clipPath>
        <clipPath id="win-river">
          <rect x="300" y="150" width="210" height="160" rx="4" />
        </clipPath>
        <clipPath id="win-glacier">
          <rect x="350" y="70" width="230" height="300" />
        </clipPath>
        <pattern id="khatamband" width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="#5e3a26" />
          <path d="M22 2 L42 22 L22 42 L2 22 Z" fill="none" stroke="#a3714b" strokeWidth="2.2" />
          <path d="M22 11 L33 22 L22 33 L11 22 Z" fill="#7b4c31" stroke="#c7956a" strokeWidth="1.2" />
          <circle cx="22" cy="22" r="3" fill="#d9a66f" />
          <path d="M0 0 L8 8 M44 0 L36 8 M0 44 L8 36 M44 44 L36 36" stroke="#a3714b" strokeWidth="2" />
        </pattern>
        <pattern id="planks" width="640" height="26" patternUnits="userSpaceOnUse">
          <rect width="640" height="26" fill="#8a5a43" />
          <path d="M0 25.5 H640" stroke="#5c3a2c" strokeWidth="1.5" />
          <path d="M120 0 V26 M380 0 V26" stroke="#6e473b" strokeWidth="1" opacity="0.6" />
        </pattern>
        <pattern id="floor" width="80" height="20" patternUnits="userSpaceOnUse">
          <rect width="80" height="20" fill="#5b3a2a" />
          <path d="M0 19.5 H80 M40 0 V20" stroke="#3e271c" strokeWidth="1.4" />
        </pattern>
        <radialGradient id="stove-glow" cx="0.24" cy="0.78" r="0.75">
          <stop offset="0" stopColor="#ffb25a" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#ff8a3a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff8a3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flame-g" cx="0.5" cy="0.9" r="0.8">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.4" stopColor="#ffbb45" />
          <stop offset="1" stopColor="#e2541e" />
        </radialGradient>
      </defs>

      {/* outside / backdrop */}
      <rect x="-200" y="-200" width="1040" height="840" fill="#2a2320" />

      {id === 'aframe' && (
        <g>
          <path d="M40 420 L320 30 L600 420 Z" fill="url(#planks)" />
          {view('win-aframe')}
          <path d="M248 330 L320 172 L392 330 Z M320 172 V330 M282 252 H358" fill="none" stroke="#3b2a22" strokeWidth="6" strokeLinejoin="round" />
          <path d="M40 420 L320 30 L600 420" fill="none" stroke="#3b2a22" strokeWidth="14" strokeLinejoin="round" />
          {/* loft daybed */}
          <path d="M210 175 H430" stroke="#3b2a22" strokeWidth="10" />
          <rect x="250" y="150" width="140" height="22" rx="8" fill="#d9cbb2" />
          <rect x="260" y="140" width="40" height="16" rx="6" fill="#2B7A78" />
        </g>
      )}

      {id === 'riverfront' && (
        <g>
          <rect x="40" y="40" width="560" height="380" fill="#e6dac4" />
          <rect x="40" y="290" width="560" height="100" fill="url(#planks)" opacity="0.9" />
          <rect x="40" y="40" width="560" height="70" fill="url(#khatamband)" />
          <rect x="40" y="106" width="560" height="10" fill="#3e271c" />
          {view('win-river')}
          <rect x="300" y="150" width="210" height="160" rx="4" fill="none" stroke="#5b3a2a" strokeWidth="10" />
          <path d="M405 150 V310 M300 230 H510" stroke="#5b3a2a" strokeWidth="5" />
          {/* lattice pinjrakari shutter */}
          <g opacity="0.85">
            <rect x="520" y="150" width="58" height="160" fill="#6e473b" />
            {Array.from({ length: 6 }).map((_, i) => (
              <path key={i} d={`M520 ${160 + i * 26} l29 13 l29 -13`} stroke="#c7956a" strokeWidth="2" fill="none" />
            ))}
          </g>
          {/* soaking tub */}
          <path d="M440 360 h120 a10 10 0 0 1 -10 30 h-100 a10 10 0 0 1 -10 -30 Z" fill="#f2efe8" stroke="#bdb6aa" strokeWidth="2" />
        </g>
      )}

      {id === 'glacier' && (
        <g>
          <rect x="40" y="30" width="560" height="390" fill="#4a3128" />
          <rect x="40" y="30" width="310" height="390" fill="url(#planks)" />
          {view('win-glacier')}
          <path d="M350 70 H580 V370 H350 Z M465 70 V370 M350 220 H580" fill="none" stroke="#2c211c" strokeWidth="7" />
          {/* mezzanine */}
          <rect x="40" y="200" width="320" height="16" fill="#3b2a22" />
          <path d="M60 200 V172 M100 200 V172 M140 200 V172 M180 200 V172 M220 200 V172 M50 172 H230" stroke="#3b2a22" strokeWidth="5" />
          <rect x="240" y="160" width="100" height="34" rx="8" fill="#d9cbb2" />
          <rect x="252" y="148" width="34" height="18" rx="6" fill="#D96B27" />
          {/* stairs */}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={220 + i * 18} y={216 + i * 24} width="40" height="10" fill="#6e473b" />
          ))}
        </g>
      )}

      {/* floor */}
      <rect x="-200" y="390" width="1040" height="250" fill="url(#floor)" />
      {/* namda rug */}
      <ellipse cx="330" cy="404" rx="150" ry="22" fill="#d9cbb2" />
      <ellipse cx="330" cy="404" rx="130" ry="16" fill="none" stroke="#2B7A78" strokeWidth="3" strokeDasharray="10 6" />
      {[270, 330, 390].map((x) => (
        <g key={x}>
          <circle cx={x} cy="404" r="6" fill="#D96B27" />
          <path d={`M${x - 14} 404 q 7 -8 14 0 q 7 8 14 0`} stroke="#1C352D" strokeWidth="2" fill="none" />
        </g>
      ))}

      {/* low table with samovar */}
      <rect x="400" y="362" width="80" height="8" fill="#3e271c" />
      <path d="M408 370 v20 M472 370 v20" stroke="#3e271c" strokeWidth="5" />
      <path d="M426 362 c -4 -26 32 -26 28 0 z" fill="#c9783f" />
      <rect x="436" y="326" width="8" height="14" fill="#7a3c1c" />

      {/* warm light */}
      <rect width="640" height="440" fill="url(#stove-glow)" style={{ opacity: lit ? 1 : 0, transition: 'opacity 1.2s ease', mixBlendMode: 'screen' }} pointerEvents="none" />
      <rect width="640" height="440" fill="#0d1420" style={{ opacity: lit ? 0 : night ? 0.45 : 0.25, transition: 'opacity 1.4s ease' }} pointerEvents="none" />

      {/* ── the Bukhari ── */}
      <g
        role="button"
        tabIndex={0}
        aria-label={lit ? 'Bukhari stove (lit)' : 'Light the Bukhari stove'}
        style={{ cursor: lit ? 'default' : 'pointer', outline: 'none' }}
        onClick={() => actions.lightBukhari(id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && actions.lightBukhari(id)}
      >
        {/* flue pipe */}
        <rect x="128" y={id === 'aframe' ? 230 : 120} width="18" height={id === 'aframe' ? 80 : 190} fill="#24201e" />
        <rect x="124" y="300" width="26" height="12" fill="#1a1716" />
        {/* body */}
        <rect x="84" y="310" width="106" height="68" rx="8" fill="#2a2523" stroke="#141110" strokeWidth="3" />
        <rect x="78" y="304" width="118" height="12" rx="4" fill="#3a3330" />
        <path d="M94 378 v14 M180 378 v14" stroke="#141110" strokeWidth="6" strokeLinecap="round" />
        {/* door window */}
        <rect x="104" y="324" width="66" height="40" rx="6" fill={lit ? '#3a1408' : '#151211'} stroke="#59504b" strokeWidth="3" />
        {lit && (
          <g>
            <ellipse cx="137" cy="360" rx="26" ry="5" fill="#ff7a2a" />
            <path className="flame" d="M118 362 C 112 346, 124 338, 122 326 C 132 336, 138 344, 134 362 Z" fill="url(#flame-g)" />
            <path className="flame f2" d="M130 362 C 126 342, 140 334, 138 322 C 150 336, 156 348, 148 362 Z" fill="url(#flame-g)" />
            <path className="flame f3" d="M144 362 C 142 350, 152 344, 152 334 C 160 344, 162 354, 158 362 Z" fill="url(#flame-g)" />
          </g>
        )}
        <path d="M104 344 H170" stroke="#59504b" strokeWidth="2" opacity="0.7" />
        <circle cx="176" cy="344" r="3.5" fill="#8a7f78" />
        {/* firewood */}
        <g>
          <rect x="198" y="372" width="44" height="10" rx="5" fill="#7b4c31" />
          <rect x="204" y="362" width="40" height="10" rx="5" fill="#8a5a43" />
          <circle cx="242" cy="377" r="5" fill="#c7956a" />
        </g>
        {!lit && <rect className="pulse-ring" x="76" y="300" width="122" height="84" rx="14" fill="none" stroke="#D96B27" strokeWidth="3" />}
        {lit &&
          [0, 1, 2, 3, 4].map((i) => (
            <circle key={i} className="ember" cx={128 + i * 6} cy="306" r="2" fill="#ffb25a" style={{ animationDelay: `${-i * 0.45}s` }} />
          ))}
      </g>
    </svg>
  )
}
