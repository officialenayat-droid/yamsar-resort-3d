import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { WorldControls } from './HUD'
import { useStore } from '../state/store'
import { world, clamp01 } from '../three/world'

const HimalayanDiorama = lazy(() => import('../three/HimalayanDiorama'))

/** 200vh hero with a sticky 3D stage — scrolling flies the camera down the valley. */
export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const entered = useStore((s) => s.entered)
  const night = useStore((s) => s.night)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight))
        world.scroll = p
        setProgress(p)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section id="top" ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden" style={{ background: night ? '#1d2436' : '#ece3d2', transition: 'background 1.5s' }}>
        <Suspense fallback={<div className="paper absolute inset-0" />}>
          <div className="absolute inset-0">
            <HimalayanDiorama active={visible} />
          </div>
        </Suspense>

        {/* storybook headline */}
        {entered && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-24 z-10 px-5 text-center sm:top-28"
            style={{ opacity: 1 - progress * 2.2, y: progress * -80 }}
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className={`text-[11px] font-semibold uppercase tracking-[0.4em] ${night ? 'text-[#f3c79a]' : 'text-glacier'}`}
            >
              Kullan · Sonamarg · Kashmir
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 2, type: 'spring', stiffness: 120, damping: 12 }}
              className={`mx-auto mt-2 max-w-3xl font-display text-[clamp(2.1rem,6vw,4.6rem)] font-semibold leading-[1.02] drop-shadow-[0_2px_14px_rgba(244,239,230,0.7)] ${night ? 'text-parchment drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]' : 'text-pine'}`}
            >
              Suddenly, <em className={`font-normal ${night ? 'text-[#f3c79a]' : 'text-cedar'}`}>the Himalayas rise.</em>
            </motion.h1>
          </motion.div>
        )}

        <WorldControls />

        {entered && (
          <motion.a
            href="#story"
            className={`absolute bottom-3 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center text-[11px] font-semibold uppercase tracking-[0.3em] sm:flex ${night ? 'text-parchment/70' : 'text-pine/70'}`}
            style={{ opacity: 1 - progress * 3 }}
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          >
            Scroll to fly down the valley
            <ChevronDown size={18} />
          </motion.a>
        )}

        {/* hand-off into the parchment pages */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-parchment to-transparent" style={{ opacity: clamp01((progress - 0.6) / 0.4) }} />
      </div>
    </section>
  )
}
