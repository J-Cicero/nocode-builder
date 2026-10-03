/*
* Hook spécialisé pour la gestion des couleurs des nœuds
*/

import { useState, useEffect, useCallback } from "react";
import { useSelectedNode } from "./SelectionProvider";

// Utilitaire pour convertir hex en rgb
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Utilitaire pour valider une couleur hex
const isValidHex = (hex) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
};

// Fonction utilitaire pour déterminer la couleur du texte en fonction du fond
function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

export default function useNodeColor() {
    const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
    const [currentColor, setCurrentColor] = useState("#FFFFFF");
    const [inputValue, setInputValue] = useState("FFFFFF");

    // Met à jour la couleur locale quand un nœud est sélectionné
    useEffect(() => {
        if (selectedNodeId) {
            const node = getSelectedNode();
            if (node && node.style && node.style.backgroundColor) {
                const bgColor = node.style.backgroundColor;
                // Si c'est déjà en hex
                if (bgColor.startsWith('#')) {
                    setCurrentColor(bgColor);
                    setInputValue(bgColor.slice(1));
                } else {
                    // Convertir d'autres formats si nécessaire
                    setCurrentColor("#FFFFFF");
                    setInputValue("FFFFFF");
                }
            } else {
                setCurrentColor("#FFFFFF");
                setInputValue("FFFFFF");
            }
        } else {
            setCurrentColor("#FFFFFF");
            setInputValue("FFFFFF");
        }
    }, [selectedNodeId, getSelectedNode]);

    // Applique la couleur au nœud
    const applyColor = useCallback((color) => {
        if (selectedNodeId && isValidHex(color)) {
            updateSelectedNodeStyle({
                backgroundColor: color,
                border: `2px solid ${color}`,
                color: getContrastColor(color)
            });
            setCurrentColor(color);
        }
    }, [selectedNodeId, updateSelectedNodeStyle]);

    // Gère le changement dans l'input
    const handleInputChange = useCallback((value) => {
        // Nettoie l'input (supprime # si présent, limite à 6 caractères)
        const cleaned = value.replace('#', '').toUpperCase().slice(0, 6);
        setInputValue(cleaned);

        // Si c'est une couleur valide, l'applique
        if (cleaned.length === 6 && isValidHex('#' + cleaned)) {
            const fullHex = '#' + cleaned;
            applyColor(fullHex);
        }
    }, [applyColor]);

    // Sélecteur de couleur
    const handleColorPicker = useCallback((color) => {
        applyColor(color);
        setInputValue(color.slice(1));
    }, [applyColor]);

    return {
        currentColor,
        inputValue,
        handleInputChange,
        handleColorPicker,
        hasSelectedNode: !!selectedNodeId
    };
}
