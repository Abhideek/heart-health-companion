import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'doctor' | 'patient' | null;

interface User {
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('cardiocare_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const determineRole = (email: string): UserRole => {
    return email.endsWith('@hospital.com') ? 'doctor' : 'patient';
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email && password.length >= 6) {
      const role = determineRole(email);
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const newUser = { email, name, role };
      setUser(newUser);
      localStorage.setItem('cardiocare_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const signup = async (email: string, name: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email && name && password.length >= 6) {
      const role = determineRole(email);
      const newUser = { email, name, role };
      setUser(newUser);
      localStorage.setItem('cardiocare_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cardiocare_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
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
