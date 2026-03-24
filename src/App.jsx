import { useState } from "react";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import SideBar from "./components/layout/sideBar";
import NavBar from "./components/layout/navBar";

function App() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const shouldShowSidebar = pathname !== "/" && pathname === "/home";

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
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
          <Route path="/" element={<Login />} />
          <Route
            path="/home"
            element={
              <div className="home-page">
                <NavBar />
                <main className="home-content">
                  <Home />
                </main>
              </div>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </main>
  );
}

export default App;
