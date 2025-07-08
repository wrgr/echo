import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import SimulationPage from "./SimulationPage"; // Import the new SimulationPage
import HelpPage from "./HelpPage"; // Import the new HelpPage
import styled from '@emotion/styled';
// The 'css' import from '@emotion/react' is not strictly necessary here
// as all styles with media queries will be handled by 'styled' components.
// However, keeping it doesn't hurt if you plan to use it for combining styles elsewhere.

// --- Media Query Constants ---
const mobileBreakpoint = '768px';

// --- Styled Components ---

const AppContainer = styled.div`
  font-family: 'Roboto', sans-serif;
  max-width: 1200px;
  width: 98%;
  margin: 30px auto;
  padding: 0;
  border: 1px solid #dbe1e8;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(21, 48, 74, 0.08);
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 98vh;
  overflow: hidden;
  min-height: 600px;

  @media (max-width: ${mobileBreakpoint}) {
    margin: 0;
    height: auto;
    min-height: 100vh;
    border-radius: 0;
    border: none;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #dbe1e8;
  padding: 15px 20px;
  background-color: #f7f9fc;
  text-align: center;
  flex-shrink: 0;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 10px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: ${mobileBreakpoint}) {
    flex-direction: column;
  }
`;

const Icon = styled.svg`
  width: 32px;
  height: 32px;
  margin-right: 12px;
  color: #0d9488;
  flex-shrink: 0;

  @media (max-width: ${mobileBreakpoint}) {
    margin-right: 0;
    margin-bottom: 5px;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: ${mobileBreakpoint}) {
    text-align: center;
  }
`;

const Title = styled.h1`
  color: #15304a;
  margin: 0;
  font-size: 24px;
  font-weight: 700;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 20px;
  }
`;

const Subtitle = styled.h2`
  color: #64748b;
  margin: 4px 0 0 0;
  font-size: 12px;
  font-weight: 400;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 10px;
    text-align: center;
  }
`;

const NavContainer = styled.nav`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px 20px;
  background-color: #eef2f7;
  border-bottom: 1px solid #dbe1e8;
  flex-shrink: 0;

  @media (max-width: ${mobileBreakpoint}) {
    flex-direction: column;
    gap: 10px;
    padding: 8px 10px;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #0d9488;
  font-weight: bold;
  font-size: 1.1em;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #d1f7f5;
  }

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 1em;
    padding: 10px;
    text-align: center;
    border: 1px solid #0d9488;
  }
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <HeaderContent>
          {/* The SVG is a native element, and its style properties are typically handled directly
              or by a styled component. Here, 'color' is a simple prop for styled-components.
              If it had more complex styles or media queries, it would become a styled component.
              Since it's just 'color', passing it directly as a prop is fine if 'Icon' were defined as:
              const Icon = styled.svg` width: 32px; height: 32px; margin-right: 12px; flex-shrink: 0; `;
              and then <Icon style={{ color: "#0d9488" }} ... > OR even better, pass it via props:
              <Icon iconColor="#0d9488" ... > and Icon would use css`color: ${props => props.iconColor};`
              For simplicity and consistency with the previous approach, Icon will inherit its color.
          */}
          <Icon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </Icon>
          <TitleContainer>
            <Title>SUSAN</Title>
            <Subtitle>(Simulating Understanding and Support for Adaptive Narratives)</Subtitle>
          </TitleContainer>
        </HeaderContent>
      </Header>

      <NavContainer>
        <NavLink to="/simulation">Simulation</NavLink>
        <NavLink to="/help">Help & Advice</NavLink>
      </NavContainer>

      <Routes>
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<SimulationPage />} /> {/* Default route */}
      </Routes>
    </AppContainer>
  );
}

export default App;