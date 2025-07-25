//import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import SimulationPage from "./SimulationPage"; // Import the new SimulationPage
import HelpPage from "./HelpPage"; // Import the new HelpPage
import DynamicForm from "./pages/DynamicForm";

// --- Styling ---
const styles = {
  // Shared styles for the overall container and header
  // These styles are now applied to the main App component,
  // which acts as the layout wrapper for both SimulationPage and HelpPage.
  appContainer: {
    fontFamily: "'Roboto', sans-serif",
    maxWidth: "1200px",
    width: "98%",
    margin: "30px auto",
    padding: "0",
    border: "1px solid #dbe1e8",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(21,48,74,0.08)",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    height: "98vh",
    overflow: "hidden",
    minHeight: "600px",
    "@media (max-width: 768px)": {
      margin: "0",
      height: "auto",
      minHeight: "100vh",
      borderRadius: "0",
      border: "none",
      flexDirection: "column",
      width: "100%",
      maxWidth: "100%",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #dbe1e8",
    padding: "15px 20px",
    backgroundColor: "#f7f9fc",
    textAlign: "center",
    flexShrink: 0,
    "@media (max-width: 768px)": {
      padding: "10px",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    "@media (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  icon: {
    width: "32px", height: "32px", marginRight: "12px", color: "#0d9488", flexShrink: 0,
    "@media (max-width: 768px)": {
      marginRight: "0",
      marginBottom: "5px",
    },
  },
  titleContainer: {
    display: "flex", flexDirection: "column", alignItems: "center",
    "@media (max-width: 768px)": {
      textAlign: "center",
    },
  },
  title: {color: "#15304a", margin: 0, fontSize: "24px", fontWeight: "700",
    "@media (max-width: 768px)": {
      fontSize: "20px",
    },
  },
  subtitle: {color: "#64748b", margin: "4px 0 0 0", fontSize: "12px", fontWeight: "400",
    "@media (max-width: 768px)": {
      fontSize: "10px",
      textAlign: "center",
    },
  },
  navContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    padding: "10px 20px",
    backgroundColor: "#eef2f7",
    borderBottom: "1px solid #dbe1e8",
    flexShrink: 0,
    "@media (max-width: 768px)": {
      flexDirection: "column",
      gap: "10px",
      padding: "8px 10px",
    },
  },
  navLink: {
    textDecoration: "none",
    color: "#0d9488",
    fontWeight: "bold",
    fontSize: "1.1em",
    padding: "5px 10px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#d1f7f5",
    },
    "@media (max-width: 768px)": {
      fontSize: "1em",
      padding: "10px",
      textAlign: "center",
      border: "1px solid #0d9488",
    },
  },
};

function App() {
  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <svg style={styles.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>ECHO</h1>
            <h2 style={styles.subtitle}>(Empowering Conversations for better Healthcare Outcomes)</h2>
          </div>
        </div>
      </header>

      <nav style={styles.navContainer}>
        <Link to="/pre-visit-form" style={styles.navLink}>Pre-Visit Form</Link>
        <Link to="/simulation" style={styles.navLink}>Simulation</Link>
        <Link to="/help" style={styles.navLink}>Help & Advice</Link>
        

      </nav>

      <Routes>
        <Route path="/pre-visit-form" element={<DynamicForm />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<SimulationPage />} /> {/* Default route */}
         
      </Routes>
    </div>
  );
}

export default App;