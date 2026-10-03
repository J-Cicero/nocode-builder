import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

/**
 * Composant PrivateRoute - Protège les routes de l'application
 * Redirige vers /auth/login si pas de token en localStorage
 *
 * Re-enabled: this was previously hardcoded to `return children` regardless
 * of auth state ("Bypassed for Sprint 5 testing because V1 backend schema
 * lacks auth tables"). Identity now lives in svc-iam, which does have those
 * tables, so the bypass is no longer needed and was left in as a standing
 * gap -- any unauthenticated request reached every protected route.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
