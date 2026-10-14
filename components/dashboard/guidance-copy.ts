import type { Language } from '@/types';

const messages = {
  portWeather: ['Weather near your home port', 'Panahon malapit sa iyong daungan', 'Panahon duol sa imong pantalan', 'Panahon malapit sa imo pantalan'],
  areaWeather: ['Weather near this fishing area', 'Panahon malapit sa lugar na ito', 'Panahon duol niini nga pangisdaanan', 'Panahon malapit sa sini nga pangisdaanan'],
  forecast: ['Forecast', 'Pagtataya', 'Banabana', 'Banabana'],
  forecastTime: ['Forecast time', 'Oras ng pagtataya', 'Oras sa banabana', 'Oras sang banabana'],
  retrieved: ['Retrieved', 'Kinuha', 'Gikuha', 'Ginkuha'],
  outdated: ['Outdated', 'Luma', 'Karaan', 'Daan'],
  refreshWeather: ['Refresh weather', 'I-refresh ang panahon', 'I-refresh ang panahon', 'I-refresh ang panahon'],
  gridNote: ['These are forecasts near this location. Nearby areas can share the same forecast grid cell.', 'Mga pagtataya ito malapit sa lokasyong ito. Maaaring pareho ang forecast grid cell ng magkalapit na lugar.', 'Mga banabana kini duol niining lokasyon. Ang duol nga mga lugar mahimong pareho og forecast grid cell.', 'Mga banabana ini malapit sa sini nga lokasyon. Ang malapit nga mga lugar mahimo pareho sang forecast grid cell.'],
  regionalNote: ['Storm and hold records apply to the advisory region.', 'Ang tala ng bagyo at hold ay para sa rehiyon ng abiso.', 'Ang mga tala sa bagyo ug hold alang sa rehiyon sa pahibalo.', 'Ang mga tala sang bagyo kag hold para sa rehiyon sang abiso.'],
  zoneCaution: ['Available wind or wave forecasts reach a Parola hold threshold. Read the advisory before considering a trip.', 'Umabot sa threshold ng Parola hold ang available na pagtataya ng hangin o alon. Basahin ang abiso bago mag-isip na pumalaot.', 'Ang anaa nga banabana sa hangin o balod miabot sa Parola hold threshold. Basaha ang pahibalo sa dili pa maghunahuna sa paglawig.', 'Ang anaa nga banabana sang hangin ukon balod nag-abot sa Parola hold threshold. Basaha ang abiso antes maghunahuna sa paglawig.'],
  lastPredictions: ['Last available predictions', 'Huling available na mga prediksiyon', 'Kataposang anaa nga mga prediksiyon', 'Kataposan nga anaa nga mga prediksiyon'],
  earlierDates: ['Some areas have earlier prediction dates.', 'May mas lumang petsa ng prediksiyon ang ilang lugar.', 'Ang ubang lugar adunay mas karaang petsa sa prediksiyon.', 'Ang iban nga lugar may mas daan nga petsa sang prediksiyon.'],
  capped: ['Loaded {returned} of {total} regional areas. Filters apply to loaded areas.', 'Na-load ang {returned} sa {total} lugar sa rehiyon. Para sa na-load na lugar ang mga filter.', 'Na-load ang {returned} sa {total} ka lugar sa rehiyon. Ang mga filter alang sa na-load nga mga lugar.', 'Na-load ang {returned} sa {total} ka lugar sa rehiyon. Ang mga filter para sa na-load nga mga lugar.'],
  sourceLocations: ['Forecast locations', 'Mga lokasyon ng pagtataya', 'Mga lokasyon sa banabana', 'Mga lokasyon sang banabana'],
  requested: ['Requested location', 'Hiniling na lokasyon', 'Gihangyong lokasyon', 'Ginpangayo nga lokasyon'],
  windGrid: ['Wind forecast grid', 'Grid ng pagtataya ng hangin', 'Grid sa banabana sa hangin', 'Grid sang banabana sang hangin'],
  waveGrid: ['Wave forecast grid', 'Grid ng pagtataya ng alon', 'Grid sa banabana sa balod', 'Grid sang banabana sang balod'],
} satisfies Record<string, readonly [string, string, string, string]>;

export type GuidanceCopy = { [Key in keyof typeof messages]: string };
export const GUIDANCE_COPY = Object.fromEntries((['en', 'tl', 'ceb', 'hil'] as const).map((language, index) =>
  [language, Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]]))],
)) as Record<Language, GuidanceCopy>;
