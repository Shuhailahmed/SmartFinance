import api from "./api";

export const getAdminBudgets = async (params = {}) => {
  const response = await api.get("/admin/budgets", { params });
  return response.data;
};

export const updateAdminBudget = async (id, payload) => {
  const response = await api.patch(`/admin/budgets/${id}`, payload);
  return response.data;
};

export const deleteAdminBudget = async (id) => {
  const response = await api.delete(`/admin/budgets/${id}`);
  return response.data;
};

export const exportAdminBudgets = async (params = {}) => {
  const response = await api.get("/admin/budgets/export", {
    params,
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admin-budgets-${params.year || new Date().getFullYear()}-${params.month || new Date().getMonth() + 1}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
