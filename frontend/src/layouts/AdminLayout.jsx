import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminNavbar from "../components/layout/AdminNavbar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <AdminSidebar />

      <div className="ml-64 min-h-screen min-w-0">
        <AdminNavbar />

        <main className="min-w-0 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
