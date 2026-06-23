import * as React from 'react';
import apiClient from '../services/apiClient';

const { createContext, useContext, useState, useEffect } = React;

export interface UserProfileType {
  name: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  profileImage: string | null;
}

interface AuthContextType {
  user: { id: string; email: string; username: string; role?: string; isEmailVerified?: boolean } | null;
  token: string | null;
  profile: UserProfileType | null;
  hasUnsavedChanges: boolean;
  login: (token: string, userData: { id: string; email: string; username: string; role?: string; isEmailVerified?: boolean }) => void;
  logout: () => void;
  updateProfileState: (newProfile: UserProfileType) => void;
  refreshProfile: () => Promise<void>;
  setHasUnsavedChanges: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; username: string; role?: string; isEmailVerified?: boolean } | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const generateFallbackProfile = (userData: typeof user) => {
    return {
      name: userData?.username || 'John Doe',
      age: 28,
      sex: 'male',
      height: 175,
      weight: 70,
      activityLevel: 'moderately_active',
      goal: 'recomposition',
      profileImage: null
    };
  };

  const fetchProfile = async (currentToken: string, currentUser: typeof user) => {
    try {
      const response = await apiClient.get('/api/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const payload = response.data;
      if (payload && payload.success && payload.data?.userProfile) {
        setProfile(payload.data.userProfile);
      } else {
        setProfile(generateFallbackProfile(currentUser));
      }
    } catch (err) {
      console.error('Error fetching profile in AuthContext:', err);
      setProfile(generateFallbackProfile(currentUser));
    }
  };

  const refreshProfile = async () => {
    if (token && user) {
      await fetchProfile(token, user);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchProfile(token, user);
    } else {
      setProfile(null);
    }
  }, [token]);

  const login = (newToken: string, userData: { id: string; email: string; username: string; role?: string; isEmailVerified?: boolean }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    fetchProfile(newToken, userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setProfile(null);
    setHasUnsavedChanges(false);
  };

  const updateProfileState = (newProfile: UserProfileType) => {
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      profile,
      hasUnsavedChanges,
      login,
      logout,
      updateProfileState,
      refreshProfile,
      setHasUnsavedChanges
    }}>
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

