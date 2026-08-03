import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../context/AppStateContext';
import { OnboardingView } from '../views/OnboardingView';
import { expect, test, describe, vi } from 'vitest';

// Mock react-leaflet because it requires a real DOM with layout for maps
vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div />,
    Marker: () => <div data-testid="map-marker" />,
    useMapEvents: ({ click }: any) => {
      // Create a global function we can trigger to simulate a map click
      (window as any).simulateMapClick = (lat: number, lng: number) => {
        click({ latlng: { lat, lng } });
      };
      return null;
    }
  };
});

const DashboardMock = () => {
  const { referencePoint } = useAppState();
  return (
    <div>
      <h1>Dashboard</h1>
      <p data-testid="ref-lat">{referencePoint?.lat}</p>
    </div>
  );
};

const renderWithProviders = () => {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingView />} />
          <Route path="/dashboard" element={<DashboardMock />} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>
  );
};

describe('Reference Point Onboarding', () => {
  test('Map interaction captures coordinates and unlocks dashboard', async () => {
    renderWithProviders();
    
    // Initial state
    expect(screen.getByText('Set Your Reference Point')).toBeInTheDocument();
    
    // Simulate map click (12.5, 121.0)
    (window as any).simulateMapClick(12.5, 121.0);
    
    // Verify marker appears and confirm button is shown
    await waitFor(() => {
      expect(screen.getByText('Confirm Port')).toBeInTheDocument();
      expect(screen.getByText(/12.5000° N/)).toBeInTheDocument();
    });
    
    // Confirm Port
    fireEvent.click(screen.getByText('Confirm Port'));
    
    // Should navigate to dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('ref-lat')).toHaveTextContent('12.5');
    });
  });
});
