import { API_URL } from './api';

/** Échoue tôt et clairement si le backend local n'est pas lancé, plutôt que 20 timeouts. */
export default async function globalSetup() {
  try {
    await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'probe@invalid.test', password: 'x' }),
    });
  } catch (e) {
    throw new Error(
      `Backend injoignable sur ${API_URL} (${e instanceof Error ? e.message : String(e)}). ` +
        'Lancez le backend local (mvn spring-boot:run ou docker compose) avant les tests E2E.',
    );
  }
}
