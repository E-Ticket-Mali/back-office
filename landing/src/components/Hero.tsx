import { ORGANIZER_REGISTER_URL } from '../config'

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">Plateforme billetterie &amp; hotellerie</span>
          <h1>Vendez vos billets d&apos;evenements en ligne, sans vous soucier de la technique.</h1>
          <p className="lead">
            E-Ticket donne aux organisateurs un espace pour creer leurs evenements,
            mettre en vente plusieurs types de billets, suivre les ventes en temps reel et
            recevoir leurs reversements -- pendant que vos clients reservent depuis
            l&apos;application mobile.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href={ORGANIZER_REGISTER_URL}>
              Devenir organisateur
            </a>
            <a className="btn btn-outline" href="#comment-ca-marche">
              Comment ca marche
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">billetterie digitale</div>
            </div>
            <div>
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">suivi des ventes</div>
            </div>
            <div>
              <div className="hero-stat-value">1</div>
              <div className="hero-stat-label">espace pour tout gerer</div>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-row">
              <span className="hero-card-label">Evenement</span>
              <span className="hero-card-value">Festival Niger Live</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Billets vendus</span>
              <span className="hero-card-value">1 284 / 2 000</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Types de billets</span>
              <span className="hero-card-value">VIP &middot; Standard &middot; Groupe</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Reversement prevu</span>
              <span className="hero-card-value positive">+ 3 450 000 FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
