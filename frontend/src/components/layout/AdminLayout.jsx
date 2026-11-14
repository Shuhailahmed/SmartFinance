import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 pl-64">
      <AdminSidebar />

      <div className="min-h-screen w-full min-w-0">
        <AdminNavbar />

        <main className="min-w-0 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
