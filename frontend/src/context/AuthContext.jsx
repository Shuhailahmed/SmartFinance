import { createContext, useContext, useEffect, useState } from "react";

import {
  login as loginService,
  register as registerService,
  getCurrentUser,
  verifyEmail as verifyEmailService,
  resendOTP as resendOTPService,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser(token);
        setUser(data.user);
      } catch (error) {
        console.error("Authentication failed:", error);

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    return await registerService(userData);
  };

  // Verify email OTP
  const verifyEmail = async (verificationData) => {
    return await verifyEmailService(verificationData);
  };

  // Resend OTP
  const resendOTP = async (emailData) => {
    return await resendOTPService(emailData);
  };

  // Login user
  const login = async (credentials) => {
    const data = await loginService(credentials);

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // Update global user state
  const updateUser = (updatedUser) => {
    setUser((previousUser) => ({
      ...previousUser,
      ...updatedUser,
    }));
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        resendOTP,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Auth Hook
export const useAuth = () => {
  return useContext(AuthContext);
};
