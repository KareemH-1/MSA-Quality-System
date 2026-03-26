import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getHomeNavbarComponents } from "./homeNavbarComponents";

import { ROLES } from "../constants/roles";
import { FlaskConical, HomeIcon, TestTube } from "lucide-react";

export const PAGE_CONFIG = {
  login: {
    path: "/",
    component: Login,
    showSidebar: false,
  },
  home: {
    path: "/home",
    component: Home,
    showSidebar: true,
    sidebarLabel: "Home",
    sidebarIcon: HomeIcon,
    showNavbar: true,
    defaultNavItem: "Overview",
    getNavbarComponents: getHomeNavbarComponents,
    wrapperClassName: "home-page",
    contentClassName: "home-content",
    roles: [ROLES.QA, ROLES.DEAN, ROLES.MODULE_LEADER, ROLES.INSTRUCTOR, ROLES.STUDENT]
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
