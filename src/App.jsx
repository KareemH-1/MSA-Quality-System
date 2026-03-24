import { useState } from "react";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { Route, Routes, useLocation } from "react-router-dom";
import SideBar from "./components/layout/sideBar";
import NavBar from "./components/layout/navBar";
import { NOT_FOUND_PAGE, PAGE_CONFIG } from "./services/pagesConfig";

const APP_PAGES = Object.values(PAGE_CONFIG);

const buildInitialNavSelections = () => {
  return APP_PAGES.reduce((acc, page) => {
    if (page.defaultNavItem) {
      acc[page.path] = page.defaultNavItem;
    }

    return acc;
  }, {});
};

function App() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [navSelections, setNavSelections] = useState(buildInitialNavSelections);

  const activePage = APP_PAGES.find((page) => page.path === pathname);
  const shouldShowSidebar = Boolean(activePage?.showSidebar);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
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
          <SideBar isOpen={isSidebarOpen} />
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
          {APP_PAGES.map((page) => {
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
      </div>
    </main>
  );
}

export default App;
