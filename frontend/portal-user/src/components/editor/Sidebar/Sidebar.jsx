import React, { useCallback, useMemo } from "react";
import { useBlueprint } from "../../../context/BlueprintContext";
import { useSelection } from "../../../context/SelectionContext";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function findComponentInContent(content, componentId) {
  function searchInList(list) {
    for (const comp of list) {
      if (comp.uuid === componentId) return comp;
      const found = searchInList(comp.children ?? []);
      if (found) return found;
    }
    return null;
  }
  for (const page of content.pages ?? []) {
    for (const section of page.sections ?? []) {
      const found = searchInList(section.components ?? []);
      if (found) return found;
    }
  }
  return null;
}

function updateComponentInContent(content, componentId, updater) {
  function updateInList(list) {
    return list.map((comp) => {
      if (comp.uuid === componentId) return updater(comp);
      return { ...comp, children: updateInList(comp.children ?? []) };
    });
  }
  return {
    ...content,
    pages: (content.pages ?? []).map((page) => ({
      ...page,
      sections: (page.sections ?? []).map((section) => ({
        ...section,
        components: updateInList(section.components ?? []),
      })),
    })),
  };
}

// ─── Composants de panneau ────────────────────────────────────────────────────

function FieldRow({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "6px 8px", fontSize: "13px",
        border: "1px solid #E2E8F0", borderRadius: "6px",
        color: "#374151", background: "#fff", boxSizing: "border-box",
        outline: "none",
      }}
    />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)}
        style={{ width: "36px", height: "28px", border: "none", padding: 0, cursor: "pointer", borderRadius: "4px" }} />
      <TextInput value={value} onChange={onChange} />
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "4px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "12px", padding: "8px 16px 0" }}>
        {title}
      </div>
      <div style={{ padding: "0 16px" }}>{children}</div>
    </div>
  );
}

// ─── Sidebar principale ───────────────────────────────────────────────────────

