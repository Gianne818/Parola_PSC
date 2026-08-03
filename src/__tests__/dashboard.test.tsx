import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../context/AppStateContext';
import { DashboardView } from '../views/DashboardView';
import { expect, test, describe, vi } from 'vitest';

// Mock Leaflet map to avoid JSDOM errors
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  CircleMarker: () => <div data-testid="circle-marker" />,
  useMapEvents: () => ({}),
}));

const TestWrapper: React.FC = () => {
  const { setReferencePoint } = useAppState();
  React.useEffect(() => {
    setReferencePoint({ lat: 11.0, lng: 122.5, locationName: 'Iloilo' });
  }, [setReferencePoint]);
  
  return <DashboardView />;
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

describe('Dashboard SMS Feedback', () => {
  test('Clicking SMS reply updates advisory status', async () => {
    renderWithProviders(<TestWrapper />);
    
    // Ensure dashboard rendered
    await waitFor(() => {
      expect(screen.getByText(/PAROLA ADVISORY/)).toBeInTheDocument();
    });

    // Check that feedback is not submitted initially
    expect(screen.queryByText(/Feedback Submitted/)).not.toBeInTheDocument();

    // Click "High Catch (1)"
    fireEvent.click(screen.getByRole('button', { name: /High Catch/i }));

    // Verify it updates to Feedback Submitted
    await waitFor(() => {
      expect(screen.getByText(/Feedback Submitted/)).toBeInTheDocument();
    });
  });
});
