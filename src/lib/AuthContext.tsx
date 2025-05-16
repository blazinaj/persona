import { createContext } from 'react';

export const AuthContext = createContext<{
  user: any;
  signOut: () => Promise<void>;
}>({
  user: null,
  signOut: async () => {},
});