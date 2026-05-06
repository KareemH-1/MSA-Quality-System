import { Suspense } from "react";
import QaDashboard from "../pages/QA_Admin/QaDashboard";
import UserManagement from "../pages/Admin/UserManagement";
import Faculties from "../pages/Admin/Faculties";
import SystemLogs from "../pages/Admin/SystemLogs";
import ManageCourses from "../pages/Admin/ManageCourses";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import StudentDashboard from "../pages/Student/StudentDashboard";
import { getQaDashboardNavbarComponents } from "./QaDashboardNavbarComponents";
import { getAdminFacultyNavbarComponents, getAdminManageUserNavbarComponents, getAdminCoursesNavbarComponents } from "./AdminNavbarComponents";
import { getStudentNavbarComponents } from "./StudentNavbarComponents";

import { ROLES } from "../constants/roles";
import { Settings, LayoutDashboard, UserRound, Activity, Building2, LibraryBig } from "lucide-react";
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
    sidebarIcon: LayoutDashboard,
    showNavbar: true,
    defaultNavItem: "Overview",
    getNavbarComponents: getQaDashboardNavbarComponents,
    roles: [ROLES.QA],
  },

  contact: {
    path: "/contact",
    component: Contact,
    showSidebar: false,
    showInSidebar: false,
    showNavbar: false,
  },

  UserManagement: {
    path: "/user-management",
    component: UserManagement,
    showSidebar: true,
    sidebarLabel: "Manage Users",
    sidebarIcon: UserRound,
    sidebarIconFill: true,
    showNavbar: true,
    defaultNavItem: "User Management",
    getNavbarComponents: getAdminManageUserNavbarComponents,
    roles: [ROLES.ADMIN],
  },
  FacultyManagement: {
    path: "/faculties",
    component: Faculties,
    showSidebar: true,
    sidebarLabel: "Faculties",
    sidebarIcon: Building2,
    sidebarIconFill: false,
    showNavbar: true,
    defaultNavItem: "Faculties",
    getNavbarComponents: getAdminFacultyNavbarComponents,
    roles: [ROLES.ADMIN],
  },
  Courses: {
    path: "/courses",
    component: ManageCourses,
    showSidebar: true,
    sidebarLabel: "Manage Courses",
    sidebarIcon: LibraryBig,
    sidebarIconFill: false,
    showNavbar: true,
    defaultNavItem: "Courses",
    getNavbarComponents: getAdminCoursesNavbarComponents,
    roles: [ROLES.ADMIN],
  },
  Logs: {
    path: "/logs",
    component: SystemLogs,
    showSidebar: true,
    sidebarLabel: "System Health & Logs",
    sidebarIcon: Activity,
    showNavbar: true,
    roles: [ROLES.ADMIN],
  },

  studentDashboard: {
    path: "/student-dashboard",
    component: StudentDashboard,
    showSidebar: true,
    sidebarLabel: "Student Dashboard",
    sidebarIcon: LayoutDashboard,
    showNavbar: true,
    defaultNavItem: "Home",
    getNavbarComponents: getStudentNavbarComponents,
    roles: [ROLES.STUDENT],
  },
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};

export const ROLE_DEFAULT_PAGES = {
  [ROLES.QA]: "/dashboard",
  [ROLES.ADMIN]: "/user-management",
  [ROLES.STUDENT]: "/student-dashboard",
};

export const getDefaultPageForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_DEFAULT_PAGES[normalizedRole] || "/contact";
};
