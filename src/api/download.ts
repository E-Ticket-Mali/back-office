import { UnauthorizedError } from './http';
import { getToken, notifyUnauthorized } from './token';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'text/csv': 'csv',
};

/** Télécharge un fichier binaire protégé (fetch + blob) ; l'extension est déduite du type de contenu. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du téléchargement.`);
  const contentType = res.headers.get('Content-Type')?.split(';')[0]?.trim() ?? '';
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = extension ? `${filename}.${extension}` : filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
