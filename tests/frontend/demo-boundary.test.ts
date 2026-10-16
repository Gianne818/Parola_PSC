import React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const route = vi.hoisted(() => ({ pathname: '/register' as string | null }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('@/components/application/LiveApplication', () => ({ default: ({ children }: { children: React.ReactNode }) => React.createElement('section', null, 'LIVE APP ', children) }));

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('registration demo application boundary', () => {
  it.each(['/register', '/register/', '/login', '/login/'])('renders %s without initializing a live provider', async pathname => {
    route.pathname = pathname;
    const { default: Boundary } = await import('@/components/application/ApplicationBoundary');
    expect(renderToString(React.createElement(Boundary, null, React.createElement('p', null, 'DEMO CONTROLS')))).toBe('<p>DEMO CONTROLS</p>');
  });

  it('renders nothing while the router is unknown instead of initializing auth', async () => {
    route.pathname = null;
    const { default: Boundary } = await import('@/components/application/ApplicationBoundary');
    expect(renderToString(React.createElement(Boundary, null, 'NO CONTROLS'))).toBe('');
  });

  it.each(['/', '/dashboard'])('preserves the live application boundary for %s and requires a fresh document before demo entry', async pathname => {
    vi.stubGlobal('window', {});
    route.pathname = pathname;
    const { default: Boundary } = await import('@/components/application/ApplicationBoundary');
    // First server render suspends while the mocked live chunk resolves.
    renderToString(React.createElement(Boundary, null, 'EXISTING FRONTEND'));
    await vi.dynamicImportSettled();
    expect(renderToString(React.createElement(Boundary, null, 'EXISTING FRONTEND'))).toContain('LIVE APP');
    route.pathname = '/register';
    const html = renderToString(React.createElement(Boundary, null, 'DEMO CONTROLS'));
    expect(html).toContain('Opening the isolated registration demo');
    expect(html).not.toContain('DEMO CONTROLS');
    expect(html).not.toContain('LIVE APP');
  });
});
