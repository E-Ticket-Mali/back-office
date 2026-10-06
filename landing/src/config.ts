// La landing est 100% statique (aucun appel reseau) : ce module ne fait que centraliser
// les liens externes vers le reste de la plateforme (back-office, app client).
//
// Le back-office n'expose pas encore de route d'inscription organisateur dans ce checkout
// (voir Code Map de la story 7.1) -- on cible le chemin prevu par l'intent de la story,
// `/organizer/register`, configurable au build via VITE_ORGANIZER_REGISTER_URL si le
// back-office est deploye sur un (sous-)domaine distinct de la landing.
export const ORGANIZER_REGISTER_URL: string =
  import.meta.env.VITE_ORGANIZER_REGISTER_URL || '/organizer/register'

export const BACK_OFFICE_LOGIN_URL: string =
  import.meta.env.VITE_BACK_OFFICE_LOGIN_URL || '/'

export const CONTACT_EMAIL = 'contact@mali-eticket.com'
