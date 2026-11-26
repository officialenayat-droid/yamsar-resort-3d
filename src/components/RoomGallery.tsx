import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import type { StayPhoto } from '../../shared/types.ts'
import { audio } from '../audio/AudioEngine'

const srcSet = (p: StayPhoto) => `${p.base}-800.webp 800w, ${p.base}-1600.webp 1600w`

/** Responsive photo (800w / 1600w WebP). */
export function RoomPhoto({ photo, sizes, className = '', eager = false }: { photo: StayPhoto; sizes: string; className?: string; eager?: boolean }) {
  return (
    <img
      src={`${photo.base}-800.webp`}
      srcSet={srcSet(photo)}
      sizes={sizes}
      alt={photo.alt}
      width={photo.w}
      height={photo.h}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={`h-full w-full object-cover ${className}`}
    />
  )
}

/** Swipeable gallery with thumbnails and a full-screen lightbox. */
export function RoomGallery({ photos, name }: { photos: StayPhoto[]; name: string }) {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [full, setFull] = useState(false)
  const n = photos.length
  const go = useCallback(
    (d: number) => {
      setDir(d)
      setI((x) => (x + d + n) % n)
      audio.paper()
    },
    [n],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape' && full) {
        e.stopPropagation()
        setFull(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [go, full])

  const slide = (big: boolean) => (
    <AnimatePresence initial={false} custom={dir} mode="popLayout">
      <motion.div
        key={i}
        custom={dir}
        className="absolute inset-0"
        initial={{ opacity: 0, x: dir * 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dir * -60 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) go(1)
          else if (info.offset.x > 50) go(-1)
        }}
      >
        {big ? (
          <img src={`${photos[i].base}-1600.webp`} alt={photos[i].alt} draggable={false} className="h-full w-full select-none object-contain" />
        ) : (
          <RoomPhoto photo={photos[i]} sizes="(min-width: 768px) 60vw, 100vw" eager className="select-none" />
        )}
      </motion.div>
    </AnimatePresence>
  )

  const arrows = (
    <>
      <button
        className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur btn-pop hover:bg-black/60"
        onClick={() => go(-1)}
        aria-label="Previous photo"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur btn-pop hover:bg-black/60"
        onClick={() => go(1)}
        aria-label="Next photo"
      >
        <ChevronRight size={20} />
      </button>
    </>
  )

  return (
    <div className="flex h-full flex-col bg-[#1f1a17]" aria-roledescription="carousel" aria-label={`${name} photos`}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {slide(false)}
        {n > 1 && arrows}
        <button
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur btn-pop hover:bg-black/60"
          onClick={() => setFull(true)}
          aria-label="View full screen"
        >
          <Expand size={13} /> {i + 1} / {n}
        </button>
      </div>
      {n > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto bg-black/30 p-2">
          {photos.map((p, k) => (
            <button
              key={p.base}
              onClick={() => {
                setDir(k > i ? 1 : -1)
                setI(k)
              }}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-md ring-2 transition ${k === i ? 'ring-saffron' : 'opacity-60 ring-transparent hover:opacity-100'}`}
              aria-label={`Photo ${k + 1}: ${p.alt}`}
              aria-current={k === i}
            >
              <img src={`${p.base}-240.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {full &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-black/95" role="dialog" aria-modal="true" aria-label={`${name} photos, full screen`} onClick={() => setFull(false)}>
            <div className="absolute inset-0 sm:inset-8" onClick={(e) => e.stopPropagation()}>
              {slide(true)}
              {n > 1 && arrows}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-white/80">
              {photos[i].alt} · {i + 1} / {n}
            </div>
            <button className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white btn-pop hover:bg-white/25" onClick={() => setFull(false)} aria-label="Close full screen">
              <X size={20} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
