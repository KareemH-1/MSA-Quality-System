import QaDashboard from "../pages/QA_Admin/QaDashboard";
import QASettings from "../pages/QA_Admin/QaSettings";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getQaDashboardNavbarComponents } from "./NavbarConfigs/QaDashboardNavbarComponents";

import { ROLES } from "../constants/roles";
import { Settings, LayoutDashboard} from "lucide-react";

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

  options: {
    path: "/settings",
    component: QASettings,
    showSidebar: true,
    sidebarLabel: "Settings",
    sidebarIcon: Settings,
    showNavbar: true,
    roles: [ROLES.QA]
  }
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};
