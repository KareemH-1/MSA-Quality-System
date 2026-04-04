import { useState } from "react";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { Route, Routes, useLocation } from "react-router-dom";
import SideBar from "./components/layout/sideBar";
import NavBar from "./components/layout/navBar";
import { NOT_FOUND_PAGE, PAGE_CONFIG } from "./services/pagesConfig";
import { ROLES } from "./constants/roles";
import Footer from "./components/Footer";

const APP_PAGES = Object.values(PAGE_CONFIG);

const buildInitialNavSelections = () => {
  return APP_PAGES.reduce((acc, page) => {
    if (page.defaultNavItem) {
      acc[page.path] = page.defaultNavItem;
    }

    return acc;
  }, {});
};

const getSideBarStateLocalStorage = () => {
  const storedState = localStorage.getItem("isSidebarOpen");
  if (storedState === null) {
    localStorage.setItem("isSidebarOpen", JSON.stringify(true));
    return true;
  }
  return JSON.parse(storedState);
}
const setSideBarStateLocalStorage = (state) => {
  if (state === null) {
    localStorage.removeItem("isSidebarOpen");
  }
  localStorage.setItem("isSidebarOpen", JSON.stringify(state));
}
function App() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(getSideBarStateLocalStorage());
  const [navSelections, setNavSelections] = useState(buildInitialNavSelections);
  const currentUserRole = ROLES.QA; // change later when backend is done

  const accessiblePages = APP_PAGES.filter(
    (page) => !page.roles || page.roles.includes(currentUserRole)
  );
  const sidebarPages = accessiblePages.filter(
    (page) => page.showSidebar && page.showInSidebar !== false
  );

  const activePage = accessiblePages.find((page) => page.path === pathname);
  const shouldShowSidebar = Boolean(activePage?.showSidebar);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
    setSideBarStateLocalStorage(!isSidebarOpen);
  }

  function setCurrentItemForPage(pagePath, item) {
    setNavSelections((prev) => ({
      ...prev,
      [pagePath]: item,
    }));
  }

  return (
    <main className="app-main">
      {shouldShowSidebar && (
        <>
          <button
            type="button"
            className={`sidebar-toggle-btn ${isSidebarOpen ? "open" : ""}`}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <SideBar isOpen={isSidebarOpen} pages={sidebarPages} />
        </>
      )}

      <div
        className={
          shouldShowSidebar && isSidebarOpen
            ? "app-routes app-routes-shifted"
            : "app-routes"
        }
      >
        <Routes>
          {accessiblePages.map((page) => {
            const PageComponent = page.component;
            const currentItem = navSelections[page.path] ?? page.defaultNavItem;
            const navbarComponents = page.getNavbarComponents
              ? page.getNavbarComponents(currentItem, (item) => {
                  setCurrentItemForPage(page.path, item);
                })
              : [];

            if (page.showNavbar) {
              return (
                <Route
                  key={page.path}
                  path={page.path}
                  element={
                    <div className={page.wrapperClassName}>
                      <NavBar components={navbarComponents} />
                      <main className={page.contentClassName}>
                        <PageComponent currentNavItem={currentItem} />
                      </main>
                    </div>
                  }
                />
              );
            }

            return (
              <Route
                key={page.path}
                path={page.path}
                element={<PageComponent />}
              />
            );
          })}
          <Route
            path={NOT_FOUND_PAGE.path}
            element={<NOT_FOUND_PAGE.component />}
          />
        </Routes>
        <Footer />
      </div>
    </main>
  );
}

export default App;
