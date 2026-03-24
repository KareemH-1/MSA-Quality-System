import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { getHomeNavbarComponents } from "./homeNavbarComponents";

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
    showNavbar: true,
    defaultNavItem: "Overview",
    getNavbarComponents: getHomeNavbarComponents,
    wrapperClassName: "home-page",
    contentClassName: "home-content",
  },
};

export const NOT_FOUND_PAGE = {
  path: "*",
  component: NotFound,
};
