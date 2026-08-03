import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '../context/AppStateContext';
import { RegisterView } from '../views/RegisterView';
import { SignInView } from '../views/SignInView';
import { expect, test, describe } from 'vitest';

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </AppStateProvider>
  );
};

describe('Authentication Flows', () => {
  test('SignIn and Register are separate views', () => {
    renderWithProviders(<SignInView />, { route: '/login' });
    expect(screen.getByText('Log into your account')).toBeInTheDocument();
    expect(screen.queryByText('Create a new account')).not.toBeInTheDocument();
  });

  test('Entering OTP 482910 successfully verifies registration', async () => {
    renderWithProviders(<RegisterView />, { route: '/register' });
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('+63 900 000 0000'), { target: { value: '09123456789' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    // Modal appears
    await waitFor(() => {
      expect(screen.getByText(/Your Parola verification code is 482910/i)).toBeInTheDocument();
    });
    
    // Enter correct OTP
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '482910' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    
    // Verification should be successful (modal closes, state updates, but we just check if modal disappears)
    await waitFor(() => {
      expect(screen.queryByText(/Your Parola verification code is 482910/i)).not.toBeInTheDocument();
    });
  });
});
