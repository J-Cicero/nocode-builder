/*
* Hook spécialisé pour la gestion de la couleur de fond des nœuds
* Gère spécifiquement la couleur de background et s'adapte au type de nœud
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
 * Utilitaire pour convertir hex en rgb
 * @param {string} hex - La couleur hexadécimale
 * @returns {object|null} - Objet avec r, g, b ou null si invalide
 */
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Détermine la couleur du texte en fonction de la couleur de fond pour un bon contraste
 * @param {string} hexColor - La couleur de fond
 * @returns {string} - Couleur du texte (#000000 ou #FFFFFF)
 */
const getContrastColor = (hexColor) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
};

/**
 * Hook pour gérer la couleur de fond des nœuds
 * S'adapte automatiquement au type de nœud (TextNode, ButtonNode, etc.)
 */
export default function useNodeBackgroundColor() {
    const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
    const [currentColor, setCurrentColor] = useState("#FFFFFF");
    const [inputValue, setInputValue] = useState("FFFFFF");

    // Utiliser une ref pour getSelectedNode pour éviter les boucles
    const getSelectedNodeRef = React.useRef(getSelectedNode);
    React.useEffect(() => {
        getSelectedNodeRef.current = getSelectedNode;
    }, [getSelectedNode]);

    /**
     * Extrait la couleur actuelle du nœud sélectionné
     * Met à jour l'état local quand un nœud est sélectionné
     */
    useEffect(() => {
        if (selectedNodeId) {
            // Vérification pour éviter les boucles infinies quand React Flow n'est pas disponible
            try {
                const node = getSelectedNodeRef.current();

                // Si getSelectedNode retourne null (pas de React Flow), utiliser les valeurs par défaut
                if (!node) {
                    setCurrentColor("#FFFFFF");
                    setInputValue("FFFFFF");
                    return;
                }

                const nodeType = node?.type;

                if (node) {
                    const styles = { ...(node?.style || {}), ...(node?.data?.styles || {}) };
                    let bgColor = null;

                    // Récupère la couleur selon le type de nœud
                    if (nodeType === 'buttonNode') {
                        // Pour les boutons, on lit la variable CSS
                        bgColor = styles['--button-bg-color'] || styles.backgroundColor;
                    } else {
                        // Pour les autres nœuds, on lit backgroundColor
                        bgColor = styles.backgroundColor;
                    }

                    // Traite la couleur récupérée
                    if (bgColor && bgColor.startsWith('#')) {
                        setCurrentColor(bgColor);
                        setInputValue(bgColor.slice(1));
                    } else {
                        // Valeurs par défaut selon le type
                        const defaultColor = nodeType === 'buttonNode' ? "#3b82f6" : "#FFFFFF";
                        setCurrentColor(defaultColor);
                        setInputValue(defaultColor.slice(1));
                    }
                } else {
                    // Pas de style défini, utiliser les valeurs par défaut
                    const defaultColor = node?.type === 'buttonNode' ? "#3b82f6" : "#FFFFFF";
                    setCurrentColor(defaultColor);
                    setInputValue(defaultColor.slice(1));
                }
            } catch (error) {
                // En cas d'erreur, utiliser les valeurs par défaut
                setCurrentColor("#FFFFFF");
                setInputValue("FFFFFF");
            }
        } else {
            // Aucun nœud sélectionné
            setCurrentColor("#FFFFFF");
            setInputValue("FFFFFF");
        }
    }, [selectedNodeId]); // Ne plus inclure getSelectedNode dans les dépendances

    /**
     * Applique la couleur de fond au nœud sélectionné
     * S'adapte au type de nœud pour cibler le bon élément
     * @param {string} color - La couleur à appliquer
     */
    const applyBackgroundColor = useCallback((color) => {
        console.log('🎨 applyBackgroundColor appelé avec:', color);
        console.log('  - selectedNodeId:', selectedNodeId);
        console.log('  - isValidHex:', isValidHex(color));

        if (selectedNodeId && isValidHex(color)) {
            // Fonction pour tenter de récupérer et appliquer la couleur
            const tryApplyColor = (attempt = 0) => {
                try {
                    const node = getSelectedNodeRef.current();
                    console.log(`  - Tentative ${attempt + 1}: Nœud récupéré:`, node ? `${node.id} (type: ${node.type})` : 'null');

                    // Si pas de nœud et qu'on n'a pas dépassé les tentatives, réessayer
                    if (!node && attempt < 3) {
                        console.log(`  ⏳ Attente de React Flow... (tentative ${attempt + 1}/3)`);
                        setTimeout(() => tryApplyColor(attempt + 1), 50);
                        return;
                    }

                    // Si toujours pas de nœud après les tentatives
                    if (!node) {
                        console.warn('  ⚠️ Nœud toujours non disponible après 3 tentatives');
                        setCurrentColor(color);
                        return;
                    }

                    const nodeType = node?.type;
                    console.log('  - Type de nœud:', nodeType);

                    // Adaptation selon le type de nœud
                    const textColor = getContrastColor(color);
                    
                    switch (nodeType) {
                        case 'buttonNode':
                            console.log('  🔵 Application style ButtonNode');
                            updateSelectedNodeStyle({
                                '--button-bg-color': color,
                                color: textColor,
                            });
                            break;

                        case 'textNode':
                        default:
                            console.log('  📝 Application style TextNode');
                            updateSelectedNodeStyle({
                                backgroundColor: color,
                                color: textColor,
                            });
                            break;
                    }

                    console.log('  ✅ Style appliqué avec succès');
                } catch (error) {
                    console.error('  ❌ Erreur dans applyBackgroundColor:', error);
                }

                // Met à jour l'état local dans tous les cas
                setCurrentColor(color);
                console.log('  🔄 État local mis à jour');
            };

            // Démarrer la première tentative
            tryApplyColor(0);
        } else {
            console.warn('  ⚠️ Conditions non remplies pour applyBackgroundColor');
        }
    }, [selectedNodeId, updateSelectedNodeStyle]); // Retirer getSelectedNode

    /**
     * Gère le changement de valeur dans l'input hexadécimal
     * @param {string} value - La nouvelle valeur saisie
     */
    const handleInputChange = useCallback((value) => {
        // Nettoie l'input (supprime # si présent, limite à 6 caractères, majuscules)
        const cleaned = value.replace('#', '').toUpperCase().slice(0, 6);
        setInputValue(cleaned);

        // Si c'est une couleur valide à 6 caractères, l'applique immédiatement
        if (cleaned.length === 6 && isValidHex('#' + cleaned)) {
            const fullHex = '#' + cleaned;
            applyBackgroundColor(fullHex);
        }
    }, [applyBackgroundColor]);

    /**
     * Gère le changement via le sélecteur de couleur
     * @param {string} color - La couleur sélectionnée
     */
    const handleColorPicker = useCallback((color) => {
        applyBackgroundColor(color);
        setInputValue(color.slice(1));
    }, [applyBackgroundColor]);

    // Retourne les valeurs et fonctions nécessaires au composant
    return {
        currentColor,
        inputValue,
        handleInputChange,
        handleColorPicker,
        hasSelectedNode: !!selectedNodeId
    };
}
