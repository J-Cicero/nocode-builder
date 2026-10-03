/*
* Hook spécialisé pour la gestion de la couleur du texte des nœuds
* Gère spécifiquement la couleur du texte
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
 * Hook pour gérer la couleur du texte des nœuds
 */
export default function useNodeTextColor() {
    const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
    const [currentColor, setCurrentColor] = useState("#000000");
    const [inputValue, setInputValue] = useState("000000");

    // Utiliser une ref pour getSelectedNode pour éviter les boucles
    const getSelectedNodeRef = React.useRef(getSelectedNode);
    React.useEffect(() => {
        getSelectedNodeRef.current = getSelectedNode;
    }, [getSelectedNode]);

    /**
     * Extrait la couleur de texte actuelle du nœud sélectionné
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
                const nodeType = node.type;
                const textColor = nodeType === 'buttonNode'
                    ? (styles['--button-text-color'] || styles.color || '')
                    : (styles.color || '');

                if (textColor && textColor.startsWith('#')) {
                    setCurrentColor(textColor);
                    setInputValue(textColor.slice(1));
                } else {
                    const fallback = nodeType === 'buttonNode' ? '#FFFFFF' : '#000000';
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
     * Applique la couleur de texte au nœud sélectionné
     * @param {string} color - La couleur à appliquer
     */
    const applyTextColor = useCallback((color) => {
        if (selectedNodeId && isValidHex(color)) {
            try {
                const node = getSelectedNodeRef.current();

                // Si pas de React Flow, on ne fait rien silencieusement
                if (!node) {
                    setCurrentColor(color);
                    return;
                }

                if (node.type === 'buttonNode') {
                    updateSelectedNodeStyle({
                        '--button-text-color': color
                    });
                } else {
                    updateSelectedNodeStyle({
                        color: color
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
            applyTextColor(fullHex);
        }
    }, [applyTextColor]);

    /**
     * Gère le changement via le sélecteur de couleur
     * @param {string} color - La couleur sélectionnée
     */
    const handleColorPicker = useCallback((color) => {
        applyTextColor(color);
        setInputValue(color.slice(1));
    }, [applyTextColor]);

    return {
        currentColor,
        inputValue,
        handleInputChange,
        handleColorPicker,
        hasSelectedNode: !!selectedNodeId
    };
}
