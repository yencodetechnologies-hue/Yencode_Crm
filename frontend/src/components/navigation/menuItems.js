import {
  LayoutDashboard,
  MessageCircleQuestion,
  Briefcase,
  Users,
  Clipboard,
  CreditCard,
  FileText,
  PhoneCall,
} from "lucide-react";

export const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Calling", path: "/calling-queue", icon: PhoneCall, roles: ["Telecaller", "Lead"] },
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
  { label: "Tasks", path: "/task", icon: Clipboard, roles: ["Admin", "Superadmin", "employee", "Lead"] },
  {
    label: "Expenses",
    path: "/expense-table",
    icon: CreditCard,
    roles: ["Admin", "Superadmin"],
  },
  { label: "MoM", path: "/momdetails", icon: FileText, roles: ["Admin", "Superadmin", "employee", "Lead"] },
  { label: "Quotations", path: "/quotation-table", icon: FileText, roles: ["Admin", "Superadmin"] },
];

