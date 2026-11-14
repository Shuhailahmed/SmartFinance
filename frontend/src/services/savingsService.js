import api from "./api";

// ==========================================
// GET ALL GOALS
// ==========================================

const getSavingsGoals = async (token) => {
  const response = await api.get("/savings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ==========================================
// GET SINGLE GOAL
// ==========================================

const getSavingsGoalById = async (token, id) => {
  const response = await api.get(`/savings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ==========================================
// CREATE GOAL
// ==========================================

const createSavingsGoal = async (token, goalData) => {
  const response = await api.post("/savings", goalData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ==========================================
// UPDATE GOAL
// ==========================================

const updateSavingsGoal = async (token, id, goalData) => {
  const response = await api.put(`/savings/${id}`, goalData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ==========================================
// DELETE GOAL
// ==========================================

const deleteSavingsGoal = async (token, id) => {
  const response = await api.delete(`/savings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  getSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
};
