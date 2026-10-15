import { describe, expect, it } from 'vitest';
import { STEPS } from '@/components/information/guide-data';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { AUTH_COPY } from '@/components/auth/auth-copy';

describe('current journey instructions', () => {
  it('uses existing registration, port and dashboard controls', () => {
    const instructions = STEPS.flatMap(step => step.instructions).join(' ');
    expect(instructions).toContain('Select Continue');
    expect(instructions).toContain('Confirm home port');
    expect(instructions).toContain('Change home port');
    expect(instructions).toContain(DASHBOARD_COPY.en.filterFish);
    expect(instructions).not.toContain('Confirm Port & Finish');
    expect(instructions).not.toContain('Edit Vessel Info');
    expect(instructions).not.toContain('Expand a species list');
  });
  it('keeps demo contact, manual messaging and historical images explicit', () => {
    expect(AUTH_COPY.en.demoNotice).toContain('No verification SMS');
    expect(DASHBOARD_COPY.en.smsDescription).toContain('does not schedule automatic advisories');
    expect(DASHBOARD_COPY.en.smsAccepted).toContain('Delivery has not been confirmed');
    const advisor = STEPS.find(step => step.id === 'municipal-advisor')!;
    expect(advisor.imageCaption).toContain('Historical');
    expect(advisor.instructions.join(' ')).toContain('does not supply tide readings');
    expect(STEPS.flatMap(step => step.instructions).join(' ')).toContain('selected weekdays');
  });
});
