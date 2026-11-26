import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import siteConfig from './site.config.json';
import { pages } from './pages/index.js';
import NotFound from './NotFound';
import { buildThemeStyle } from './runtime/safe';
import './runtime/theme.css';

export function AppRoutes() {
  const themeStyle = buildThemeStyle(siteConfig?.theme);
  return (
    <div className="rt-app" style={themeStyle}>
      <Routes>
        {pages.map(({ path, Component }, idx) => (
          <Route key={idx} path={path} element={<Component />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
