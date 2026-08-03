export interface AlertTemplate {
  id: string;
  category: 'weather' | 'emergency' | 'catch_log' | 'port_alert';
  title: string;
  tagline: string;
  templateText: string;
  sampleVariables?: Record<string, string>;
}

export const FISHERMAN_ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  high_wave: {
    id: 'high_wave',
    category: 'weather',
    title: 'High Wave / Sea Advisory',
    tagline: 'Malalaking Alon Warning',
    templateText: '[PAROLA ALERT] Babala sa mga mangingisda: Malalaking alon (3.5m-4.5m) sa Look ng Maynila. Mangyaring manatili muna sa daungan.',
  },
  storm_emergency: {
    id: 'storm_emergency',
    category: 'emergency',
    title: 'Storm Emergency SOS',
    tagline: 'Signal No. 2 Emergency Alert',
    templateText: '[PAROLA SOS] URGENT: Signal No. 2. Lahat ng sasakyang pandagat ay pinapayuhan na huwag pumalaot at humanap ng ligtas na daungan.',
  },
  catch_log: {
    id: 'catch_log',
    category: 'catch_log',
    title: 'Catch Log Confirmation',
    tagline: 'Fisherman Catch Log Receipt',
    templateText: '[PAROLA LOG] Maraming salamat Ka-Isda! Naitala ang iyong huli: {weight}kg {fishType}. Ref ID: LOG-2026-{refId}. Ligtas na paglalayag!',
    sampleVariables: {
      weight: '45',
      fishType: 'Tulingan',
      refId: '889',
    },
  },
  port_alert: {
    id: 'port_alert',
    category: 'port_alert',
    title: 'Port Security & Weather Alert',
    tagline: 'Gale & Security Broadcast',
    templateText: '[PAROLA PORT] Paalala sa daungan: Inaasahan ang malakas na hangin at ulan ngayong hapon. Seguruhin ang pagkakatali ng inyong bangka at mag-ingat sa pumapalaot.',
  },
};

export function renderTemplate(templateId: string, variables?: Record<string, string>): string {
  const template = FISHERMAN_ALERT_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  let result = template.templateText;
  if (variables) {
    Object.entries(variables).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    });
  } else if (template.sampleVariables) {
    Object.entries(template.sampleVariables).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    });
  }

  return result;
}
