import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as OidcUser } from 'oidc-client-ts';
import { userManager } from './authService';
import type { AuthUser, Role } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isMockMode: boolean;
  setMockRole: (role: Role | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setMockRoleState] = useState<Role | null>(null);

  const isMockMode = !userManager;

  const parseOidcUser = (oidcUser: OidcUser): AuthUser => {
    const profile = oidcUser.profile;
    const rawGroups = (profile['cognito:groups'] as string[]) || [];
    const roles: Role[] = rawGroups.filter((g): g is Role =>
      ['DONANTE', 'GESTOR', 'AUDITOR'].includes(g)
    );

    return {
      sub: profile.sub,
      email: (profile.email as string) || 'usuario@aqp-solidaria.org',
      roles: roles.length > 0 ? roles : ['DONANTE'],
      accessToken: oidcUser.access_token,
    };
  };

  useEffect(() => {
    if (userManager) {
      userManager.getUser().then((loadedUser) => {
        if (loadedUser && !loadedUser.expired) {
          setUser(parseOidcUser(loadedUser));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }).catch(() => {
        setUser(null);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    if (userManager) {
      await userManager.signinRedirect();
    } else {
      setMockRole('DONANTE');
    }
  }, []);

  const logout = useCallback(async () => {
    if (userManager) {
      try {
        await userManager.signoutRedirect();
      } catch {
        await userManager.removeUser();
      }
    }
    setUser(null);
    setMockRoleState(null);
  }, []);

  const setMockRole = useCallback((role: Role | null) => {
    setMockRoleState(role);
    if (!role) {
      setUser(null);
      return;
    }

    const mockSub = role === 'DONANTE' ? 'usr-donor-123' : (role === 'GESTOR' ? 'usr-gestor-456' : 'usr-auditor-789');
    const mockEmail = `${role.toLowerCase()}@aqp-solidaria.org`;

    setUser({
      sub: mockSub,
      email: mockEmail,
      roles: [role],
      accessToken: `mock-token-for-${role.toLowerCase()}`,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isMockMode, setMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
