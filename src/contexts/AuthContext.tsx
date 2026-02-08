"use client";

import React, { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export interface User {
  id: string;
  name: string;
  email: string;
  userType: "student" | "instructor";
  // Optional profile fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  languages?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  avatarUrl?: string;
  photoURL?: string; // Alias for avatarUrl (used in some components)
  city?: string;
  zipCode?: string;
  transmission?: "automatic" | "manual" | "";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    userType: "student" | "instructor"
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * useAuth hook - Provides backward compatibility with existing components
 * Now powered by Clerk authentication
 */
export const useAuth = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Convert Clerk user to our User interface
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        userType: (clerkUser.publicMetadata?.userType as "student" | "instructor") || "student",
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
        photoURL: clerkUser.imageUrl || undefined,
      }
    : null;

  // Login is now handled by Clerk's SignIn component
  const login = async (_email: string, _password: string): Promise<boolean> => {
    console.warn("login() is deprecated. Use Clerk's SignIn component instead.");
    return false;
  };

  // Signup is now handled by Clerk's SignUp component
  const signup = async (
    _name: string,
    _email: string,
    _password: string,
    _userType: "student" | "instructor"
  ): Promise<boolean> => {
    console.warn("signup() is deprecated. Use Clerk's SignUp component instead.");
    return false;
  };

  // Logout using Clerk
  const logout = () => {
    signOut({ redirectUrl: "/" });
  };

  // Update user - For now, this logs a warning. 
  // In production, you'd update Clerk user metadata via their API
  const updateUser = (_updates: Partial<User>) => {
    console.warn(
      "updateUser() requires Clerk Backend API. Use Clerk's UserProfile component or their API for user updates."
    );
  };

  // Update password - Clerk handles this via their UserProfile component
  const updatePassword = async (
    _currentPassword: string,
    _newPassword: string
  ): Promise<boolean> => {
    console.warn(
      "updatePassword() is deprecated. Use Clerk's UserProfile component for password management."
    );
    return false;
  };

  return {
    user,
    login,
    signup,
    logout,
    isLoading: !isLoaded,
    updateUser,
    updatePassword,
  };
};

/**
 * AuthProvider - Legacy wrapper component
 * No longer needed as ClerkProvider handles authentication,
 * but kept for backward compatibility with existing code structure
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // The provider is now a pass-through since Clerk handles auth
  // We keep it for backward compatibility with existing code
  return <>{children}</>;
};
