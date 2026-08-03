import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../context/AppStateContext';
import { SettingsView } from '../views/SettingsView';
import { expect, test, describe } from 'vitest';

const TestWrapper: React.FC = () => {
  const { settings } = useAppState();
  
  return (
    <div>
      <div data-testid="target-category">{settings.targetCategory}</div>
      <div data-testid="target-families">{settings.targetFamilies.join(',')}</div>
      <SettingsView />
    </div>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppStateProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AppStateProvider>
  );
};

describe('Settings View', () => {
  test('Changing target category updates global state', async () => {
    renderWithProviders(<TestWrapper />);
    
    expect(screen.getByTestId('target-category')).toHaveTextContent('All');

    fireEvent.click(screen.getByRole('button', { name: 'Pelagic' }));

    await waitFor(() => {
      expect(screen.getByTestId('target-category')).toHaveTextContent('Pelagic');
    });
  });

  test('Toggling a fish family updates global state', async () => {
    renderWithProviders(<TestWrapper />);
    
    // Initial state is empty (All)
    expect(screen.getByTestId('target-families')).toHaveTextContent('');

    // Click on Scombridae button
    fireEvent.click(screen.getByRole('button', { name: /Scombridae/i }));

    // Global state should now include Scombridae
    await waitFor(() => {
      expect(screen.getByTestId('target-families')).toHaveTextContent('Scombridae');
    });
  });
});
