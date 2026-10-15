import { createContext, useContext } from 'react';

// A test-only context replaces the production provider before bundling.
export const FixtureContext = createContext<any>(null);
export const useApp = () => useContext(FixtureContext);
