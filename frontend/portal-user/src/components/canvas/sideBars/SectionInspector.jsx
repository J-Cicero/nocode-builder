import React, { useState, useEffect } from "react";
import { 
  Palette, 
  Type, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles, 
  Sliders, 
  Check, 
  X,
  AlertTriangle,
  MoveVertical
} from "lucide-react";

const PRESET_COLORS = [
  { name: "Blanc pur", value: "#FFFFFF", border: "#E2E8F0" },
  { name: "Slate 900", value: "#0F172A", border: "transparent" },
  { name: "Bleu nuit", value: "#1E293B", border: "transparent" },
  { name: "Orange EnoC", value: "#C4622D", border: "transparent" },
  { name: "Indigo 700", value: "#4338CA", border: "transparent" },
  { name: "Bleu pastel", value: "#EFF6FF", border: "#BFDBFE" },
  { name: "Gris clair", value: "#F8FAFC", border: "#E2E8F0" },
  { name: "Ambre chaud", value: "#FFFBEB", border: "#FDE68A" },
];

const PRESET_TEXT_COLORS = [
  { name: "Sombre", value: "#0F172A" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Gris moyen", value: "#64748B" },
  { name: "Orange EnoC", value: "#C4622D" },
  { name: "Bleu indigo", value: "#3B82F6" },
];

export default function SectionInspector({ 
  section, 
  page, 
  onUpdate, 
  onDelete, 
  onClose 
}) {
  const [title, setTitle] = useState(section?.title || section?.config?.title || "");
  const [config, setConfig] = useState(section?.config || {});
  const [styles, setStyles] = useState(section?.styles || {});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Synchroniser l'état local si la section change
  useEffect(() => {
    setTitle(section?.title || section?.config?.title || "");
    setConfig(section?.config || {});
    setStyles(section?.styles || {});
  }, [section?.tracking_id, section?.title, section?.config, section?.styles]);

  if (!section) return null;

  const triggerSave = async (updates) => {
    setSaveStatus("Enregistrement...");
    try {
      await onUpdate(section.tracking_id, updates);
      setSaveStatus("Enregistré ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Erreur sauvegarde section:", err);
      setSaveStatus("Erreur");
    }
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    const newConfig = { ...config, title: val };
    setConfig(newConfig);
    triggerSave({ title: val, config: newConfig });
  };

  const handleConfigChange = (key, val) => {
    const newConfig = { ...config, [key]: val };
    setConfig(newConfig);
    triggerSave({ config: newConfig });
  };

  const handleStyleChange = (key, val) => {
    const newStyles = { ...styles, [key]: val };
    setStyles(newStyles);
    triggerSave({ styles: newStyles });
  };

  // Monter / Descendre l'ordre
  const sortedSections = [...(page?.sections || [])].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  const currentIndex = sortedSections.findIndex(s => s.tracking_id === section.tracking_id);
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < sortedSections.length - 1;

  const handleMoveUp = async () => {
    if (!canMoveUp) return;
    const prevSection = sortedSections[currentIndex - 1];
    const newCurrentOrder = prevSection.ordre ?? (currentIndex - 1);
    const newPrevOrder = section.ordre ?? currentIndex;

    await onUpdate(section.tracking_id, { ordre: newCurrentOrder });
    await onUpdate(prevSection.tracking_id, { ordre: newPrevOrder });
  };

  const handleMoveDown = async () => {
    if (!canMoveDown) return;
    const nextSection = sortedSections[currentIndex + 1];
    const newCurrentOrder = nextSection.ordre ?? (currentIndex + 1);
    const newNextOrder = section.ordre ?? currentIndex;

    await onUpdate(section.tracking_id, { ordre: newCurrentOrder });
    await onUpdate(nextSection.tracking_id, { ordre: newNextOrder });
  };

  const currentBg = styles.backgroundColor || (section.type === "navbar" || section.type === "hero" ? "#0F172A" : "#FFFFFF");
  const currentTextColor = styles.color || (currentBg === "#0F172A" || currentBg === "#1E293B" ? "#FFFFFF" : "#0F172A");

  return (
    <div className="space-y-6 text-[#1A0E0A]">
      {/* Modale confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-lg">Supprimer la section ?</h3>
            </div>
            <p className="text-sm text-gray-600">
              Cette action retirera définitivement la section <strong>« {section.type} »</strong> de cette page.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  onDelete(section.tracking_id);
                  onClose();
                }}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section avec type et badge */}
      <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#C4622D] text-white font-mono uppercase text-xs font-bold rounded-md">
              {section.type}
            </span>
            <span className="text-xs text-gray-500 font-medium">Position #{currentIndex + 1}</span>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer la section"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Contrôles de réordonnancement rapide */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-200/80">
          <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <MoveVertical size={13} className="text-gray-400" />
            Déplacer :
          </span>
          <button
            onClick={handleMoveUp}
            disabled={!canMoveUp}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              canMoveUp 
                ? "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-sm" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent"
            }`}
          >
            <ArrowUp size={13} />
            Monter
          </button>
          <button
            onClick={handleMoveDown}
            disabled={!canMoveDown}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              canMoveDown 
                ? "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-sm" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent"
            }`}
          >
            <ArrowDown size={13} />
            Descendre
          </button>
        </div>
      </div>

      {/* Titre Principal */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Type size={14} className="text-[#C4622D]" />
          Titre de la section
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Ex: Bienvenue sur notre service"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] focus:border-transparent outline-none transition-all shadow-sm font-medium"
        />
      </div>

      {/* Champs spécifiques selon le type de section */}
      {section.type === "hero" && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Sous-titre / Description</label>
            <textarea
              rows={3}
              value={config.subtitle || ""}
              onChange={(e) => handleConfigChange("subtitle", e.target.value)}
              placeholder="Texte descriptif d'introduction..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Texte du Bouton CTA</label>
            <input
              type="text"
              value={config.ctaText || config.buttonText || ""}
              onChange={(e) => handleConfigChange("ctaText", e.target.value)}
              placeholder="Ex: Démarrer maintenant"
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
            />
          </div>
        </div>
      )}

      {section.type === "text-section" && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-600">Corps du texte</label>
          <textarea
            rows={5}
            value={config.content || ""}
            onChange={(e) => handleConfigChange("content", e.target.value)}
            placeholder="Rédigez votre paragraphe ici..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
          />
        </div>
      )}

      {section.type === "navbar" && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-600">Nom de marque / Logo</label>
          <input
            type="text"
            value={config.title || title || ""}
            onChange={(e) => handleConfigChange("title", e.target.value)}
            placeholder="Ex: Mon Entreprise"
            className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
          />
        </div>
      )}

      {section.type === "form" && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-600">Libellé du bouton d'envoi</label>
          <input
            type="text"
            value={config.buttonText || config.submitText || ""}
            onChange={(e) => handleConfigChange("buttonText", e.target.value)}
            placeholder="Ex: Envoyer ma demande"
            className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
          />
        </div>
      )}

      {/* Palette de Couleurs & Apparence */}
      <div className="space-y-4 pt-3 border-t border-gray-200">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Palette size={14} className="text-[#C4622D]" />
          Couleur d'arrière-plan
        </label>
        
        {/* Grille de presets couleurs */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleStyleChange("backgroundColor", preset.value)}
              className="group relative flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-gray-50 transition-all"
              title={preset.name}
            >
              <div 
                className="w-9 h-9 rounded-lg shadow-sm flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ 
                  backgroundColor: preset.value, 
                  border: `2px solid ${styles.backgroundColor === preset.value ? "#C4622D" : preset.border}` 
                }}
              >
                {styles.backgroundColor === preset.value && (
                  <Check size={14} className={preset.value === "#FFFFFF" || preset.value === "#F8FAFC" ? "text-gray-900" : "text-white"} />
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">
                {preset.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Input personnalisé HEX */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <input
            type="color"
            value={currentBg.startsWith("#") && currentBg.length === 7 ? currentBg : "#FFFFFF"}
            onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={styles.backgroundColor || ""}
            onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
            placeholder="#FFFFFF ou transparent"
            className="flex-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-mono outline-none uppercase font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* Couleur du Texte */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Palette size={14} className="text-[#C4622D]" />
          Couleur du texte
        </label>
        <div className="flex items-center gap-2">
          {PRESET_TEXT_COLORS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleStyleChange("color", preset.value)}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                styles.color === preset.value ? "ring-2 ring-offset-2 ring-[#C4622D]" : "border-gray-300"
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            >
              {styles.color === preset.value && (
                <Check size={12} className={preset.value === "#FFFFFF" ? "text-gray-900" : "text-white"} />
              )}
            </button>
          ))}
          <input
            type="color"
            value={currentTextColor.startsWith("#") && currentTextColor.length === 7 ? currentTextColor : "#000000"}
            onChange={(e) => handleStyleChange("color", e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer ml-auto border border-gray-200"
            title="Couleur personnalisée"
          />
        </div>
      </div>

      {/* Alignement & Espacement */}
      <div className="space-y-4 pt-3 border-t border-gray-200">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            Alignement du contenu
          </label>
          <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleStyleChange("textAlign", "left")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                styles.textAlign === "left" || !styles.textAlign ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlignLeft size={14} /> Gauche
            </button>
            <button
              onClick={() => handleStyleChange("textAlign", "center")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                styles.textAlign === "center" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlignCenter size={14} /> Centre
            </button>
            <button
              onClick={() => handleStyleChange("textAlign", "right")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                styles.textAlign === "right" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlignRight size={14} /> Droite
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Espacement vertical (Padding)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Compact", value: "32px 24px" },
              { label: "Normal", value: "60px 32px" },
              { label: "Aéré", value: "100px 40px" },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => handleStyleChange("padding", p.value)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  styles.padding === p.value 
                    ? "bg-[#C4622D] text-white border-[#C4622D]" 
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicateur de statut de sauvegarde */}
      {saveStatus && (
        <div className="text-center pt-2">
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 inline-block animate-fade-in">
            {saveStatus}
          </span>
        </div>
      )}
    </div>
  );
}
