import React from "react";
import { Database } from "lucide-react";

/**
 * Normalise et fusionne les styles par défaut, les styles React Flow et les styles utilisateur.
 * 
 * @param {string} nodeType - Le type de nœud (ex: 'buttonNode', 'cardNode', etc.)
 * @param {object} nodeStyle - Styles venant de props.style (React Flow)
 * @param {object} dataStyles - Styles venant de props.data.styles (Editeur)
 * @param {object} defaults - Styles par défaut du composant
 * @returns {object} - Objet de style CSS prêt à être appliqué
 */
export function getComputedStyle(nodeType, nodeStyle, dataStyles, defaults = {}) {
  const styles = { ...(nodeStyle || {}), ...(dataStyles || {}) };
  
  let backgroundColor = styles.backgroundColor;
  let textColor = styles.color || styles.textColor;
  let borderColor = styles.borderColor;
  let borderRadius = styles.borderRadius;
  let borderWidth = styles.borderWidth;
  let borderStyle = styles.borderStyle || defaults.borderStyle || 'solid';

  if (nodeType === 'buttonNode') {
    backgroundColor = backgroundColor || styles['--button-bg-color'] || defaults.backgroundColor || '#3b82f6';
    textColor = textColor || styles['--button-text-color'] || defaults.color || '#ffffff';
    borderColor = borderColor || styles['--button-border-color'] || backgroundColor || '#3b82f6';
    borderRadius = borderRadius !== undefined ? borderRadius : (styles['--button-border-radius'] !== undefined ? styles['--button-border-radius'] : (defaults.borderRadius || '6px'));
    borderWidth = borderWidth !== undefined ? borderWidth : (styles['--button-border-width'] !== undefined ? styles['--button-border-width'] : (defaults.borderWidth || '1px'));
  } else {
    backgroundColor = backgroundColor || defaults.backgroundColor || 'transparent';
    textColor = textColor || defaults.color || '#000000';
    borderColor = borderColor || defaults.borderColor || 'transparent';
    borderRadius = borderRadius !== undefined ? borderRadius : (defaults.borderRadius || '0px');
    borderWidth = borderWidth !== undefined ? borderWidth : (defaults.borderWidth || '0px');
  }

  // Formate la valeur en pixel si c'est un nombre
  const formatPx = (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'number') return `${val}px`;
    // Si c'est juste un nombre sous forme de chaîne de caractères
    if (/^\d+$/.test(val.trim())) return `${val.trim()}px`;
    return val;
  };

  const formattedBorderWidth = formatPx(borderWidth) || '0px';
  const border = styles.border || (formattedBorderWidth !== '0px' && borderStyle !== 'none'
    ? `${formattedBorderWidth} ${borderStyle} ${borderColor}`
    : 'none');

  return {
    color: textColor,
    backgroundColor: backgroundColor,
    border: border,
    borderRadius: formatPx(borderRadius) || '0px',
    opacity: styles.opacity !== undefined ? Number(styles.opacity) : (defaults.opacity ?? 1),
    boxShadow: styles.boxShadow || defaults.boxShadow || 'none',
    width: styles.width || defaults.width || '100%',
    height: styles.height || defaults.height || 'auto',
    textAlign: styles.textAlign || defaults.textAlign || 'left',
    padding: styles.padding || defaults.padding || '0px',
    margin: styles.margin || defaults.margin || '0px',
    transform: styles.transform || (styles.rotation !== undefined ? `rotate(${styles.rotation}deg)` : undefined) || defaults.transform,
  };
}

/**
 * Extrait les informations de liaison de données
 */
export function getBindingInfo(data) {
  const tables = data?.tables || [];
  const dataBinding = data?.component?.config?.dataBinding;
  
  if (dataBinding?.tableId && dataBinding?.fieldId) {
    const table = tables.find(t => t.tracking_id === dataBinding.tableId);
    const field = table?.fields?.find(f => f.tracking_id === dataBinding.fieldId);
    if (table && field) {
      return {
        isBound: true,
        tableName: table.name,
        fieldName: field.name,
        displayText: `{${table.name}.${field.name}}`,
      };
    }
  }
  return {
    isBound: false,
    tableName: "",
    fieldName: "",
    displayText: "",
  };
}

/**
 * Badge visuel violet pour les éléments liés
 */
export function BindingBadge({ data }) {
  const binding = getBindingInfo(data);
  if (!binding.isBound) return null;
  
  return (
    <div 
      className="absolute top-2 right-2 z-[99] bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-full shadow-md flex items-center justify-center transition-all cursor-help scale-95 hover:scale-115"
      title={`Lié à la base de données : ${binding.tableName}.${binding.fieldName}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Database className="w-3 h-3" />
    </div>
  );
}
