import QaDashboard from "../pages/QA_Admin/QaDashboard";
import UserManagement from "../pages/Admin/UserManagement";
import SystemLogs from "../pages/Admin/SystemLogs"
;
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getQaDashboardNavbarComponents } from "./QaDashboardNavbarComponents";
import { getAdminManageUserNavbarComponents } from "./AdminNavbarComponents";

import { ROLES } from "../constants/roles";
import { Settings, LayoutDashboard , UserRound, Activity} from "lucide-react";
import Contact from "../pages/Contact";
import { normalizeRole } from "./roleUtils";

export const PAGE_CONFIG = {
  login: {
    path: "/",
    component: Login,
    showSidebar: false,
  },
  home: {
    path: "/dashboard",
    component: QaDashboard,
    showSidebar: true,
    sidebarLabel: "Dashboard",
    sidebarIcon:LayoutDashboard ,
    showNavbar: true,
    defaultNavItem: "Overview",
    getNavbarComponents: getQaDashboardNavbarComponents,
    roles: [ROLES.QA]
  },


  contact:{
    path: "/contact",
    component: Contact,
    showSidebar: false,
    showInSidebar: false,
    showNavbar: false,
  },

  UserManagement:{
    path: "/user-management",
    component: UserManagement,
    showSidebar: true,
    sidebarLabel: "Manage Users",
    sidebarIcon: UserRound,
    showNavbar: true,
    defaultNavItem: "User Management",
    getNavbarComponents: getAdminManageUserNavbarComponents,
    roles: [ROLES.ADMIN]
  },
  Logs:{
    path: "/logs",
    component: SystemLogs,
    showSidebar: true,
    sidebarLabel: "System Health & Logs",
    sidebarIcon: Activity,
    showNavbar: true,
    roles: [ROLES.ADMIN]
  }
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};

export const ROLE_DEFAULT_PAGES = {
  [ROLES.QA]: "/dashboard",
  [ROLES.ADMIN]: "/user-management",
};

export const getDefaultPageForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_DEFAULT_PAGES[normalizedRole] || "/contact";
};
