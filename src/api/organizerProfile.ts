import { downloadFile } from './download';
import { http } from './http';

export interface OrganizerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nif: string | null;
  rccm: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  commissionRate: number | null;
  createdAt: string;
}

export type OrganizerDocumentKind = 'NIF' | 'RCCM' | 'ID_PIECE';

/** Justificatif déposé pour la vérification de l'organisateur. */
export interface OrganizerDocument {
  id: string;
  kind: OrganizerDocumentKind;
  contentType: string;
  uploadedAt: string;
}

export const getOrganizerProfile = () => http.get<OrganizerProfile>('/organizer/profile');
/** NIF et RCCM ne peuvent être que complétés (s'ils sont vides) : ils sont ensuite vérifiés par l'administration. */
export const updateOrganizerProfile = (patch: { name?: string; phone?: string; nif?: string; rccm?: string }) =>
  http.patch<OrganizerProfile>('/organizer/profile', patch);
export const changeOrganizerPassword = (currentPassword: string, newPassword: string) =>
  http.post<void>('/organizer/profile/password', { currentPassword, newPassword });

export const getOrganizerDocuments = () => http.get<OrganizerDocument[]>('/organizer/profile/documents');
export const uploadOrganizerDocument = (kind: OrganizerDocumentKind, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return http.postForm<OrganizerDocument>(`/organizer/profile/documents?kind=${kind}`, form);
};
export const downloadOwnDocument = (doc: OrganizerDocument, filename: string) =>
  downloadFile(`/organizer/profile/documents/${doc.id}`, filename);
