import { http } from './http';

export interface PresetLogo {
  key: string;
  label: string;
  url: string;
}

/** Public endpoint — same list regardless of role, used by both the admin and organizer image pickers. */
export const getPresetLogos = () => http.get<PresetLogo[]>('/catalog/presets/logos');
