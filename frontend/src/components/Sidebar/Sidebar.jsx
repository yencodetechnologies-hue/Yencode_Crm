import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, User } from "lucide-react";
import { FaPowerOff } from "react-icons/fa";
import logo from "../../assets/logo light.png";
import { projectServices } from "../../api/axios/axiosInstance";
import { normalizeRole, isAdminRole } from "../../utils/roles";
import { Modal } from "../ui";
import { menuItems } from "../navigation/menuItems";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [role, setRole] = useState("");
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const mobileMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setRole(normalizeRole(localStorage.getItem("role") || ""));
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen, setMobileOpen]);

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

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isSubMenuActive = (subItems) => subItems.some((sub) => isActivePath(sub.path));

  const visibleMenuItems = useMemo(() => {
    const r = normalizeRole(role);
    return menuItems
      .map((item) => {
        if (item.subMenu) {
          const visibleSubItems = item.subMenu.filter(
            (subItem) => !subItem.roles || subItem.roles.map(normalizeRole).includes(r)
          );
          if (visibleSubItems.length === 0) return null;
          return { ...item, subMenu: visibleSubItems };
        }
        if (item.roles && !item.roles.map(normalizeRole).includes(r)) return null;
        return item;
      })
      .filter(Boolean);
  }, [role]);

  const renderMenuItem = (item) => {
    const ItemIcon = item.icon;

    if (item.subMenu) {
      const subActive = isSubMenuActive(item.subMenu);
      const isOpen = openSubMenu === item.label;

      return (
        <div key={item.label} className="w-full">
          <button
            type="button"
            onClick={() => setOpenSubMenu(isOpen ? null : item.label)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-lg
              text-sm font-medium transition-colors
              ${subActive ? "bg-white/10 text-white" : "text-slate-100 hover:bg-white/10"}
            `}
          >
            <span className="flex items-center gap-3">
              {ItemIcon && <ItemIcon className="h-5 w-5 opacity-90" />}
              {item.label}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-1">
              {item.subMenu.map((subItem) => {
                const active = isActivePath(subItem.path);
                return (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      block px-3 py-2 rounded-md text-sm transition-colors
                      ${active ? "bg-primary/20 text-white" : "text-slate-100 hover:bg-white/10"}
                    `}
                  >
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const active = isActivePath(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg
          text-sm font-medium transition-colors
          ${active ? "bg-primary/20 text-white" : "text-slate-100 hover:bg-white/10"}
        `}
      >
        {ItemIcon && <ItemIcon className="h-5 w-5 opacity-90" />}
        {item.label}
      </Link>
    );
  };

  // Keep existing behavior: certain roles cannot use mobile viewport
  if (!isAdminRole(role) && role !== "Superadmin" && window.innerWidth <= 768) {
    return (
      <div className="fixed inset-0 bg-gray-800 text-white flex items-center justify-center p-4 z-[999]">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-lg">
            This application is not accessible on mobile for your role. Please use a desktop device.
          </p>
        </div>
      </div>
    );
  }

  const sidebarInner = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="text-white font-semibold tracking-wide">Yencode CRM</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {visibleMenuItems.map((item) => renderMenuItem(item))}
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <button
            type="button"
            onClick={toggleProfile}
            className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary text-sm font-semibold"
          >
            {getInitials(userProfile?.name || localStorage.getItem("empName"))}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {userProfile?.name || localStorage.getItem("empName") || "User"}
            </p>
            <p className="text-xs text-slate-200 truncate">{role || "—"}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-md text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Logout"
          >
            <FaPowerOff className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={toggleProfile}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-100 hover:bg-white/10 transition-colors"
        >
          <User className="h-5 w-5" />
          Profile
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 bg-primary-darker text-white z-40">
        {sidebarInner}
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside
            ref={mobileMenuRef}
            className="absolute inset-y-0 left-0 w-64 bg-primary-darker text-white shadow-xl"
          >
            {sidebarInner}
          </aside>
        </div>
      )}

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

