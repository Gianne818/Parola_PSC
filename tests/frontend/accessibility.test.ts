import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OfflineGeoPackModal } from '@/components/ui/OfflineGeoPackModal';
import { getBaseFontSize } from '@/utils/fontScale';

describe('existing sample export accessibility', () => {
  it('exposes a named native dialog and selected choices without relying on color', () => {
    const html = renderToStaticMarkup(React.createElement(OfflineGeoPackModal, { isOpen: true, onClose() {} }));
    const label = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/)?.[1];
    expect(label).toBeTruthy();
    expect(html).toContain(`id="${label}"`);
    expect(html.match(/role="group"/g)).toHaveLength(2);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Close modal"');
  });

  it('does not expose closed controls', () => {
    expect(renderToStaticMarkup(React.createElement(OfflineGeoPackModal, { isOpen: false, onClose() {} }))).toBe('');
  });

  it('keeps dashboard text relative to the browser font preference', () => {
    expect(getBaseFontSize(0)).toBe('1rem');
    expect(getBaseFontSize(4)).toBe('1.4375rem');
  });
});
