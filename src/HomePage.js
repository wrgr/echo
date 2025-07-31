import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="hero-container">
      <h2 className="hero-title">Welcome to ECHO</h2>
      <div className="hero-links">
        <Link to="/simulation" className="hero-link">Try Simulator</Link>
        <Link to="/clinical-question" className="hero-link">Clinical Question</Link>
        <Link to="/patient-intake" className="hero-link">Patient Intake</Link>
      </div>
    </div>
  );
}

export default HomePage;
