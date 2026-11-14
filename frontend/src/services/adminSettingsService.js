import api from "./api";

export const getSystemSettings = async () => {
  const response = await api.get("/admin/settings");
  return response.data.data;
};

export const updateSystemSettings = async (settings) => {
  const response = await api.put("/admin/settings", settings);
  return response.data;
};
