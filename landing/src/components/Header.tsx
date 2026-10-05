import { ORGANIZER_REGISTER_URL } from '../config'

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <a className="brand" href="#top">
          <span className="brand-badge">E</span>
          <span>
            <span className="brand-accent">Mali</span> E-Ticket
          </span>
        </a>

        <nav>
          <a className="btn btn-primary" href={ORGANIZER_REGISTER_URL}>
            Devenir organisateur
          </a>
        </nav>
      </div>
    </header>
  )
}
