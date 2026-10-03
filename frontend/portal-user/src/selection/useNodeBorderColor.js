/*
* Hook spécialisé pour la gestion de la couleur de bordure des nœuds
* Gère spécifiquement la couleur des bordures
*/

import React, { useState, useEffect, useCallback } from "react";
import { useSelectedNode } from "./SelectionProvider";

/**
 * Utilitaire pour valider une couleur hexadécimale
 * @param {string} hex - La couleur au format hexadécimal
 * @returns {boolean} - True si la couleur est valide
 */
const isValidHex = (hex) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
};

/**
 * Hook pour gérer la couleur de bordure des nœuds
 */
export default function useNodeBorderColor() {
    const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
    const [currentColor, setCurrentColor] = useState("#000000");
    const [inputValue, setInputValue] = useState("000000");

    // Utiliser une ref pour getSelectedNode pour éviter les boucles
    const getSelectedNodeRef = React.useRef(getSelectedNode);
    React.useEffect(() => {
        getSelectedNodeRef.current = getSelectedNode;
    }, [getSelectedNode]);

    /**
     * Extrait la couleur de bordure actuelle du nœud sélectionné
     */
    useEffect(() => {
        if (selectedNodeId) {
            const node = getSelectedNodeRef.current();

            // Si getSelectedNode retourne null (pas de React Flow), utiliser les valeurs par défaut
            if (!node) {
                setCurrentColor("#000000");
                setInputValue("000000");
                return;
            }

            if (node) {
                const styles = { ...(node?.style || {}), ...(node?.data?.styles || {}) };
                let borderColor = null;
                if (node.type === 'buttonNode') {
                    borderColor = styles['--button-border-color'] || styles['--button-bg-color'] || styles.borderColor || '';
                } else {
                    borderColor = styles.borderColor || '';
                }
                if (borderColor && borderColor.startsWith('#')) {
                    setCurrentColor(borderColor);
                    setInputValue(borderColor.slice(1));
                } else {
                    // Defaults: button uses bg color fallback (#3b82f6), others #000000
                    const fallback = node.type === 'buttonNode' ? '#3b82f6' : '#000000';
                    setCurrentColor(fallback);
                    setInputValue(fallback.slice(1));
                }
            } else {
                setCurrentColor("#000000");
                setInputValue("000000");
            }
        } else {
            setCurrentColor("#000000");
            setInputValue("000000");
        }
    }, [selectedNodeId]); // Retirer getSelectedNode des dépendances

    /**
     * Applique la couleur de bordure au nœud sélectionné
     * @param {string} color - La couleur à appliquer
     */
    const applyBorderColor = useCallback((color) => {
        if (selectedNodeId && isValidHex(color)) {
            try {
                const node = getSelectedNodeRef.current();

                // Si pas de React Flow, on ne fait rien silencieusement
                if (!node) {
                    setCurrentColor(color);
                    return;
                }

                if (node.type === 'buttonNode') {
                    // Appliquer la bordure sur l'élément bouton via la variable CSS
                    updateSelectedNodeStyle({
                        '--button-border-color': color
                    });
                } else {
                    updateSelectedNodeStyle({
                        borderColor: color
                    });
                }
            } catch (error) {
                // En cas d'erreur, on met juste à jour l'état local
            }

            // Met à jour l'état local dans tous les cas
            setCurrentColor(color);
        }
    }, [selectedNodeId, updateSelectedNodeStyle]); // Retirer getSelectedNode

    /**
     * Gère le changement de valeur dans l'input hexadécimal
     * @param {string} value - La nouvelle valeur saisie
     */
    const handleInputChange = useCallback((value) => {
        const cleaned = value.replace('#', '').toUpperCase().slice(0, 6);
        setInputValue(cleaned);

        if (cleaned.length === 6 && isValidHex('#' + cleaned)) {
            const fullHex = '#' + cleaned;
            applyBorderColor(fullHex);
        }
    }, [applyBorderColor]);

    /**
     * Gère le changement via le sélecteur de couleur
     * @param {string} color - La couleur sélectionnée
     */
    const handleColorPicker = useCallback((color) => {
        applyBorderColor(color);
        setInputValue(color.slice(1));
    }, [applyBorderColor]);

    return {
        currentColor,
        inputValue,
        handleInputChange,
        handleColorPicker,
        hasSelectedNode: !!selectedNodeId
    };
}
