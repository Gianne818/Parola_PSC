import type { Language } from '@/types';

const messages = {
  intro: ['References you can open without leaving the app: the system guide, vessel pricing, and the Parola mission brief.', 'Mga sangguniang mabubuksan dito sa app: gabay sa paggamit, presyo para sa bangka, at layunin ng Parola.', 'Mga reperensiya nga maablihan dinhi sa app: giya sa paggamit, presyo alang sa bangka, ug katuyoan sa Parola.', 'Mga reperensiya nga mabuksan diri sa app: giya sa paggamit, presyo para sa bangka, kag katuyuan sang Parola.'],
  guideTitle: ['System guide', 'Gabay sa paggamit', 'Giya sa paggamit', 'Giya sa paggamit'],
  guideDescription: ['Practical lessons on registration, reading SMS advisories, fishing areas, and responding to holds.', 'Mga praktikal na aralin sa pagpaparehistro, pagbasa ng SMS na abiso, mga lugar ng pangisdaan, at pagtugon sa hold.', 'Praktikal nga mga leksiyon sa pagparehistro, pagbasa sa SMS nga pahibalo, mga pangisdaan, ug pagtubag sa hold.', 'Praktikal nga mga leksiyon sa pagparehistro, pagbasa sang SMS nga abiso, mga pangisdaan, kag pagsabat sa hold.'],
  pricingTitle: ['Vessel pricing', 'Presyo para sa bangka', 'Presyo alang sa bangka', 'Presyo para sa bangka'],
  pricingDescription: ['Free Standard access, proposed commercial prices, sample exports and planned fleet features.', 'Libreng Standard access, panukalang presyo, halimbawang export at planong fleet features.', 'Libreng Standard access, gisugyot nga presyo, sample exports ug giplanong fleet features.', 'Libre nga Standard access, ginapanukala nga presyo, sample exports kag ginaplano nga fleet features.'],
  aboutTitle: ['About Parola', 'Tungkol sa Parola', 'Mahitungod sa Parola', 'Parte sa Parola'],
  aboutDescription: ['Why Parola prioritizes basic phones, coastal access, and guidance before departure.', 'Bakit inuuna ng Parola ang mga basic phone, access sa baybayin, at gabay bago bumiyahe.', 'Ngano nga giuna sa Parola ang basic nga mga telepono, access sa baybayon, ug giya sa dili pa molarga.', 'Ngaa ginauna sang Parola ang basic nga mga telepono, access sa baybayon, kag giya antes maglakat.'],
  open: ['Open', 'Buksan', 'Ablihi', 'Buksa'],
  reference: ['At-sea quick reference', 'Mabilis na sanggunian sa dagat', 'Daling reperensiya sa dagat', 'Madasig nga reperensiya sa dagat'],
  wave: ['Wave hold threshold', 'Pamantayan ng hold sa alon', 'Sukdanan sa hold sa balod', 'Sukdanan sang hold sa balod'],
  wind: ['Wind hold threshold', 'Pamantayan ng hold sa hangin', 'Sukdanan sa hold sa hangin', 'Sukdanan sang hold sa hangin'],
  emergency: ['Emergency channel', 'Channel sa emergency', 'Channel sa emerhensiya', 'Channel sa emerhensiya'],
  dispatch: ['SMS access', 'Access sa SMS', 'Access sa SMS', 'Access sa SMS'],
  onRequest: ['Manual portal request', 'Manu-manong hiling sa portal', 'Manwal nga hangyo sa portal', 'Manwal nga pangabay sa portal'],
  referenceNote: ['These are the current app thresholds, not official sailing clearance or validated rules for every vessel. Automatic SMS scheduling is planned. Follow current official warnings; portal use and future voluntary reporting need internet.', 'Mga kasalukuyang threshold ito ng app, hindi opisyal na pahintulot na pumalaot o beripikadong tuntunin para sa bawat bangka. Plano pa ang awtomatikong SMS. Sundin ang opisyal na babala; kailangan ng internet sa portal at planong boluntaryong pag-uulat.', 'Kini ang kasamtangang thresholds sa app, dili opisyal nga pagtugot sa paglawig o validated nga lagda sa matag bangka. Giplano pa ang awtomatikong SMS. Sunda ang opisyal nga pahimangno; kinahanglan og internet sa portal ug umaabot nga boluntaryong pagreport.', 'Amo ini ang subong nga thresholds sang app, indi opisyal nga pagtugot sa paglawig ukon validated nga pagsulundan sa tagsa ka bangka. Ginaplano pa ang awtomatiko nga SMS. Sunda ang opisyal nga paandam; kinahanglan sang internet sa portal kag palaabuton nga boluntaryo nga pagreport.'],
} as const;

type ResourceCopy = Record<keyof typeof messages, string>;
export const RESOURCE_COPY = Object.fromEntries(
  (['en', 'tl', 'ceb', 'hil'] as const).map((language, index) => [language,
    Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])),
  ]),
) as Record<Language, ResourceCopy>;
