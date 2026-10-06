type Step = {
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    title: 'Creez votre compte organisateur',
    description:
      "Inscrivez-vous en tant qu'organisateur depuis le back-office Mali E-Ticket et renseignez les informations de votre structure.",
  },
  {
    title: 'Publiez votre evenement',
    description:
      'Ajoutez les informations de votre evenement (date, lieu, description) et configurez vos types de billets et leurs quotas.',
  },
  {
    title: 'Vendez vos billets',
    description:
      "Vos billets deviennent disponibles a l'achat dans l'application mobile Mali E-Ticket, accessible a tous vos futurs spectateurs.",
  },
  {
    title: 'Suivez vos ventes et vos reversements',
    description:
      'Suivez les ventes en direct depuis votre espace organisateur et consultez le detail des commissions et des reversements.',
  },
]

export function HowItWorks() {
  return (
    <section className="section" id="comment-ca-marche" style={{ background: '#f3e8d8' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Comment ca marche</div>
          <h2>De l&apos;inscription a votre premier reversement</h2>
          <p>Quatre etapes simples pour commencer a vendre vos billets en ligne.</p>
        </div>

        <div className="steps">
          {STEPS.map((step, index) => (
            <div className="step" key={step.title}>
              <div className="step-number">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
