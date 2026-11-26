import { useEffect } from 'react'
import { EntryGate } from './components/EntryGate'
import { HUD, Toast } from './components/HUD'
import { Hero } from './components/Hero'
import { Story, Suites, RiverPlayground, Experiences, Footer } from './components/Sections'
import { KahwaCorner } from './components/KahwaCorner'
import { CutawayModal } from './components/CutawayModal'
import { BookingDrawer } from './components/BookingDrawer'
import { PostcardModal } from './components/Postcard'
import { audio } from './audio/AudioEngine'
import { actions, getState, useStore } from './state/store'

/** Delegated wooden taps/pops for every button & link — the site always answers back. */
function useTactileSounds() {
  useEffect(() => {
    let last: Element | null = null
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const el = (e.target as Element).closest('button, a, [role="button"]')
      if (el && el !== last) audio.tap()
      last = el
    }
    const down = (e: PointerEvent) => {
      const el = (e.target as Element).closest('button, a')
      if (el && !el.hasAttribute('data-nosfx')) audio.click()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = getState()
      if (s.postcardOpen) actions.setPostcard(false)
      else if (s.booking.open) actions.closeBooking()
      else if (s.cutaway) actions.closeCutaway()
      else if (s.trackerOpen) actions.setTracker(false)
    }
    window.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [])
}

export default function App() {
  useTactileSounds()
  const modalOpen = useStore((s) => !!s.cutaway || s.booking.open || s.postcardOpen || !s.entered)
  useEffect(() => {
    document.documentElement.style.overflow = modalOpen ? 'hidden' : ''
  }, [modalOpen])

  return (
    <>
      <EntryGate />
      <HUD />
      <main>
        <Hero />
        <Story />
        <Suites />
        <RiverPlayground />
        <KahwaCorner />
        <Experiences />
      </main>
      <Footer />
      <CutawayModal />
      <BookingDrawer />
      <PostcardModal />
      <Toast />
    </>
  )
}
