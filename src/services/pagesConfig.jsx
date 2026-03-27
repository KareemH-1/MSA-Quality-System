import QaDashboard from "../pages/QA_Admin/QaDashboard";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getQaDashboardNavbarComponents } from "./QaDashboardNavbarComponents";

import { ROLES } from "../constants/roles";
import { FlaskConical,LayoutDashboard} from "lucide-react";

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
  testPage : {
    path: "/test",
    component: () => <div>Test Page</div>,
    showSidebar: true,
    sidebarLabel: "Test",
    sidebarIcon: FlaskConical,
    showNavbar: false,
    roles : [ROLES.DEAN]
    },

};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};
