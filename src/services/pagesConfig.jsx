import { Suspense } from "react";
import QaDashboard from "../pages/QA_Admin/QaDashboard";
import UserManagement from "../pages/Admin/UserManagement";
import Faculties from "../pages/Admin/Faculties";
import SystemLogs from "../pages/Admin/SystemLogs";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import StudentDashboard from "../pages/Student/StudentDashboard";
import StudentServices from "../pages/Student/StudentServices";
import StudentNotifications from "../pages/Student/StudentNotifications";
import TakeSurvey from "../pages/Student/TakeSurvey";
import InstructorServices from "../pages/Instructor/InstructorServices";
import { Bell } from "lucide-react";
import { getQaDashboardNavbarComponents } from "./QaDashboardNavbarComponents";
import {
  getAdminFacultyNavbarComponents,
  getAdminManageUserNavbarComponents,
} from "./AdminNavbarComponents";
import {
  getStudentNavbarComponents,
  getStudentServicesNavbarComponents,
} from "./StudentNavbarComponents";

import { ROLES } from "../constants/roles";
import {
  Settings,
  LayoutDashboard,
  UserRound,
  Activity,
  Building2,
  Home,
} from "lucide-react";
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
  Logs: {
    path: "/logs",
    component: SystemLogs,
    showSidebar: true,
    sidebarLabel: "System Health & Logs",
    sidebarIcon: Activity,
    showNavbar: true,
    roles: [ROLES.ADMIN],
  },

  studentHome: {
    path: "/student-home",
    component: StudentDashboard,
    showSidebar: true,
    sidebarLabel: "Home",
    sidebarIcon: Home,
    showNavbar: false,
    defaultNavItem: "Home",
    getNavbarComponents: getStudentNavbarComponents,
    roles: [ROLES.STUDENT],
  },

  studentServices: {
    path: "/student-services",
    component: StudentServices,
    showSidebar: true,
    sidebarLabel: "Services",
    sidebarIcon: Activity,
    showNavbar: true,
    defaultNavItem: "Appeals",
    getNavbarComponents: getStudentServicesNavbarComponents,
    roles: [ROLES.STUDENT],
  },
  takeSurvey: {
    path: "/student-services/survey/:surveyId/:courseId",
    component: TakeSurvey,
    showSidebar: false,
    showNavbar: false,
    roles: [ROLES.STUDENT],
  },

  studentNotifications: {
    path: "/student-notifications",
    component: StudentNotifications,
    showSidebar: true,
    sidebarLabel: "Notifications",
    sidebarIcon: Bell,
    showNavbar: false,
    roles: [ROLES.STUDENT],
  },

  instructorServices: {
    path: "/instructor-services",
    component: InstructorServices,
    showSidebar: true,
    sidebarLabel: "Services",
    sidebarIcon: Activity,
    showNavbar: true,
    defaultNavItem: "Appeals",
    getNavbarComponents: getStudentServicesNavbarComponents,
    roles: [ROLES.INSTRUCTOR],
  },
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};

export const ROLE_DEFAULT_PAGES = {
  [ROLES.QA]: "/dashboard",
  [ROLES.ADMIN]: "/user-management",
  [ROLES.STUDENT]: "/student-home",
  [ROLES.INSTRUCTOR]: "/instructor-services",
};

export const getDefaultPageForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_DEFAULT_PAGES[normalizedRole] || "/contact";
};
