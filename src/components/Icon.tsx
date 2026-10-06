import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Drama,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Music,
  Receipt,
  ShieldCheck,
  Star,
  Ticket,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { EventCategory } from '../types';

/** Real SVG icons for the whole back-office (no emoji / glyph text). */
const ICONS = {
  dashboard: LayoutDashboard,
  hotel: Building2,
  event: Ticket,
  booking: Receipt,
  client: Users,
  agent: ShieldCheck,
  organizer: Briefcase,
  bell: Bell,
  close: X,
  check: Check,
  star: Star,
  back: ArrowLeft,
  next: ArrowRight,
  collapse: ChevronLeft,
  expand: ChevronRight,
} as const;

export type IconName = keyof typeof ICONS;

const CATEGORY_ICONS: Record<EventCategory, LucideIcon> = {
  HIPPIQUE: Flag,
  CONCERT: Music,
  SPORT: Trophy,
  CONFERENCE: GraduationCap,
  CINEMA: Clapperboard,
  THEATRE: Drama,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export function Icon(props: Readonly<IconProps>) {
  const { name, size = 16, color = 'currentColor', strokeWidth = 2, filled = false } = props;
  const Cmp = ICONS[name];
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} fill={filled ? color : 'none'} aria-hidden />;
}

export function CategoryIcon(props: Readonly<{ category: EventCategory; size?: number; color?: string }>) {
  const { category, size = 16, color = 'currentColor' } = props;
  const Cmp = CATEGORY_ICONS[category] ?? Ticket;
  return <Cmp size={size} color={color} strokeWidth={2} aria-hidden />;
}
