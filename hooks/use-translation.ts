import { storageService } from "../services/storageService";

export type Language = 'en' | 'tl' | 'ceb' | 'hil';

export const DICTIONARY = {
  appName: {
    en: "Parola",
    tl: "Parola",
    ceb: "Parola",
    hil: "Parola"
  },
  beaconSubtitle: {
    en: "Maritime beacon for Filipino fishermen",
    tl: "Gabay na liwanag para sa mga mangingisdang Pilipino",
    ceb: "Suga sa giya alang sa mga mananagat nga Pilipino",
    hil: "Suga nga giya para sa mga mangingisda nga Pilipino"
  },
  startForFree: {
    en: "Start for Free",
    tl: "Simulan nang Libre",
    ceb: "Sugod nga Libre",
    hil: "Sugod nga Libre"
  },
  smsFreeBadge: {
    en: "Free via SMS — No mobile data needed",
    tl: "Libre via SMS — Walang data na kailangan",
    ceb: "Libre via SMS — Dili kinahanglan og data",
    hil: "Libre via SMS — Wala sing data nga kinahanglan"
  },
  landingTitle: {
    en: "One tool to manage hotspots and your fleet",
    tl: "Isang kasangkapan para sa hotspots at inyong plota",
    ceb: "Usa ka himan sa pagdumala sa hotspots ug imong plota",
    hil: "Isa ka rason para mag-asenso sa hotspots kag plota"
  },
  login: {
    en: "Log In",
    tl: "Mag-login",
    ceb: "Log In",
    hil: "Log In"
  },
  register: {
    en: "Register Now",
    tl: "Magparehistro",
    ceb: "Rehistro Karon",
    hil: "Magparehistro Karon"
  },
  phone: {
    en: "Phone Number",
    tl: "Numero ng Telepono",
    ceb: "Numero sa Telepono",
    hil: "Numero sang Telepono"
  },
  password: {
    en: "Password",
    tl: "Password",
    ceb: "Password",
    hil: "Password"
  },
  vesselName: {
    en: "Vessel Name",
    tl: "Pangalan ng Bangka",
    ceb: "Pangalan sa Bangka",
    hil: "Pangalan sang Bangka"
  },
  licenseNo: {
    en: "BFAR License Number",
    tl: "Numero ng Lisensya sa BFAR",
    ceb: "Numero sa Lisensya sa BFAR",
    hil: "Numero sang Lisensya sa BFAR"
  },
  homePort: {
    en: "Home Port Anchorage",
    tl: "Himpilang Port",
    ceb: "Dunggoanan",
    hil: "Himpilan sang Bangka"
  },
  dashboard: {
    en: "Dashboard",
    tl: "Dashboard",
    ceb: "Dashboard",
    hil: "Dashboard"
  },
  fuel: {
    en: "Co-op Fuel",
    tl: "Krudo Pool",
    ceb: "Krudo Pool",
    hil: "Krudo Pool"
  },
  alerts: {
    en: "Alerts",
    tl: "Alerto",
    ceb: "Alerto",
    hil: "Alerto"
  },
  profile: {
    en: "Profile",
    tl: "Profile",
    ceb: "Profile",
    hil: "Profile"
  },
  settings: {
    en: "Settings",
    tl: "Settings",
    ceb: "Settings",
    hil: "Settings"
  },
  logout: {
    en: "Logout",
    tl: "Mag-logout",
    ceb: "Logout",
    hil: "Logout"
  },
  favorableSail: {
    en: "Favorable to Sail",
    tl: "Ligtas Pumalaot",
    ceb: "Luwas Molawig",
    hil: "Ligtas Magpalaot"
  },
  holdSail: {
    en: "Hold Sail / Caution",
    tl: "Babala: Huwag Pumalaot",
    ceb: "Pahimangno: Ayaw Molawig",
    hil: "Paandam: Indi Magpalaot"
  },
  waves: {
    en: "Wave Height",
    tl: "Taas ng Alon",
    ceb: "Gitas-on sa Alon",
    hil: "Taas sang Balod"
  },
  wind: {
    en: "Wind Speed",
    tl: "Bilis ng Hangin",
    ceb: "Kapasidad sa Hangin",
    hil: "Kusog sang Hangin"
  },
  tide: {
    en: "Tide Level",
    tl: "Lebel ng Joar",
    ceb: "Lebel sa Taub",
    hil: "Lebel sang Taub"
  },
  seaTemp: {
    en: "Sea Surface Temp",
    tl: "Temperatura ng Dagat",
    ceb: "Temperatura sa Dagat",
    hil: "Temperatura sang Dagat"
  },
  stormSignal: {
    en: "PAGASA Storm Signal",
    tl: "PAGASA Storm Signal",
    ceb: "PAGASA Storm Signal",
    hil: "PAGASA Storm Signal"
  },
  hotspotsCount: {
    en: "Active Hotspots",
    tl: "Aktibong Hotspots",
    ceb: "Aktibong Hotspots",
    hil: "Aktibong Hotspots"
  },
  distance: {
    en: "Distance",
    tl: "Distansya",
    ceb: "Distansya",
    hil: "Distansya"
  },
  bearing: {
    en: "Bearing",
    tl: "Direksyon",
    ceb: "Direksyon",
    hil: "Direksyon"
  },
  sosButton: {
    en: "Trigger Emergency SOS",
    tl: "I-trigger ang SOS",
    ceb: "I-trigger ang SOS",
    hil: "I-trigger ang SOS"
  },
  voiceAssist: {
    en: "Voice Assist",
    tl: "Boses na Gabay",
    ceb: "Tingog nga Giya",
    hil: "Tingog nga Giya"
  }
};

export function getTranslation(lang: Language, key: keyof typeof DICTIONARY): string {
  const translations = DICTIONARY[key];
  if (!translations) return String(key);
  return translations[lang] || translations['en'];
}

export function useTranslation(lang: Language) {
  const t = (key: keyof typeof DICTIONARY) => getTranslation(lang, key);
  return { t, currentLang: lang };
}
