import React from 'react';
import { useAuth } from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

/**
 * RoleGuard - Contrôle d'accès basé sur les rôles (RBAC)
 * Permet de restreindre des composants ou pages entières aux rôles autorisés.
 * 
 * @param {Array<string>} allow - Rôles autorisés (ex: ['admin', 'super_admin'])
 * @param {React.ReactNode} fallback - Affichage alternatif en cas d'accès refusé
 */
export default function RoleGuard({ allow = [], children, fallback = null }) {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (!allow || allow.length === 0 || allow.includes(userRole)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 text-amber-800 my-4">
      <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-sm">Accès restreint</h4>
        <p className="text-xs mt-1 text-amber-700">
          Cette fonctionnalité est réservée aux profils ayant le rôle [{allow.join(', ')}]. Votre rôle actuel est [{userRole}].
        </p>
      </div>
    </div>
  );
}
