import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS for consistent styling and responsive design across the app
import './index.css'; // Import custom global CSS styles specific to this project
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RuleDetailPage from "./components/dashboard/RuleDetailPage";
import App from './App';

// Create a root container for the React application.
// ReactDOM.createRoot enables the new concurrent rendering features in React 18+,
// improving performance and providing better user experience.
const root = ReactDOM.createRoot(
  document.getElementById('root')!
);

root.render(
  // React.StrictMode is a wrapper component that helps highlight potential problems in an application.
  // It activates additional checks and warnings for its descendants during development,
  // but does not affect the production build.
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/rule/:ruleName" element={<RuleDetailPage />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);