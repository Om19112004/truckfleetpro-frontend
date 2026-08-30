import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Language = 'en' | 'hi';

type TranslationKeys = {
  appName: string;
  fleetManagement: string;
  goodMorning: string;
  welcomeBack: string;
  dashboard: string;
  fleet: string;
  trips: string;
  expenses: string;
  more: string;

  fleetStatus: string;
  live: string;
  fleetHealth: string;
  trucks: string;
  activeTrips: string;
  serviceDue: string;
  operational: string;

  fleetSnapshot: string;
  todaysOverview: string;
  totalTrucks: string;
  maintenance: string;
  expiringSoon: string;
  vehicles: string;
  onRoad: string;
  attention: string;
  documents: string;

  quickActions: string;
  commonOperations: string;
  addTruck: string;
  registerVehicle: string;
  addDriver: string;
  registerDriver: string;
  newTrip: string;
  createJourney: string;
  diesel: string;
  trackFuel: string;
  vehiclePapers: string;
  documentsSubtitle: string;
  servicing: string;
  vehicleService: string;

  liveTrip: string;
  currentlyOnRoad: string;
  from: string;
  to: string;
  tripDetails: string;
  inProgress: string;

  recentActivity: string;
  latestUpdates: string;
  seeAll: string;
  viewAll: string;

  settings: string;
  appearance: string;
  language: string;
  light: string;
  dark: string;
  english: string;
  hindi: string;
  notifications: string;
  account: string;
  logout: string;
  chooseLanguage: string;
  chooseTheme: string;
};

const translations: Record<Language, TranslationKeys> = {
  en: {
    appName: 'TruckFleet',
    fleetManagement: 'FLEET MANAGEMENT',
    goodMorning: 'GOOD MORNING',
    welcomeBack: 'Welcome back, Fleet Owner',
    dashboard: 'Dashboard',
    fleet: 'Fleet',
    trips: 'Trips',
    expenses: 'Expenses',
    more: 'More',

    fleetStatus: 'FLEET STATUS',
    live: 'LIVE',
    fleetHealth: 'FLEET HEALTH',
    trucks: 'trucks',
    activeTrips: 'active trips',
    serviceDue: 'service due',
    operational: 'operational',

    fleetSnapshot: 'Fleet Snapshot',
    todaysOverview: "Today's fleet overview",
    totalTrucks: 'Total Trucks',
    maintenance: 'Maintenance',
    expiringSoon: 'Expiring Soon',
    vehicles: 'Vehicles',
    onRoad: 'On road',
    attention: 'Attention',
    documents: 'Documents',

    quickActions: 'Quick Actions',
    commonOperations: 'Common fleet operations',
    addTruck: 'Add Truck',
    registerVehicle: 'Register vehicle',
    addDriver: 'Add Driver',
    registerDriver: 'Register driver',
    newTrip: 'New Trip',
    createJourney: 'Create journey',
    diesel: 'Diesel',
    trackFuel: 'Track fuel',
    vehiclePapers: 'Gadi Papers',
    documentsSubtitle: 'Documents',
    servicing: 'Servicing',
    vehicleService: 'Vehicle service',

    liveTrip: 'Live Trip',
    currentlyOnRoad: 'Currently on the road',
    from: 'FROM',
    to: 'TO',
    tripDetails: 'Trip details',
    inProgress: 'In progress',

    recentActivity: 'Recent Activity',
    latestUpdates: 'Latest fleet updates',
    seeAll: 'See all',
    viewAll: 'View all',

    settings: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    hindi: 'Hindi',
    notifications: 'Notifications',
    account: 'Account',
    logout: 'Logout',
    chooseLanguage: 'Choose your language',
    chooseTheme: 'Choose your theme',
  },

  hi: {
    appName: 'TruckFleet',
    fleetManagement: 'फ्लीट प्रबंधन',
    goodMorning: 'सुप्रभात',
    welcomeBack: 'वापसी पर स्वागत है, फ्लीट ओनर',
    dashboard: 'डैशबोर्ड',
    fleet: 'फ्लीट',
    trips: 'ट्रिप्स',
    expenses: 'खर्चे',
    more: 'और',

    fleetStatus: 'फ्लीट स्थिति',
    live: 'लाइव',
    fleetHealth: 'फ्लीट स्वास्थ्य',
    trucks: 'ट्रक',
    activeTrips: 'सक्रिय ट्रिप्स',
    serviceDue: 'सर्विस बाकी',
    operational: 'संचालित',

    fleetSnapshot: 'फ्लीट सारांश',
    todaysOverview: 'आज की फ्लीट जानकारी',
    totalTrucks: 'कुल ट्रक',
    maintenance: 'रखरखाव',
    expiringSoon: 'जल्द समाप्त होने वाले',
    vehicles: 'वाहन',
    onRoad: 'सड़क पर',
    attention: 'ध्यान आवश्यक',
    documents: 'दस्तावेज़',

    quickActions: 'त्वरित कार्य',
    commonOperations: 'फ्लीट के सामान्य कार्य',
    addTruck: 'ट्रक जोड़ें',
    registerVehicle: 'वाहन रजिस्टर करें',
    addDriver: 'ड्राइवर जोड़ें',
    registerDriver: 'ड्राइवर रजिस्टर करें',
    newTrip: 'नई ट्रिप',
    createJourney: 'यात्रा बनाएं',
    diesel: 'डीज़ल',
    trackFuel: 'ईंधन ट्रैक करें',
    vehiclePapers: 'गाड़ी के कागज़',
    documentsSubtitle: 'दस्तावेज़',
    servicing: 'सर्विसिंग',
    vehicleService: 'वाहन सर्विस',

    liveTrip: 'लाइव ट्रिप',
    currentlyOnRoad: 'अभी सड़क पर',
    from: 'यहाँ से',
    to: 'यहाँ तक',
    tripDetails: 'ट्रिप विवरण',
    inProgress: 'जारी है',

    recentActivity: 'हाल की गतिविधि',
    latestUpdates: 'फ्लीट के नवीनतम अपडेट',
    seeAll: 'सभी देखें',
    viewAll: 'सभी देखें',

    settings: 'सेटिंग्स',
    appearance: 'दिखावट',
    language: 'भाषा',
    light: 'लाइट',
    dark: 'डार्क',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    notifications: 'नोटिफिकेशन',
    account: 'अकाउंट',
    logout: 'लॉगआउट',
    chooseLanguage: 'अपनी भाषा चुनें',
    chooseTheme: 'अपनी थीम चुनें',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: TranslationKeys;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage =
        await AsyncStorage.getItem('appLanguage');

      if (
        savedLanguage === 'en' ||
        savedLanguage === 'hi'
      ) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Load language error:', error);
    }
  };

  const setLanguage = async (
    newLanguage: Language
  ) => {
    try {
      setLanguageState(newLanguage);

      await AsyncStorage.setItem(
        'appLanguage',
        newLanguage
      );
    } catch (error) {
      console.error('Save language error:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    );
  }

  return context;
}