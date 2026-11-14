import api from "./api";

const getDashboardData = async (token) => {
  const response = await api.get("/analytics/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const getAdvancedAnalytics = async (token) => {
  const response = await api.get("/analytics/overview", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  getDashboardData,
  getAdvancedAnalytics,
};
