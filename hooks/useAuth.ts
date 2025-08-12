import { useState, useEffect, useCallback } from 'react';
import backendApi from '../services/backendApi';

interface AuthInfo {
  isAuthenticated: boolean;
  authToken: string | null;
  loggedInUsername: string | null;
  loading: boolean;
}

interface AuthActions {
  login: (credentials: { email?: string, password?: string, token?: string, username?: string }) => Promise<boolean>;
  register: (credentials: { email: string, password: string, username: string }) => Promise<boolean>;
  logout: () => void;
}

export const useAuth = (): { authInfo: AuthInfo, login: AuthActions['login'], register: AuthActions['register'], logout: AuthActions['logout'] } => {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    isAuthenticated: false,
    authToken: null,
    loggedInUsername: null,
    loading: true,
  });

  useEffect(() => {
    const storedToken = backendApi.getToken();
    const storedUsername = backendApi.getUsername();
    if (storedToken && storedUsername) {
      setAuthInfo({
        isAuthenticated: true,
        authToken: storedToken,
        loggedInUsername: storedUsername,
        loading: false,
      });
    } else {
      setAuthInfo({
        isAuthenticated: false,
        authToken: null,
        loggedInUsername: null,
        loading: false,
      });
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthInfo(prev => ({ ...prev, loading: true }));
    try {
      let token: string | null = credentials.token || null;
      let username: string | null = credentials.username || null;

      if (!token && credentials.email && credentials.password) {
        const response = await backendApi.auth.login({ email: credentials.email, password: credentials.password });
        token = response.data.token;
        username = response.data.user.username;
      }

      if (token && username) {
        backendApi.saveToken(token);
        backendApi.saveUsername(username);
        setAuthInfo({
          isAuthenticated: true,
          authToken: token,
          loggedInUsername: username,
          loading: false,
        });
        return true;
      }
      throw new Error("Invalid credentials or token.");
    } catch (error) {
      console.error("Login failed:", error);
      backendApi.clearToken();
      backendApi.clearUsername();
      setAuthInfo({
        isAuthenticated: false,
        authToken: null,
        loggedInUsername: null,
        loading: false,
      });
      return false;
    }
  }, []);

  const register = useCallback(async (credentials) => {
    setAuthInfo(prev => ({ ...prev, loading: true }));
    try {
      const response = await backendApi.auth.register(credentials);
      const { token, user } = response.data;
      if (token && user.username) {
        backendApi.saveToken(token);
        backendApi.saveUsername(user.username);
        setAuthInfo({
          isAuthenticated: true,
          authToken: token,
          loggedInUsername: user.username,
          loading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      backendApi.clearToken();
      backendApi.clearUsername();
      setAuthInfo({
        isAuthenticated: false,
        authToken: null,
        loggedInUsername: null,
        loading: false,
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    backendApi.clearToken();
    backendApi.clearUsername();
    setAuthInfo({
      isAuthenticated: false,
      authToken: null,
      loggedInUsername: null,
      loading: false,
    });
  }, []);

  return { authInfo, login, register, logout };
};
