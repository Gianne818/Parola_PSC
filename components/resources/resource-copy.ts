import type { Language } from '@/types';

const messages = {
  intro: ['References you can open without leaving the app: the system guide, vessel pricing, and the Parola mission brief.', 'Mga sangguniang mabubuksan dito sa app: gabay sa paggamit, presyo para sa bangka, at layunin ng Parola.', 'Mga reperensiya nga maablihan dinhi sa app: giya sa paggamit, presyo alang sa bangka, ug katuyoan sa Parola.', 'Mga reperensiya nga mabuksan diri sa app: giya sa paggamit, presyo para sa bangka, kag katuyuan sang Parola.'],
  guideTitle: ['System guide', 'Gabay sa paggamit', 'Giya sa paggamit', 'Giya sa paggamit'],
  guideDescription: ['Practical lessons on registration, reading SMS advisories, fishing areas, and responding to holds.', 'Mga praktikal na aralin sa pagpaparehistro, pagbasa ng SMS na abiso, mga lugar ng pangisdaan, at pagtugon sa hold.', 'Praktikal nga mga leksiyon sa pagparehistro, pagbasa sa SMS nga pahibalo, mga pangisdaan, ug pagtubag sa hold.', 'Praktikal nga mga leksiyon sa pagparehistro, pagbasa sang SMS nga abiso, mga pangisdaan, kag pagsabat sa hold.'],
  pricingTitle: ['Vessel pricing', 'Presyo para sa bangka', 'Presyo alang sa bangka', 'Presyo para sa bangka'],
  pricingDescription: ['Municipal access, commercial vessel plans, daily zone quotas, and fleet terms.', 'Access para sa munisipal na bangka, mga plano para sa komersiyal na bangka, pang-araw-araw na quota ng lugar, at tuntunin para sa fleet.', 'Access alang sa municipal nga bangka, mga plano sa commercial nga bangka, adlaw-adlaw nga quota sa lugar, ug mga termino sa fleet.', 'Access para sa municipal nga bangka, mga plano sa commercial nga bangka, adlaw-adlaw nga quota sang lugar, kag mga termino sang fleet.'],
  aboutTitle: ['About Parola', 'Tungkol sa Parola', 'Mahitungod sa Parola', 'Parte sa Parola'],
  aboutDescription: ['Why Parola prioritizes basic phones, coastal access, and guidance before departure.', 'Bakit inuuna ng Parola ang mga basic phone, access sa baybayin, at gabay bago bumiyahe.', 'Ngano nga giuna sa Parola ang basic nga mga telepono, access sa baybayon, ug giya sa dili pa molarga.', 'Ngaa ginauna sang Parola ang basic nga mga telepono, access sa baybayon, kag giya antes maglakat.'],
  open: ['Open', 'Buksan', 'Ablihi', 'Buksa'],
  reference: ['At-sea quick reference', 'Mabilis na sanggunian sa dagat', 'Daling reperensiya sa dagat', 'Madasig nga reperensiya sa dagat'],
  wave: ['Wave hold threshold', 'Pamantayan ng hold sa alon', 'Sukdanan sa hold sa balod', 'Sukdanan sang hold sa balod'],
  wind: ['Wind hold threshold', 'Pamantayan ng hold sa hangin', 'Sukdanan sa hold sa hangin', 'Sukdanan sang hold sa hangin'],
  emergency: ['Emergency channel', 'Channel sa emergency', 'Channel sa emerhensiya', 'Channel sa emerhensiya'],
  dispatch: ['SMS access', 'Access sa SMS', 'Access sa SMS', 'Access sa SMS'],
  onRequest: ['On request', 'Kapag hiniling', 'Kon hangyoon', 'Kon pangayuon'],
} as const;

type ResourceCopy = Record<keyof typeof messages, string>;
export const RESOURCE_COPY = Object.fromEntries(
  (['en', 'tl', 'ceb', 'hil'] as const).map((language, index) => [language,
    Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])),
  ]),
) as Record<Language, ResourceCopy>;
