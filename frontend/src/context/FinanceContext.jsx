import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  createTransaction as createTransactionAPI,
  getTransactions as getTransactionsAPI,
  updateTransaction as updateTransactionAPI,
  deleteTransaction as deleteTransactionAPI,
} from "../services/transactionService";

import budgetService from "../services/budgetService";
import savingsService from "../services/savingsService";

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      return [];
    }

    try {
      setLoading(true);
      setError("");

      // transactionService.js reads the token from localStorage.
      const response = await getTransactionsAPI();
      const data = response?.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.transactions)
          ? data.transactions
          : [];

      setTransactions(items);
      return items;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load transactions.";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load current month's budgets
  const fetchBudgets = useCallback(async () => {
    if (!token) {
      setBudgets([]);
      return [];
    }

    try {
      setError("");

      const now = new Date();

      const response = await budgetService.getBudgets(
        token,
        now.getMonth() + 1,
        now.getFullYear(),
      );

      const data = response?.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.budgets)
          ? data.budgets
          : [];

      setBudgets(items);
      return items;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load budgets.");
      throw err;
    }
  }, [token]);

  // Load savings goals
  const fetchSavingsGoals = useCallback(async () => {
    if (!token) {
      setSavingsGoals([]);
      return [];
    }

    try {
      setError("");

      const response = await savingsService.getSavingsGoals(token);
      const data = response?.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.goals)
          ? data.goals
          : [];

      setSavingsGoals(items);
      return items;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load savings goals.");
      throw err;
    }
  }, [token]);

  // Refresh all finance data
  const refreshFinanceData = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchTransactions(),
        fetchBudgets(),
        fetchSavingsGoals(),
      ]);
    } catch (err) {
      console.error("Failed to refresh finance data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, fetchTransactions, fetchBudgets, fetchSavingsGoals]);

  // Add a transaction
  const addTransaction = useCallback(
    async (transactionData) => {
      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await createTransactionAPI(transactionData);

      await fetchTransactions();

      return response;
    },
    [token, fetchTransactions],
  );

  // Update a transaction
  const updateTransaction = useCallback(
    async (id, transactionData) => {
      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await updateTransactionAPI(id, transactionData);

      await fetchTransactions();

      return response;
    },
    [token, fetchTransactions],
  );

  // Delete a transaction
  const deleteTransaction = useCallback(
    async (id) => {
      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await deleteTransactionAPI(id);

      await fetchTransactions();

      return response;
    },
    [token, fetchTransactions],
  );

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      savingsGoals,
      loading,
      error,
      setTransactions,
      setBudgets,
      setSavingsGoals,
      fetchTransactions,
      fetchBudgets,
      fetchSavingsGoals,
      refreshFinanceData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [
      transactions,
      budgets,
      savingsGoals,
      loading,
      error,
      fetchTransactions,
      fetchBudgets,
      fetchSavingsGoals,
      refreshFinanceData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }

  return context;
};

export default FinanceContext;
