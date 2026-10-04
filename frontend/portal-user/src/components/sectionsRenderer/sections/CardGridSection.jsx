import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function CardGridSection({ section, connectionData }) {
  const config = section.config || {};
  const styles = section.styles || {};
  const rawCards = connectionData || config.cards || [];
  const cards = Array.isArray(rawCards) ? rawCards : Object.values(rawCards || {});

  const getPriorityStyle = (priority) => {
    const val = String(priority || "").toLowerCase();
    if (val.includes("élevé") || val.includes("eleve") || val.includes("high")) {
      return { bg: "#FFF5F5", color: "#B03030", label: "Priorité Élevée" };
    }
    if (val.includes("moyen") || val.includes("medium")) {
      return { bg: "#FFF0E8", color: "#C4622D", label: "Priorité Moyenne" };
    }
    return { bg: "#E8F5EC", color: "#2D5A1B", label: "Priorité Faible" };
  };

  return (
    <div
      style={{
        padding: styles.padding || "32px 24px",
        backgroundColor: styles.backgroundColor || COLORS.background,
        transition: "all 0.2s ease-in-out",
      }}
    >
      {(section.title || config.title) && (
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: styles.color || COLORS.dark, marginBottom: "20px" }}>
          {config.title || section.title}
        </h2>
      )}

      {cards.length === 0 ? (
        <div
          style={{
            ...baseStyles.card,
            padding: "40px 24px",
            textAlign: "center",
            border: `2px dashed ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📋</div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: COLORS.dark, marginBottom: "6px" }}>
            Aucune tâche enregistrée
          </h3>
          <p style={{ fontSize: "14px", color: COLORS.text_muted, margin: 0 }}>
            Les éléments créés apparaîtront ici automatiquement dès qu'ils seront ajoutés.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
            gap: "20px",
          }}
        >
          {cards.map((card, i) => {
            const cardObj = typeof card === "object" ? card : { title: card };
            const priorityInfo = getPriorityStyle(cardObj.priorite || cardObj.priority);
            return (
              <div
                key={i}
                style={{
                  ...baseStyles.card,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justify: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: COLORS.dark,
                        margin: 0,
                      }}
                    >
                      {cardObj.titre || cardObj.title || cardObj.name || "Tâche"}
                    </h3>
                    {(cardObj.priorite || cardObj.priority) && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "4px 8px",
                          borderRadius: RADIUS.badge || "6px",
                          backgroundColor: priorityInfo.bg,
                          color: priorityInfo.color,
                        }}
                      >
                        {cardObj.priorite || cardObj.priority}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: COLORS.text_muted,
                      lineHeight: "1.5",
                      marginBottom: "12px",
                    }}
                  >
                    {cardObj.description || cardObj.content || "Sans description"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: `1px solid ${COLORS.border}`,
                    fontSize: "12px",
                    color: COLORS.text_muted,
                  }}
                >
                  <span>{cardObj.date_limite || cardObj.due_date || ""}</span>
                  {cardObj.statut && (
                    <span style={{ fontWeight: "600", color: COLORS.primary }}>
                      {cardObj.statut}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

