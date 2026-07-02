import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { FaPowerOff } from "react-icons/fa";
import { projectServices } from "../../api/axios/axiosInstance";
import { Modal } from "../ui";
import { normalizeRole } from "../../utils/roles";
import { menuItems } from "../navigation/menuItems";

function findTitleFromMenu(pathname) {
  for (const item of menuItems) {
    if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return item.label;
    if (item.subMenu) {
      for (const sub of item.subMenu) {
        if (pathname === sub.path || pathname.startsWith(`${sub.path}/`)) return sub.label;
      }
    }
  }
  return "Dashboard";
}

export default function AppHeader({ onOpenMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    setRole(normalizeRole(localStorage.getItem("role") || ""));
  }, [location.pathname]);

  const pageTitle = useMemo(() => findTitleFromMenu(location.pathname), [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const toggleProfile = async () => {
    setShowProfile((v) => !v);
    if (!userProfile) {
      try {
        const response = await projectServices.get(`/employeedetails/${localStorage.getItem("empId")}`);
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
              onClick={onOpenMobileSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {pageTitle}
              </h2>
              <p className="text-xs text-slate-500 truncate">{role || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleProfile}
              className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold text-sm"
              aria-label="Open profile"
            >
              {getInitials(userProfile?.name || localStorage.getItem("empName"))}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
              aria-label="Logout"
            >
              <FaPowerOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {showProfile && userProfile && (
        <Modal isOpen={showProfile} onClose={toggleProfile} title="Profile" size="sm">
          <div className="flex flex-col items-center -mt-2">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary text-2xl font-semibold mb-4">
              {getInitials(userProfile.name)}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{userProfile.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{userProfile.email}</p>
            <div className="w-full space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Employee ID</span>
                <span className="text-sm font-medium text-slate-900">{userProfile.empId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Role</span>
                <span className="text-sm font-medium text-slate-900 capitalize">
                  {userProfile.role ? normalizeRole(userProfile.role) : role}
                </span>
              </div>
              {userProfile.designation && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Designation</span>
                  <span className="text-sm font-medium text-slate-900">{userProfile.designation}</span>
                </div>
              )}
              {userProfile.department && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-500">Department</span>
                  <span className="text-sm font-medium text-slate-900">{userProfile.department}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

