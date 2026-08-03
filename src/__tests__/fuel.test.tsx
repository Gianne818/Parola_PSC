import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../context/AppStateContext';
import { FuelOrderingView } from '../views/FuelOrderingView';
import { expect, test, describe } from 'vitest';

// Component to mock reference point before rendering fuel view
const TestWrapper: React.FC = () => {
  const { setReferencePoint } = useAppState();
  React.useEffect(() => {
    // Set a reference point exactly at Iloilo North Pool (11.0, 122.5)
    setReferencePoint({ lat: 11.0, lng: 122.5, locationName: 'Iloilo' });
  }, [setReferencePoint]);
  
  return <FuelOrderingView />;
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

describe('Bulk Fuel Ordering', () => {
  test('Filters pools within 50km and correctly increments the selected pool', async () => {
    renderWithProviders(<TestWrapper />);
    
    // Since reference point is (11.0, 122.5), Iloilo North Pool is 0.0km away.
    // Navotas (14.6, 120.9) is > 300km away. So only Iloilo North and maybe Estancia should show up.
    
    await waitFor(() => {
      expect(screen.getByText(/Iloilo North Pool/)).toBeInTheDocument();
      // Should not show Navotas Fishery Pool
      expect(screen.queryByText(/Navotas Fishery Pool/)).not.toBeInTheDocument();
    });

    // Initial pool volume for Iloilo North Pool is 1420
    expect(screen.getByText(/1,420/)).toBeInTheDocument();
    
    // Enter volume
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '150' } });
    
    // Submit order
    fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
    
    // Check if total pooled volume updated (1420 + 150 = 1570)
    await waitFor(() => {
      expect(screen.getByText(/1,570/)).toBeInTheDocument();
    });
  });
});
