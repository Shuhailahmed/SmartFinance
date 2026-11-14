import api from "./api";

const getBudgets = async (token, month, year) => {
  const response = await api.get("/budgets", {
    params: {
      month,
      year,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const createBudget = async (token, budgetData) => {
  const response = await api.post("/budgets", budgetData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const updateBudget = async (token, id, budgetData) => {
  const response = await api.put(`/budgets/${id}`, budgetData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const deleteBudget = async (token, id) => {
  const response = await api.delete(`/budgets/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
