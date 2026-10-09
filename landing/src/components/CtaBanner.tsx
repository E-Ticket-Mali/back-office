import { ORGANIZER_REGISTER_URL, CONTACT_EMAIL } from '../config'

export function CtaBanner() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-banner">
          <h2>Pret a vendre vos billets en ligne ?</h2>
          <p>
            Rejoignez les organisateurs qui utilisent deja E-Ticket pour gerer leurs
            evenements, leurs billets et leurs reversements depuis un seul endroit.
          </p>
          <div className="cta-banner-actions">
            <a className="btn btn-primary" href={ORGANIZER_REGISTER_URL}>
              Devenir organisateur
            </a>
            <a className="btn btn-secondary" href={`mailto:${CONTACT_EMAIL}`}>
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
