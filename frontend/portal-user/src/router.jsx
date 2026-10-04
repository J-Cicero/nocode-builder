import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/auth/PrivateRoute';

// PUBLIC pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import TemplatesPage from './pages/TemplatesPage';
import UseCasesPage from './pages/UseCasesPage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';

// AUTH pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RegisterPersonalPage from './pages/RegisterPersonalPage';
import RegisterEnterprisePage from './pages/RegisterEnterprisePage';

// APP pages (protégées)
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import BlueprintEditorPage from './pages/BlueprintEditorPage';
import PreviewPage from './pages/PreviewPage';
import SettingsPage from './pages/SettingsPage';
import UpgradePage from './pages/UpgradePage';

/**
 * Configuration des routes de l'application
 * Utilise React Router v6 avec routes publiques, auth et protégées
 */
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* ====== PUBLIC ROUTES ====== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* ====== AUTH ROUTES ====== */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/register/personal" element={<RegisterPersonalPage />} />
        <Route path="/auth/register/enterprise" element={<RegisterEnterprisePage />} />

        {/* ====== PROTECTED APP ROUTES ====== */}
        <Route
          path="/app/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/app/editor/:projectId"
          element={
            <PrivateRoute>
              <EditorPage />
            </PrivateRoute>
          }
        />
        {/* Blueprint V1 Editor — Sprint 4 */}
        <Route
          path="/app/blueprint/:blueprintUuid"
          element={
            <BlueprintEditorPage />
          }
        />
        {/* All project-related paths now lead to the unified Workspace */}
        <Route
          path="/app/data/:projectId"
          element={
            <PrivateRoute>
              <EditorPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/app/logic/:projectId"
          element={
            <PrivateRoute>
              <EditorPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/app/preview/:projectId"
          element={
            <PrivateRoute>
              <PreviewPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/app/upgrade"
          element={
            <PrivateRoute>
              <UpgradePage />
            </PrivateRoute>
          }
        />

        {/* ====== CATCH-ALL & REDIRECTS ====== */}
        {/* Rediriger /auth/register vers /auth/signup */}
        <Route path="/auth/register" element={<Navigate to="/auth/signup" replace />} />

        {/* Rediriger /app vers /app/dashboard */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

        {/* Page non trouvée - rediriger vers landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
