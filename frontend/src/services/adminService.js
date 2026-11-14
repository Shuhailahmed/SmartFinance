import api from "./api";

export const getAdminStats = async () =>
  (await api.get("/admin/dashboard/stats")).data;

export const getRecentUsers = async (limit = 5) =>
  (await api.get("/admin/users/recent", { params: { limit } })).data;

export const getActivityLogs = async (limit = 6) =>
  (await api.get("/admin/activity-logs", { params: { limit } })).data;

export const getIncomeExpenseData = async () =>
  (await api.get("/admin/analytics/income-expenses")).data;

export const getExpenseBreakdown = async () =>
  (await api.get("/admin/analytics/expense-breakdown")).data;

export const getAdminDashboard = async () => {
  const [stats, recentUsers, activityLogs, incomeExpense, expenseBreakdown] =
    await Promise.all([
      getAdminStats(),
      getRecentUsers(),
      getActivityLogs(),
      getIncomeExpenseData(),
      getExpenseBreakdown(),
    ]);

  return { stats, recentUsers, activityLogs, incomeExpense, expenseBreakdown };
};

export const getAdminUsers = async (params = {}) =>
  (await api.get("/admin/users", { params })).data;

export const getAdminUserDetails = async (id) =>
  (await api.get(`/admin/users/${id}`)).data;

export const updateAdminUserStatus = async (id, isActive) =>
  (await api.patch(`/admin/users/${id}/status`, { isActive })).data;

export const deleteAdminUser = async (id) =>
  (await api.delete(`/admin/users/${id}`)).data;

export const exportAdminUsers = async (params = {}) => {
  const response = await api.get("/admin/users/export", {
    params,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "smart-finance-users.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Fetch all admin transactions with filters and pagination
export const getAdminTransactions = async (params = {}) => {
  const response = await api.get("/admin/transactions", { params });
  return response.data;
};

// Fetch one transaction's full details
export const getAdminTransactionDetails = async (id) => {
  const response = await api.get(`/admin/transactions/${id}`);
  return response.data;
};

// Delete a transaction (admin-only backend route)
export const deleteAdminTransaction = async (id) => {
  const response = await api.delete(`/admin/transactions/${id}`);
  return response.data;
};

export const getAdminCategories = async (params = {}) => {
  const response = await api.get("/admin/categories", { params });
  return response.data;
};

export const createAdminCategory = async (categoryData) => {
  const response = await api.post("/admin/categories", categoryData);
  return response.data;
};

export const updateAdminCategory = async (id, categoryData) => {
  const response = await api.patch(`/admin/categories/${id}`, categoryData);
  return response.data;
};

export const deleteAdminCategory = async (id) => {
  const response = await api.delete(`/admin/categories/${id}`);
  return response.data;
};

// ==========================================
// ADMIN DASHBOARD - NEW ANALYTICS APIs
// ==========================================

// User registration growth
export const getUserGrowthData = async () =>
  (await api.get("/admin/analytics/user-growth")).data;

// Savings analytics
export const getSavingsAnalytics = async () =>
  (await api.get("/admin/analytics/savings")).data;

// Latest transactions
export const getRecentTransactions = async (limit = 10) =>
  (
    await api.get("/admin/transactions/recent", {
      params: { limit },
    })
  ).data;

// Top active users
export const getTopActiveUsers = async (limit = 5) =>
  (
    await api.get("/admin/users/top-active", {
      params: { limit },
    })
  ).data;
