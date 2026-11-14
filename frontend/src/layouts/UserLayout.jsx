import { Outlet } from "react-router-dom";

import UserSidebar from "../components/layout/UserSidebar";
import UserNavbar from "../components/layout/UserNavbar";

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Area */}
      <div className="min-h-screen lg:ml-64">
        {/* Top Navbar */}
        <UserNavbar />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
