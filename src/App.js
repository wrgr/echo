import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import SimulationPage from "./SimulationPage";
import HelpPage from "./HelpPage";

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <div className="title-container">
            <h1 className="title">ECHO</h1>
            <h2 className="subtitle">(Empowering Conversations for better Healthcare Outcomes)</h2>
          </div>
        </div>
      </header>

      <nav className="nav-container">
        <Link to="/simulation" className="nav-link">Simulation</Link>
        <Link to="/help" className="nav-link">Help & Advice</Link>
      </nav>

      <Routes>
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<SimulationPage />} />
      </Routes>
    </div>
  );
}

export default App;