import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { makeT } from '../lib/i18n.js'
import './Home.css'

const DESTINATIONS = [
  { key: 'lessons', titleKey: 'home.lessons.title', statusKey: 'home.lessons.status', ctaKey: 'home.lessons.cta', image: '/home-book.png', imageAlt: 'Open book with leaves', tone: 'mint', doodle: 'books' },
  { key: 'classroom', titleKey: 'home.classroom.title', statusKey: 'home.classroom.status', ctaKey: 'home.classroom.cta', image: '/home-star.png', imageAlt: 'Smiling Teacher Gabay star', tone: 'sky', doodle: 'tutor' },
  { key: 'games', titleKey: 'home.games.title', statusKey: 'home.games.status', ctaKey: 'home.games.cta', image: '/home-arcade.png', imageAlt: 'Mini games arcade cabinet', tone: 'rose', doodle: 'games' },
]

export default function Home({ onPick, online = true, lang = 'taglish', studentName = '', grade = 6 }) {
  const tt = makeT(lang)

  return (
    <main className="home-dashboard gb-shell min-h-screen">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark" aria-hidden="true"><Mascot size={42} /></span>
          <span>Gabay</span>
        </div>
        <OnlineBadge online={online} className="home-online-badge" />
      </header>

      <section className="home-welcome" aria-labelledby="home-greeting">
        <div className="home-hero">
          <div className="home-hero-content">
            <div className="home-greeting-row">
              <h1 id="home-greeting">
                {studentName ? tt('home.greetingName', { name: studentName }) : tt('home.greeting')}
              </h1>
            </div>
            <p className="home-subtitle">{tt('home.subtitle')}</p>
            <div className="home-hero-meta">
              <span className="home-grade-pill">{tt('home.grade', { grade })}</span>
              <span className="home-hallway-pill">{tt('home.hallwayTag')}</span>
            </div>
          </div>
        </div>

      </section>

      <section className="home-destinations" aria-label={tt('home.destinations')}>
        {DESTINATIONS.map((destination) => (
          <article key={destination.key} className={'home-destination-card home-card-' + destination.tone}>
            <span className={'home-card-doodle home-doodle-' + destination.doodle} aria-hidden="true" />
            <div className="home-card-badges">
              <span>{tt('home.open')}</span>
              <span>{tt(destination.statusKey)}</span>
            </div>
            <div className="home-card-icon">
              <img src={destination.image} alt={destination.imageAlt} />
            </div>
            <h2>{tt(destination.titleKey)}</h2>
            <button type="button" className="home-card-cta" onClick={() => onPick(destination.key)}>
              <span>{tt(destination.ctaKey)}</span>
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}
