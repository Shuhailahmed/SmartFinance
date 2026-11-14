import api from "./api";

// Register user and send OTP
const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

// Verify email OTP
const verifyEmail = async (verificationData) => {
  const response = await api.post("/auth/verify-email", {
    email: verificationData.email,
    otp: verificationData.otp,
  });

  return response.data;
};

// Resend OTP
const resendOTP = async (emailData) => {
  const response = await api.post("/auth/resend-otp", {
    email: emailData.email,
  });

  return response.data;
};

// Login user
const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

// Get current logged-in user
const getCurrentUser = async (token) => {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export { register, verifyEmail, resendOTP, login, getCurrentUser };
