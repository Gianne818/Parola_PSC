import { describe, expect, it } from 'vitest';
import { STEPS } from '@/components/information/guide-data';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';

describe('current journey instructions', () => {
  it('uses existing registration, port and dashboard controls', () => {
    const instructions = STEPS.flatMap(step => step.instructions).join(' ');
    expect(instructions).toContain('Select Show demo code');
    expect(instructions).toContain('Confirm home port');
    expect(instructions).toContain('Change home port');
    expect(instructions).toContain(DASHBOARD_COPY.en.filterFish);
    expect(instructions).not.toContain('Confirm Port & Finish');
    expect(instructions).not.toContain('Edit Vessel Info');
    expect(instructions).not.toContain('Expand a species list');
  });
  it('keeps demo registration, manual messaging and historical images explicit', () => {
    const account = STEPS.find(step => step.id === 'create-account')!;
    expect(account.instructions.join(' ')).toContain('No phone is verified');
    expect(account.instructions.join(' ')).toContain('memory only');
    expect(account.operationalTip).toContain('Real OTP/session integration is retained separately');
    expect(account.instructions.join(' ')).toContain('No offline account');
    expect(account.imageCaption).toContain('Historical');
    expect(DASHBOARD_COPY.en.smsDescription).toContain('does not schedule automatic advisories');
    expect(DASHBOARD_COPY.en.smsAccepted).toContain('Delivery has not been confirmed');
    const advisor = STEPS.find(step => step.id === 'municipal-advisor')!;
    expect(advisor.imageCaption).toContain('Historical');
    expect(advisor.instructions.join(' ')).toContain('does not supply tide readings');
    expect(STEPS.flatMap(step => step.instructions).join(' ')).toContain('selected weekdays');
  });
});
