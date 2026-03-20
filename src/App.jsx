import { Routes, Route, Link } from 'react-router-dom';
import Page_test_del_whenstart from './pages/Page_test_del_whenstart';
import StatCard from "./components/StatCard";
import { Users, FileText, CheckCircle } from "lucide-react";

function App() {
  return (
    <div className="app-container" style={{ display: 'flex' }}>

      <nav style={{ width: '250px', background: 'var(--primary-color)', minHeight: '100vh', padding: '20px' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Overview</Link></li>
          <li><Link to="/appeals" style={{ color: 'white', textDecoration: 'none' }}>Appeals</Link></li>
          <li><Link to="/surveys" style={{ color: 'white', textDecoration: 'none' }}>Surveys</Link></li>
        </ul>
      </nav>

      <main style={{ flex: 1, padding: '40px' }}>
        <Routes>
          <Route path="/" element={<Page_test_del_whenstart/>} />
        </Routes>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <StatCard 
        title="Total Students" 
        value="1250" 
        icon={Users} 
        trend="12"
      />
      <StatCard 
        title="Grade Appeals" 
        value="45" 
        icon={FileText} 
      />
      <StatCard 
        title="Survey Completion" 
        value="88" 
        icon={CheckCircle} 
        suffix="%" 
      />
    </div>
      </main>
    </div>
  );
}

export default App;