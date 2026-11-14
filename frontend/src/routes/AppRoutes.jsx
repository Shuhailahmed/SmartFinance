import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Authentication Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User Pages
import UserDashboard from "../pages/user/Dashboard";
import Transactions from "../pages/user/Transactions";
import AddTransaction from "../pages/user/AddTransaction";
import Budgets from "../pages/user/Budgets";
import SavingsGoals from "../pages/user/SavingsGoals";
import Analytics from "../pages/user/Analytics";
import Income from "../pages/user/Income";
import Expenses from "../pages/user/Expenses";
import Reports from "../pages/user/Reports";
import Notifications from "../pages/user/Notifications";
import Profile from "../pages/user/Profile";
import Insights from "../pages/user/Insights";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard";
import Users from "../pages/admin/Users";
import AdminTransactions from "../pages/admin/Transactions";
import AdminCategories from "../pages/admin/Categories";
import AdminBudgets from "../pages/admin/Budgets";
import AdminAnalytics from "../pages/admin/Analytics";
import AdminReports from "../pages/admin/Reports";
import ActivityLogs from "../pages/admin/ActivityLogs";
import AdminSettings from "../pages/admin/Settings";

// Route Protection
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Layouts
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/savings-goals" element={<SavingsGoals />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/insights" element={<Insights />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/budgets" element={<AdminBudgets />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
