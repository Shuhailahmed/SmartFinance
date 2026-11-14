import api from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const createTransaction = async (transactionData) => {
  const response = await api.post(
    "/transactions",
    transactionData,
    getAuthHeaders(),
  );

  return response.data;
};

const getTransactions = async () => {
  const response = await api.get("/transactions", getAuthHeaders());

  return response.data;
};

const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`, getAuthHeaders());

  return response.data;
};

const updateTransaction = async (id, transactionData) => {
  const response = await api.put(
    `/transactions/${id}`,
    transactionData,
    getAuthHeaders(),
  );

  return response.data;
};

const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`, getAuthHeaders());

  return response.data;
};

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
