import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import LoginNavbar from "./components/login_components/LoginNavbar";  

function App() {
  return (
    <main style={{ flex: 1}}>
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>

      
    </main>
  );
}

export default App;
