type Feature = {
  icon: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: '🎟️',
    title: "Creation d'evenements",
    description:
      "Publiez vos evenements en quelques minutes : date, lieu, description et visuels, sans attendre de developpement specifique.",
  },
  {
    icon: '🏷️',
    title: 'Types de billets',
    description:
      "Definissez plusieurs categories de billets (standard, VIP, groupe...) avec leurs propres prix et quotas pour chaque evenement.",
  },
  {
    icon: '📈',
    title: 'Suivi des ventes',
    description:
      'Suivez en temps reel le nombre de billets vendus, les entrees scannees et la performance de chacun de vos evenements.',
  },
  {
    icon: '💰',
    title: 'Commissions & reversements',
    description:
      "Visualisez clairement la commission appliquee par la plateforme et le montant qui vous revient, evenement par evenement.",
  },
]

export function Features() {
  return (
    <section className="section" id="fonctionnalites">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Fonctionnalites</div>
          <h2>Tout ce qu&apos;il faut pour piloter votre billetterie</h2>
          <p>
            Un seul espace organisateur pour creer vos evenements, configurer vos billets et
            suivre vos revenus, du premier billet vendu au dernier reversement.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