export default function Sidebar() {
  const { blueprint, updateContent } = useBlueprint();

  // ── Mise à jour d'un champ de page ───────────────────────────────────────
  const updatePageField = useCallback((pageUuid, field, value) => {
    if (!blueprint) return;
    const newContent = {
      ...blueprint.content,
      pages: (blueprint.content.pages ?? []).map((p) =>
        p.uuid === pageUuid ? { ...p, [field]: value } : p
      ),
    };
    updateContent(newContent);
  }, [blueprint, updateContent]);
  const { selectedComponentId, selectedPageId, selectedSectionId } = useSelection();

  const selectedComponent = useMemo(() => {
    if (!selectedComponentId || !blueprint) return null;
    return findComponentInContent(blueprint.content, selectedComponentId);
  }, [selectedComponentId, blueprint]);

  const updateProp = useCallback((key, value) => {
    if (!blueprint || !selectedComponentId) return;
    const newContent = updateComponentInContent(blueprint.content, selectedComponentId, (comp) => ({
      ...comp,
      props: { ...comp.props, [key]: value },
    }));
    updateContent(newContent);
  }, [blueprint, selectedComponentId, updateContent]);

  const updateStyle = useCallback((key, value) => {
    if (!blueprint || !selectedComponentId) return;
    const newContent = updateComponentInContent(blueprint.content, selectedComponentId, (comp) => ({
      ...comp,
      styles: { ...comp.styles, [key]: value },
    }));
    updateContent(newContent);
  }, [blueprint, selectedComponentId, updateContent]);

  // ── État vide ─────────────────────────────────────────────────────────────

  if (!selectedComponentId && !selectedPageId && !selectedSectionId) {
    return (
      <aside style={sidebarStyle}>
        <div style={{ padding: "16px", borderBottom: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>Propriétés</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "8px", color: "#CBD5E1", padding: "24px" }}>
          <span style={{ fontSize: "28px" }}>👆</span>
          <span style={{ fontSize: "12px", textAlign: "center" }}>Cliquez sur un composant pour éditer ses propriétés</span>
        </div>
      </aside>
    );
  }

  // ── Sélection de page ─────────────────────────────────────────────────────

  if (selectedPageId && !selectedComponentId) {
    const page = blueprint?.content?.pages?.find((p) => p.uuid === selectedPageId);
    return (
      <aside style={sidebarStyle}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>Page</span>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151" }}>{page?.name}</div>
        </div>
        <Panel title="Informations">
          <FieldRow label="Nom">
            <TextInput
              value={page?.name}
              onChange={(v) => updatePageField(selectedPageId, "name", v)}
            />
          </FieldRow>
          <FieldRow label="Slug">
            <TextInput
              value={page?.slug}
              onChange={(v) => updatePageField(selectedPageId, "slug", v)}
            />
          </FieldRow>
          <FieldRow label="Chemin">
            <TextInput
              value={page?.path}
              onChange={(v) => updatePageField(selectedPageId, "path", v)}
            />
          </FieldRow>
        </Panel>
      </aside>
    );
  }

  // ── Sélection de composant ────────────────────────────────────────────────

  if (!selectedComponent) return null;

  return (
    <aside style={sidebarStyle}>
      {/* En-tête */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
        <span style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>
          {selectedComponent.type}
        </span>
        <div style={{ fontSize: "11px", color: "#CBD5E1", fontFamily: "monospace", marginTop: "2px" }}>
          {selectedComponent.uuid.slice(0, 8)}...
        </div>
      </div>

      {/* Panel Apparence */}
      <Panel title="✏️ Contenu">
        {(selectedComponent.type === "button" || selectedComponent.type === "text" || selectedComponent.type === "heading") && (
          <FieldRow label="Texte">
            <TextInput value={selectedComponent.props?.label} onChange={(v) => updateProp("label", v)} />
          </FieldRow>
        )}
        {selectedComponent.type === "input" && (
          <FieldRow label="Placeholder">
            <TextInput value={selectedComponent.props?.placeholder} onChange={(v) => updateProp("placeholder", v)} />
          </FieldRow>
        )}
        {selectedComponent.type === "image" && (
          <>
            <FieldRow label="URL image"><TextInput value={selectedComponent.props?.src} onChange={(v) => updateProp("src", v)} /></FieldRow>
            <FieldRow label="Texte alt"><TextInput value={selectedComponent.props?.alt} onChange={(v) => updateProp("alt", v)} /></FieldRow>
          </>
        )}
      </Panel>

      {/* Panel Typographie */}
      <Panel title="🔤 Typographie">
        <FieldRow label="Taille police"><TextInput value={selectedComponent.styles?.fontSize} onChange={(v) => updateStyle("fontSize", v)} /></FieldRow>
        <FieldRow label="Graisse">
          <select value={selectedComponent.styles?.fontWeight ?? "400"}
            onChange={(e) => updateStyle("fontWeight", e.target.value)}
            style={{ width: "100%", padding: "6px 8px", fontSize: "13px", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
            <option value="300">Light (300)</option>
            <option value="400">Normal (400)</option>
            <option value="600">Semi-bold (600)</option>
            <option value="700">Bold (700)</option>
          </select>
        </FieldRow>
        <FieldRow label="Couleur texte">
          <ColorInput value={selectedComponent.styles?.color} onChange={(v) => updateStyle("color", v)} />
        </FieldRow>
      </Panel>

      {/* Panel Apparence */}
      <Panel title="🎨 Apparence">
        <FieldRow label="Fond">
          <ColorInput value={selectedComponent.styles?.backgroundColor} onChange={(v) => updateStyle("backgroundColor", v)} />
        </FieldRow>
        <FieldRow label="Bordure"><TextInput value={selectedComponent.styles?.border} onChange={(v) => updateStyle("border", v)} /></FieldRow>
        <FieldRow label="Border radius"><TextInput value={selectedComponent.styles?.borderRadius} onChange={(v) => updateStyle("borderRadius", v)} /></FieldRow>
      </Panel>

      {/* Panel Espacement */}
      <Panel title="📐 Espacement">
        <FieldRow label="Padding"><TextInput value={selectedComponent.styles?.padding} onChange={(v) => updateStyle("padding", v)} /></FieldRow>
        <FieldRow label="Margin"><TextInput value={selectedComponent.styles?.margin} onChange={(v) => updateStyle("margin", v)} /></FieldRow>
        <FieldRow label="Largeur"><TextInput value={selectedComponent.styles?.width} onChange={(v) => updateStyle("width", v)} /></FieldRow>
      </Panel>
    </aside>
  );
}

const sidebarStyle = {
  width: "260px",
  minWidth: "260px",
  height: "100%",
  background: "#FFFFFF",
  borderLeft: "1px solid #E2E8F0",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
};
