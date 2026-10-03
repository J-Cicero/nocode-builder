import React from "react";
import { Database } from "lucide-react";

/**
 * PreviewRenderer — Composant de rendu statique et interactif du Blueprint V1
 * Affiche l'arborescence des sections et composants sans dépendre de React Flow.
 */
export default function PreviewRenderer({ page }) {
  if (!page) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
        Aucune page sélectionnée
      </div>
    );
  }

  const sections = page.sections || [];

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 p-6 flex flex-col gap-8">
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-semibold">Page vide</p>
          <p className="text-sm">Aucun composant n'a été ajouté à cette page.</p>
        </div>
      ) : (
        sections.map((section, sIdx) => (
          <div 
            key={section.uuid || `section_${sIdx}`} 
            className="w-full bg-[#FAFAFA] border border-gray-100 rounded-2xl p-6 relative flex flex-wrap gap-4 min-h-[160px]"
          >
            {(section.components || []).length === 0 ? (
              <div className="w-full text-center text-xs text-gray-400 py-6">
                Section {section.type || "content"} — Aucun composant
              </div>
            ) : (
              section.components.map((comp) => (
                <RenderComponent key={comp.uuid || comp.id} component={comp} />
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}

function RenderComponent({ component }) {
  const { type, props = {}, styles = {} } = component;
  const label = props.label || props.text || type;
  const dataBinding = props.dataBinding;

  // Calcul du style de base
  const inlineStyles = {
    backgroundColor: styles.backgroundColor || styles.bgColor || undefined,
    color: styles.color || styles.textColor || undefined,
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
    fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
    padding: styles.padding ? `${styles.padding}px` : undefined,
    width: styles.width || 'auto',
    height: styles.height || 'auto',
    borderColor: styles.borderColor || undefined,
    borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : undefined,
    borderStyle: styles.borderWidth ? 'solid' : undefined,
  };

  const renderBindingBadge = () => {
    if (!dataBinding) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-2">
        <Database size={10} />
        {dataBinding.table ? `${dataBinding.table}.${dataBinding.field || '*'}` : 'Bound'}
      </span>
    );
  };

  switch (type?.toLowerCase()) {
    case 'button':
    case 'buttonnode':
      return (
        <button
          style={inlineStyles}
          className="px-5 py-2.5 bg-[#C4622D] text-white font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>{label}</span>
          {renderBindingBadge()}
        </button>
      );

    case 'heading':
    case 'headingnode':
      return (
        <div style={inlineStyles} className="w-full">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            {label}
            {renderBindingBadge()}
          </h2>
        </div>
      );

    case 'text':
    case 'textnode':
      return (
        <div style={inlineStyles} className="text-base text-gray-700 leading-relaxed flex items-center">
          <span>{label}</span>
          {renderBindingBadge()}
        </div>
      );

    case 'input':
    case 'inputnode':
      return (
        <div style={inlineStyles} className="flex flex-col gap-1 w-full max-w-sm">
          <label className="text-xs font-semibold text-gray-600 flex items-center">
            {label}
            {renderBindingBadge()}
          </label>
          <input
            type={props.type || 'text'}
            placeholder={props.placeholder || 'Saisissez une valeur...'}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-sm"
          />
        </div>
      );

    case 'card':
    case 'cardnode':
    case 'container':
    case 'containernode':
      return (
        <div
          style={inlineStyles}
          className="w-full p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-bold text-gray-800 text-sm flex items-center">
              {label}
              {renderBindingBadge()}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {props.content || "Contenu du conteneur / de la carte."}
          </div>
        </div>
      );

    case 'nav':
    case 'navnode':
      return (
        <nav style={inlineStyles} className="w-full px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <span className="font-bold text-lg text-[#C4622D]">{label}</span>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <span>Accueil</span>
            <span>Fonctionnalités</span>
            <span>Contact</span>
          </div>
        </nav>
      );

    default:
      return (
        <div
          style={inlineStyles}
          className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-600 text-sm flex items-center justify-between gap-2"
        >
          <span className="font-medium">{label}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{type}</span>
          {renderBindingBadge()}
        </div>
      );
  }
}
