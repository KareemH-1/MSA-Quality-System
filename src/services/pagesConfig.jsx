import QaDashboard from "../pages/QA_Admin/QaDashboard";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getQaDashboardNavbarComponents } from "./QaDashboardNavbarComponents";

import { ROLES } from "../constants/roles";
import { Settings, LayoutDashboard} from "lucide-react";
import Contact from "../pages/Contact";

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
  }
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};
