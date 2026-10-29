/**
 * Authentication Context for QUANG HƯNG.
 * Handles current user, login modals, role-based views, and active streak state.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, StreakStats } from '../types/index';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  streak: StreakStats | null;
  loading: boolean;
  loginAsTeacher: (pin?: string, username?: string, password?: string) => Promise<void>;
  loginAsStudent: (identifier: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateStreak: (newStreak: StreakStats) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        if (data.streak) {
          setStreak(data.streak);
        }
      } else {
        setUser(null);
        setStreak(null);
      }
    } catch {
      setUser(null);
      setStreak(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginAsTeacher = async (pin?: string, username?: string, password?: string) => {
    const res = await api.teacherLogin(pin, username, password);
    setUser(res.user);
    setStreak(null);
    setShowLoginModal(false);
  };

  const loginAsStudent = async (identifier: string, password?: string) => {
    const res = await api.studentLogin(identifier, password);
    setUser(res.user);
    setStreak(res.streak);
    setShowLoginModal(false);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setStreak(null);
  };

  const updateStreak = (newStreak: StreakStats) => {
    setStreak(newStreak);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        streak,
        loading,
        loginAsTeacher,
        loginAsStudent,
        logout,
        refreshUser,
        updateStreak,
        showLoginModal,
        setShowLoginModal,
      }}
    >
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
