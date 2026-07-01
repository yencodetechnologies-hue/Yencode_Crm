import React, { useState, useEffect, useRef } from "react";
import { projectServices } from "../../api/axios/axiosInstance";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, User, Search, ChevronDown,
  LayoutDashboard,
  Briefcase,
  Users,
  Clipboard,
  MessageCircleQuestion,
  CreditCard,
  FileText
} from "lucide-react";
import { FaPowerOff } from "react-icons/fa";
import logo from "../../assets/logo light.png";
import { normalizeRole, isAdminRole } from "../../utils/roles";
import { Modal } from "../ui";

const Topbar = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [role, setRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mobileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      label: "CRM",
      icon: MessageCircleQuestion,
      subMenu: [
        { label: "Leads", path: "/lead-table", roles: ["Admin", "Superadmin", "Lead", "Telecaller"] },
        { label: "Follow-ups", path: "/followups", roles: ["Admin", "Superadmin", "Lead", "Telecaller"] },
        { label: "Campaigns", path: "/campaigns", roles: ["Admin", "Superadmin", "Lead"] },
        { label: "Reports", path: "/reports", roles: ["Admin", "Superadmin", "Lead"] },
        { label: "Search Leads", path: "/search-leads", roles: ["Admin", "Superadmin", "Lead"] },
      ],
    },
    {
      label: "Clients",
      icon: Briefcase,
      subMenu: [
        { label: "Clients", path: "/client-table", roles: ["Admin", "Superadmin"] },
        { label: "Projects", path: "/project", roles: ["Admin", "Superadmin", "employee"] },
        { label: "Payments", path: "/payments-table", roles: ["Admin", "Superadmin"] },
      ],
    },
    {
      label: "Employees",
      icon: Users,
      subMenu: [
        { label: "Employee List", path: "/employee-table", roles: ["Admin", "Superadmin", "Lead"] },
        { label: "Attendance", path: "/attendance-table", roles: ["Admin", "Superadmin", "employee", "Lead", "Telecaller"] },
        { label: "Leaves", path: "/leave-table", roles: ["Admin", "Superadmin", "employee", "Lead", "Telecaller"] },
        { label: "Adjustments", path: "/adjustment-table", roles: ["Admin", "Superadmin"] },
        { label: "Payroll", path: "/payroll-table", roles: ["Admin", "Superadmin"] },
      ],
    },
    { label: "Tasks", path: "/task", icon: Clipboard },
    {
      label: "Expenses",
      path: "/expense-table",
      icon: CreditCard,
      roles: ["Admin", "Superadmin"],
    },
    { label: "MoM", path: "/momdetails", icon: FileText },
    { label: "Quotations", path: "/quotation-table", icon: FileText, roles: ["Admin", "Superadmin"]},
  ];

  useEffect(() => {
    const storedRole = normalizeRole(localStorage.getItem("role") || "");
    setRole(storedRole);
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [location.pathname]);
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleProfile = async () => {
    setShowProfile(!showProfile);
    if (!userProfile) {
      try {
        const response = await projectServices.get(`/employeedetails/${localStorage.getItem("empId")}`);
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    }
  };
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSubMenu = (label) => setOpenSubMenu(openSubMenu === label ? null : label);
  const toggleSearch = () => setShowSearch(!showSearch);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    setShowSearch(false);
    setSearchQuery('');
  };
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isSubMenuActive = (subItems) =>
    subItems.some((sub) => isActivePath(sub.path));

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const renderMenuItem = (item, isMobile = false) => {
    const ItemIcon = item.icon;

    if (item.subMenu) {
      const visibleSubItems = item.subMenu.filter(
        (subItem) => !subItem.roles || subItem.roles.map(normalizeRole).includes(role)
      );
      if (visibleSubItems.length === 0) return null;
      const subActive = isSubMenuActive(visibleSubItems);

      return (
        <div key={item.label} className={`relative ${isMobile ? 'w-full' : ''}`}>
          <div
            onClick={() => toggleSubMenu(item.label)}
            className={`
              flex items-center justify-between cursor-pointer
              ${isMobile
                ? `px-4 py-3 w-full ${subActive ? 'bg-blue-800 text-white' : 'text-gray-100 hover:bg-blue-700'}`
                : `px-3 py-2 rounded-md text-sm font-medium ${subActive ? 'bg-blue-700 text-white' : 'text-white hover:text-gray-200'}`
              }
            `}
          >
            <div className="flex items-center">
              {ItemIcon && <ItemIcon className="mr-2 h-5 w-5" />}
              {item.label}
            </div>
            <ChevronDown className={`h-4 w-4 transform transition-transform ${openSubMenu === item.label ? 'rotate-180' : ''}`} />
          </div>

          {openSubMenu === item.label && (
            <div className={`
              ${isMobile
                ? 'bg-blue-700 w-full'
                : 'absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md min-w-[200px]'
              }
            `}>
              {visibleSubItems.map((subItem) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  className={`
                    block px-4 py-2 text-sm
                    ${isMobile
                      ? isActivePath(subItem.path) ? 'bg-blue-800 text-white' : 'text-gray-100 hover:bg-blue-800'
                      : isActivePath(subItem.path) ? 'bg-primary-light text-primary-dark font-medium' : 'text-gray-800 hover:bg-gray-100'
                    }
                  `}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.roles && !item.roles.map(normalizeRole).includes(role)) return null;

    const active = isActivePath(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`
          flex items-center
          ${isMobile
            ? `px-4 py-3 w-full ${active ? 'bg-blue-800 text-white' : 'text-gray-100 hover:bg-blue-700'}`
            : `px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-blue-700 text-white' : 'text-white hover:text-gray-200'}`
          }
        `}
      >
        {ItemIcon && <ItemIcon className="mr-2 h-5 w-5" />}
        {item.label}
      </Link>
    );
  };

  if (!isAdminRole(role) && role !== "Superadmin" && window.innerWidth <= 768) {
    return (
      <div className="fixed inset-0 bg-gray-800 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-lg">This application is not accessible on mobile for your role. Please use a desktop device.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-md">
        <div className="max-w-8xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to="/dashboard">
                <img src={logo} alt="Logo" className="h-16 w-auto" />
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {menuItems.map((item) => renderMenuItem(item))}
            </div>
            <div className="flex items-center space-x-4">
              {/* <button
                onClick={toggleSearch}
                className="p-2 hover:bg-blue-700 rounded-md"
              >
                <Search className="h-5 w-5" />
              </button> */}

              <button onClick={handleLogout} className="bg-white text-blue-600 px-4 py-2 rounded-md">
                <FaPowerOff className="h-5 w-5" />
              </button>
              <User
                className="h-6 w-6 cursor-pointer hover:text-gray-200 hidden md:block"
                onClick={toggleProfile}
              />
              <button
                className="md:hidden p-2 rounded-md hover:bg-blue-700 focus:outline-none"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        {showSearch && (
          <div className="absolute inset-0 bg-blue-600 z-50">
            <div className="max-w-8xl mx-auto px-4 h-20 flex items-center">
              <form onSubmit={handleSearch} className="flex-1 flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-blue-500 text-white placeholder-blue-200 border-none rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="bg-blue-700 text-white px-4 py-2 rounded-r-md hover:bg-blue-800"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
              <button
                onClick={toggleSearch}
                className="ml-4 p-2 hover:bg-blue-700 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleOverlayClick}
          >
            <div
              ref={mobileMenuRef}
              className="fixed inset-y-0 left-0 w-64 bg-blue-600 transform transition-transform duration-300 ease-in-out overflow-y-auto"
            >
              <div className="flex flex-col h-full pt-20">
                {menuItems.map((item) => renderMenuItem(item, true))}
                <div className="mt-4 px-4">
                  <div
                    className="flex items-center px-4 py-3 text-gray-100 hover:bg-blue-700 cursor-pointer"
                    onClick={toggleProfile}
                  >
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
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
};

export default Topbar;
