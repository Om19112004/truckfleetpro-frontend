export type IconSet = 'ionicons' | 'material';

export type NavItem = {
  key: string;
  route: string;
  icon: string;
  iconSet: IconSet;
  labelEn: string;
  labelHi: string;
};

export type QuickAction = {
  key: string;
  route: string;
  icon: string;
  iconSet: IconSet;
  labelEn: string;
  labelHi: string;
};

/**
 * Main sidebar navigation. Every route here already exists in the app —
 * this only makes them reachable from one consistent place. Screens that
 * haven't been visually migrated yet are still fully functional when
 * reached through here.
 */
export const MAIN_NAV: NavItem[] = [
  { key: 'dashboard', route: '/dashboard', icon: 'grid-outline', iconSet: 'ionicons', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड' },
  { key: 'trucks', route: '/trucks', icon: 'car-sport-outline', iconSet: 'ionicons', labelEn: 'Trucks', labelHi: 'ट्रक' },
  { key: 'drivers', route: '/drivers', icon: 'people-outline', iconSet: 'ionicons', labelEn: 'Drivers', labelHi: 'ड्राइवर' },
  { key: 'trips', route: '/trips', icon: 'navigate-outline', iconSet: 'ionicons', labelEn: 'Trips', labelHi: 'ट्रिप्स' },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { key: 'add-truck', route: '/add-truck', icon: 'truck-plus', iconSet: 'material', labelEn: 'Add Truck', labelHi: 'ट्रक जोड़ें' },
  { key: 'add-driver', route: '/add-driver', icon: 'person-add-outline', iconSet: 'ionicons', labelEn: 'Add Driver', labelHi: 'ड्राइवर जोड़ें' },
  { key: 'add-trip', route: '/trips', icon: 'navigate-outline', iconSet: 'ionicons', labelEn: 'Add Trip', labelHi: 'ट्रिप जोड़ें' },
  { key: 'alerts', route: '/notifications', icon: 'notifications-outline', iconSet: 'ionicons', labelEn: 'View Alerts', labelHi: 'अलर्ट देखें' },
];

export const SETTINGS_ROUTE = '/settings';
