import React, { useContext } from "react";
import NavbarSection from "./sections/NavbarSection";
import HeroSection from "./sections/HeroSection";
import StatsRowSection from "./sections/StatsRowSection";
import DataTableSection from "./sections/DataTableSection";
import FormSection from "./sections/FormSection";
import CardGridSection from "./sections/CardGridSection";
import TextSection from "./sections/TextSection";
import MobileHeaderSection from "./sections/MobileHeaderSection";
import MobileCardListSection from "./sections/MobileCardListSection";
import BottomNavSection from "./sections/BottomNavSection";
import SelectionContext from "../../context/SelectionContext";

const sectionComponents = {
  navbar: NavbarSection,
  hero: HeroSection,
  "stats-row": StatsRowSection,
  "data-table": DataTableSection,
  form: FormSection,
  "card-grid": CardGridSection,
  "text-section": TextSection,
  "mobile-header": MobileHeaderSection,
  "mobile-card-list": MobileCardListSection,
  "bottom-nav": BottomNavSection,
};

export default function SectionRenderer({ sections = [], connectionsMap = {} }) {
  const selectionCtx = useContext(SelectionContext);
  const selectedSectionId = selectionCtx?.selectedSectionId;
  const selectSection = selectionCtx?.selectSection;

  if (!sections || sections.length === 0) {
    return null;
  }

  const sectionsList = Array.isArray(sections) ? sections : [];

  return (
    <div className="w-full">
      {sectionsList
        .sort((a, b) => (a?.ordre || 0) - (b?.ordre || 0))
        .map((section) => {
          if (!section || !section.type) {
            return null;
          }

          const Component = sectionComponents[section.type];
          if (!Component) {
            return (
              <div
                key={section.tracking_id || Math.random()}
                className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm"
              >
                Unknown section type: {section.type}
              </div>
            );
          }

          const isSelected = selectedSectionId === section.tracking_id;

          return (
            <div
              key={section.tracking_id || Math.random()}
              onClick={(e) => {
                e.stopPropagation();
                if (section.tracking_id && selectSection) {
                  selectSection(section.tracking_id);
                }
              }}
              style={{
                position: "relative",
                outline: isSelected ? "2px solid #C4622D" : "1px transparent solid",
                outlineOffset: "-2px",
                cursor: "pointer",
                transition: "outline 0.15s ease-in-out",
              }}
              className="hover:outline hover:outline-2 hover:outline-amber-400 group"
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "8px",
                    zIndex: 20,
                    backgroundColor: "#C4622D",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  Section sélectionnée ({section.type})
                </div>
              )}
              <Component
                section={section}
                connectionData={connectionsMap[section.connecte_a]}
              />
            </div>
          );
        })}
    </div>
  );
}


