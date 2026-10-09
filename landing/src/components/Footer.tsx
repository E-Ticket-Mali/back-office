import { ORGANIZER_REGISTER_URL, CONTACT_EMAIL } from '../config'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">E-Ticket</div>
            <p style={{ fontSize: 13.5, color: 'rgba(250,243,235,0.7)', maxWidth: 280 }}>
              La plateforme de billetterie evenementielle et de reservation hoteliere qui
              connecte organisateurs et clients au Mali.
            </p>
          </div>

          <div className="footer-col">
            <h4>Organisateurs</h4>
            <ul>
              <li>
                <a href={ORGANIZER_REGISTER_URL}>Devenir organisateur</a>
              </li>
              <li>
                <a href="#fonctionnalites">Fonctionnalites</a>
              </li>
              <li>
                <a href="#comment-ca-marche">Comment ca marche</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Application mobile</h4>
            <ul>
              <li>
                <span>E-Ticket, l&apos;app pour reserver vos billets, bientot disponible sur Android &amp; iOS.</span>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {CURRENT_YEAR} E-Ticket. Tous droits reserves.</span>
          <span>Fait au Mali, pour les organisateurs d&apos;evenements.</span>
        </div>
      </div>
    </footer>
  )
}
