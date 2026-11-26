import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bike, Flame, Footprints, Mail, MapPin, Phone, PawPrint, Snowflake, Utensils, Wifi, BedDouble, Clock } from 'lucide-react'
import { actions, useStore } from '../state/store'
import { inr } from '../data'
import { useConfig } from '../state/config'
import { StayVignette } from '../svg/Illustrations'

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-glacier">{children}</p>
}

export function Story() {
  const { settings, stays } = useConfig()
  const totalRooms = stays.reduce((a, s) => a + s.units, 0)
  return (
    <section id="story" className="paper relative py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center">
        <motion.div {...reveal}>
          <Eyebrow>Chapter one · the valley</Eyebrow>
          <h2 className="font-display text-4xl font-semibold leading-tight text-pine sm:text-5xl">
            A storybook valley on the <em className="font-normal text-cedar">road to the glaciers.</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            Kullan is a small village in the Sindh valley, on the road up to Sonamarg, the “Meadow of Gold”. Here the valley narrows, deodars
            crowd the slopes and the river runs glacier-cold and turquoise. {settings.resortName} is a tranquil haven where luxury meets
            nature: warm wooden rooms, a garden and library, and bonfires under very big skies.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">Wake to birdsong and mountain air. End the day by the fire.</p>
        </motion.div>
        <motion.div {...reveal} className="grid grid-cols-2 gap-4">
          {[
            { icon: <BedDouble />, k: `${totalRooms} rooms`, v: 'in three styles, each with a balcony' },
            { icon: <Wifi />, k: 'Warm & connected', v: 'room heating and free Wi-Fi throughout' },
            { icon: <Flame />, k: 'Bonfire nights', v: 'plus a library, garden & yoga space' },
            settings.petsAllowed
              ? { icon: <PawPrint />, k: 'Pets welcome', v: `check-in from ${settings.checkInTime}` }
              : { icon: <Clock />, k: settings.checkInTime, v: 'check-in time' },
          ].map((s) => (
            <div key={s.k} className="storycard rounded-3xl p-5">
              <div className="mb-3 text-saffron">{s.icon}</div>
              <div className="font-display text-2xl font-semibold text-pine">{s.k}</div>
              <div className="text-sm text-ink/65">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function Suites() {
  const { stays, settings } = useConfig()
  const night = useStore((s) => s.night)
  const lit = useStore((s) => s.lit)
  return (
    <section id="stays" className="paper-deep relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>Chapter two · the stays</Eyebrow>
          <h2 className="font-display text-4xl font-semibold leading-tight text-pine sm:text-5xl">Rooms & suites</h2>
          <p className="mt-4 text-lg text-ink/75">
            Every room has a private balcony, heating and free Wi-Fi{settings.breakfastIncluded ? ', with breakfast included' : ''}. Step inside and light the
            stove; some keepsakes are only found indoors.
          </p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          {stays.map((s, i) => (
            <motion.article
              key={s.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              whileHover={{ y: -8, rotate: i === 1 ? 0 : i === 0 ? -0.6 : 0.6 }}
              className="storycard group flex flex-col overflow-hidden rounded-[1.75rem]"
            >
              <button className="relative aspect-[16/10] overflow-hidden" onClick={() => actions.openCutaway(s.id)} aria-label={`Step inside the ${s.name}`}>
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                  <StayVignette kind={s.id} night={night || lit[s.id]} />
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-parchment/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cedar">
                  Sleeps {s.sleeps} · {s.size}
                </span>
                {lit[s.id] && <span className="absolute right-3 top-3 rounded-full bg-saffron px-3 py-1 text-[11px] font-semibold text-white">🔥 Bukhari lit</span>}
              </button>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-2xl font-semibold leading-tight text-pine">{s.name}</h3>
                <p className="mt-2 text-[15px] text-ink/70">{s.tagline}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                  <div>
                    <div className="font-display text-xl font-semibold text-pine">{inr(s.rate)}</div>
                    <div className="text-xs text-ink/55">per night{s.weekendRate ? ` · Fri–Sat ${inr(s.weekendRate)}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full border border-cedar/25 px-4 py-2 text-sm font-semibold text-pine btn-pop" onClick={() => actions.openCutaway(s.id)}>
                      Step inside
                    </button>
                    {s.active && (
                      <button className="btn-primary btn-pop rounded-full px-4 py-2 text-sm font-semibold" onClick={() => actions.openBooking(s.id)}>
                        Reserve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RiverPlayground() {
  const goTo = (preset: 'river' | 'glacier') => {
    actions.setCamera(preset)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <section id="river" className="relative overflow-hidden bg-glacier py-24 text-parchment">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M0 ${40 + i * 44} C 200 ${20 + i * 44}, 400 ${70 + i * 44}, 600 ${40 + i * 44} S 1000 ${10 + i * 44}, 1200 ${40 + i * 44}`} stroke="#fff" strokeWidth="1.5" fill="none" />
        ))}
      </svg>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
        <motion.div {...reveal}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#bfe6e0]">Chapter three · the Sindh</p>
          <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">The river is a playground.</h2>
          <p className="mt-5 text-lg text-parchment/85">
            Click anywhere on the Sindh in the valley above. Ripples spread, the water splashes, and brown trout dart away beneath the surface.
            The real river runs through the Kullan valley just as cold and clear.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-parchment px-6 py-3 text-sm font-semibold text-glacier btn-pop" onClick={() => goTo('river')}>
              Fly to the riverfront
            </button>
            <button className="rounded-full border border-parchment/40 px-6 py-3 text-sm font-semibold btn-pop" onClick={() => goTo('glacier')}>
              Fly to Glacier Ridge
            </button>
          </div>
        </motion.div>
        <motion.div {...reveal} className="relative mx-auto aspect-square w-full max-w-sm">
          <svg viewBox="0 0 300 300" className="h-full w-full" aria-hidden>
            <circle cx="150" cy="150" r="140" fill="#226664" />
            {[40, 75, 110].map((r, i) => (
              <circle key={r} className="pulse-ring" cx="150" cy="150" r={r} fill="none" stroke="#e6f6f3" strokeWidth="2" style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
            <g transform="translate(150 160) rotate(-12)">
              <ellipse rx="60" ry="17" fill="#8a7440" />
              <ellipse cy="5" rx="50" ry="9" fill="#e4d6b0" />
              <path d="M-58 0 L-88 -18 L-82 0 L-88 18 Z" fill="#7a6436" />
              {[
                [-20, -6],
                [6, -9],
                [28, -4],
                [-36, 2],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill={i % 2 ? '#b04a2e' : '#5a3d1e'} />
              ))}
              <circle cx="44" cy="-3" r="3" fill="#111" />
            </g>
          </svg>
        </motion.div>
      </div>
    </section>
  )
}

export function Experiences() {
  const items = [
    { icon: <Footprints />, t: 'Yamsar & Khaymsar Lakes', d: 'A full-day guided trek to twin alpine lakes above the valley, with lunch by the water.' },
    { icon: <Utensils />, t: 'Kashmiri Wazwan', d: 'A traditional multi-course feast, from rista to gushtaba, plus local and international dishes in-house.' },
    { icon: <Snowflake />, t: 'Thajiwas Glacier', d: 'Pony or on foot to the glacier’s snout. Sledging even in early summer.' },
    { icon: <Bike />, t: 'Cycling & bonfires', d: 'Scenic rides along the valley by day; warm nights and starry skies around the evening bonfire.' },
  ]
  return (
    <section id="experiences" className="paper py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>Chapter five · days out</Eyebrow>
          <h2 className="font-display text-4xl font-semibold leading-tight text-pine sm:text-5xl">Experiences in the valley</h2>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((x, i) => (
            <motion.div key={x.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} whileHover={{ y: -6 }} className="storycard rounded-3xl p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-pine text-parchment">{x.icon}</div>
              <h3 className="font-display text-xl font-semibold text-pine">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{x.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.div {...reveal} className="mt-14 flex flex-col items-center gap-4 rounded-[2rem] bg-cedar px-6 py-12 text-center text-parchment">
          <h3 className="font-display text-3xl font-semibold sm:text-4xl">Your cabin by the Sindh is waiting.</h3>
          <p className="max-w-lg text-parchment/80">Book direct with the resort. No middlemen, and our team confirms every stay personally.</p>
          <button className="btn-primary btn-pop mt-2 rounded-full px-8 py-3.5 text-sm font-semibold" onClick={() => actions.openBooking()}>
            Check availability
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  const { settings } = useConfig()
  return (
    <footer className="bg-pine py-14 text-parchment/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-semibold text-parchment">{settings.resortName}</div>
          <p className="mt-2 flex items-start gap-2 text-sm">
            <MapPin size={16} className="mt-0.5 shrink-0 text-saffron" /> {settings.address}
          </p>
          <p className="mt-3 text-sm text-parchment/60">{settings.tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="mb-2 font-semibold text-parchment">Talk to us</div>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-parchment">
              <Phone size={15} className="text-saffron" /> {settings.phone}
            </a>
          )}
          {settings.whatsapp && (
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-parchment">
              <span className="w-[15px] text-center text-saffron">✆</span> WhatsApp us
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-parchment">
              <Mail size={15} className="text-saffron" /> {settings.email}
            </a>
          )}
          <div className="flex gap-4 pt-1">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="underline decoration-parchment/30 underline-offset-4 hover:text-parchment">
                Instagram
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noreferrer" className="underline decoration-parchment/30 underline-offset-4 hover:text-parchment">
                Facebook
              </a>
            )}
          </div>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-semibold text-parchment">Good to know</div>
          <p>
            Check-in from {settings.checkInTime} · check-out by {settings.checkOutTime}.
            {settings.petsAllowed ? ' Pets are welcome.' : ''}
            {settings.breakfastIncluded ? ' Breakfast is included.' : ''}
          </p>
          <p className="mt-3 text-parchment/60">Every peak, pine, sound and stamp on this site is drawn or synthesised in code. Turn the sound on and listen to the valley.</p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-4 text-xs text-parchment/50 sm:px-6">
        © {new Date().getFullYear()} {settings.resortName} · Kullan, Sonamarg
      </div>
    </footer>
  )
}
