/**
 * EXEMPLE D'UTILISATION - getPropriete.js
 * Ce fichier montre comment utiliser les fonctions de récupération des propriétés
 */

import {
    useSelectedNode,
    getNodeProperties,
    getNodeColors,
    formatPropertiesForDisplay
} from '../selection';

// ==========================================
// EXEMPLE 1: Afficher toutes les propriétés dans la console
// ==========================================
export function debugSelectedNode() {
    const { getSelectedNode } = useSelectedNode();

    const node = getSelectedNode();
    if (!node) {
        console.log('❌ Aucun nœud sélectionné');
        return;
    }

    const properties = getNodeProperties(node);
    console.log('📦 Propriétés complètes:', properties);
    console.log(formatPropertiesForDisplay(properties));
}

// ==========================================
// EXEMPLE 2: Composant React qui affiche les propriétés
// ==========================================
export function NodePropertiesDisplay() {
    const { getSelectedNode, selectedNodeId } = useSelectedNode();

    if (!selectedNodeId) {
        return (
            <div className="p-4 bg-gray-100 rounded">
                <p className="text-gray-600">Sélectionnez un nœud pour voir ses propriétés</p>
            </div>
        );
    }

    const node = getSelectedNode();
    const props = getNodeProperties(node);

    if (!props) {
        return <div>Erreur lors de la récupération des propriétés</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow space-y-4">
            <div className="border-b pb-2">
                <h3 className="font-bold text-lg">{props.type}</h3>
                <p className="text-sm text-gray-500">ID: {props.id}</p>
            </div>

            {/* Couleurs */}
            <div>
                <h4 className="font-semibold mb-2">🎨 Couleurs</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                        <span>Fond:</span>
                        <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: props.colors.backgroundColor }}
                        />
                        <span className="font-mono">{props.colors.backgroundColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Texte:</span>
                        <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: props.colors.textColor }}
                        />
                        <span className="font-mono">{props.colors.textColor}</span>
                    </div>
                </div>
            </div>

            {/* Position */}
            <div>
                <h4 className="font-semibold mb-2">📍 Position</h4>
                <div className="text-sm space-y-1">
                    <p>X: {props.position.x}px</p>
                    <p>Y: {props.position.y}px</p>
                    <p>Rotation: {props.position.rotation}°</p>
                </div>
            </div>

            {/* Dimensions */}
            <div>
                <h4 className="font-semibold mb-2">📐 Dimensions</h4>
                <div className="text-sm space-y-1">
                    <p>Largeur: {props.layout.width}</p>
                    <p>Hauteur: {props.layout.height}</p>
                    <p>Alignement: {props.layout.textAlign}</p>
                </div>
            </div>

            {/* Apparence */}
            <div>
                <h4 className="font-semibold mb-2">✨ Apparence</h4>
                <div className="text-sm space-y-1">
                    <p>Opacité: {props.appearance.opacity}%</p>
                    <p>Border Radius: {props.appearance.borderRadius}px</p>
                    <p>Border Width: {props.appearance.borderWidth}px</p>
                    <p>Ombre: Niveau {props.appearance.shadowIntensity}/5</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// EXEMPLE 3: Copier les styles d'un nœud vers un autre
// ==========================================
export function copyNodeStyles(sourceNode, targetNodeId, updateNodeStyle) {
    const sourceProps = getNodeProperties(sourceNode);

    if (!sourceProps) {
        console.error('Impossible de récupérer les propriétés du nœud source');
        return false;
    }

    // Construire l'objet de styles à copier
    const stylesToCopy = {
        // Couleurs
        backgroundColor: sourceProps.colors.backgroundColor,
        color: sourceProps.colors.textColor,
        borderColor: sourceProps.colors.borderColor,

        // Apparence
        opacity: sourceProps.appearance.opacityRaw,
        borderRadius: `${sourceProps.appearance.borderRadius}px`,
        borderWidth: `${sourceProps.appearance.borderWidth}px`,
        borderStyle: sourceProps.appearance.borderStyle,
        boxShadow: sourceProps.appearance.boxShadow,

        // Layout
        width: sourceProps.layout.width,
        height: sourceProps.layout.height,
        textAlign: sourceProps.layout.textAlign,
    };

    // Appliquer au nœud cible
    updateNodeStyle(targetNodeId, stylesToCopy);

    console.log('✅ Styles copiés avec succès !');
    return true;
}

// ==========================================
// EXEMPLE 4: Sauvegarder et restaurer un nœud
// ==========================================
export function saveNodeToLocalStorage(node) {
    const properties = getNodeProperties(node);

    if (!properties) {
        console.error('Impossible de sauvegarder le nœud');
        return false;
    }

    try {
        const key = `saved-node-${node.id}`;
        localStorage.setItem(key, JSON.stringify(properties));
        console.log(`✅ Nœud sauvegardé: ${key}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

export function restoreNodeFromLocalStorage(nodeId, updateNodeStyle, updateNodePosition) {
    try {
        const key = `saved-node-${nodeId}`;
        const saved = localStorage.getItem(key);

        if (!saved) {
            console.warn(`Aucune sauvegarde trouvée pour ${nodeId}`);
            return false;
        }

        const properties = JSON.parse(saved);

        // Restaurer le style
        updateNodeStyle(nodeId, properties.rawStyle);

        // Restaurer la position
        updateNodePosition(nodeId, properties.rawPosition);

        console.log(`✅ Nœud restauré: ${nodeId}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error);
        return false;
    }
}

// ==========================================
// EXEMPLE 5: Comparer deux nœuds
// ==========================================
export function compareNodes(node1, node2) {
    const props1 = getNodeProperties(node1);
    const props2 = getNodeProperties(node2);

    if (!props1 || !props2) {
        console.error('Impossible de comparer les nœuds');
        return null;
    }

    const comparison = {
        // Couleurs identiques ?
        sameColors:
            props1.colors.backgroundColor === props2.colors.backgroundColor &&
            props1.colors.textColor === props2.colors.textColor &&
            props1.colors.borderColor === props2.colors.borderColor,

        // Position identique ?
        samePosition:
            props1.position.x === props2.position.x &&
            props1.position.y === props2.position.y &&
            props1.position.rotation === props2.position.rotation,

        // Dimensions identiques ?
        sameDimensions:
            props1.layout.width === props2.layout.width &&
            props1.layout.height === props2.layout.height,

        // Apparence identique ?
        sameAppearance:
            props1.appearance.opacity === props2.appearance.opacity &&
            props1.appearance.borderRadius === props2.appearance.borderRadius &&
            props1.appearance.shadowIntensity === props2.appearance.shadowIntensity,

        // Type identique ?
        sameType: props1.type === props2.type
    };

    // Calcul du score de similarité (0-100%)
    const totalChecks = 5;
    const matches = Object.values(comparison).filter(Boolean).length;
    comparison.similarityScore = Math.round((matches / totalChecks) * 100);

    return comparison;
}

// ==========================================
// EXEMPLE 6: Exporter les propriétés en JSON
// ==========================================
export function exportNodeToJSON(node) {
    const properties = getNodeProperties(node);

    if (!properties) {
        console.error('Impossible d\'exporter le nœud');
        return null;
    }

    const json = JSON.stringify(properties, null, 2);

    // Créer un fichier téléchargeable
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `node-${properties.id}-export.json`;
    link.click();

    console.log('✅ Nœud exporté en JSON');
    return json;
}

// ==========================================
// EXEMPLE 7: Vérifier si un nœud a des propriétés spécifiques
// ==========================================
export function nodeHasProperties(node, requiredProps) {
    const properties = getNodeProperties(node);

    if (!properties) return false;

    const checks = {
        hasCustomColors: properties.colors.backgroundColor !== '#FFFFFF',
        hasRotation: properties.position.rotation !== 0,
        hasCustomSize: properties.layout.width !== 'auto' || properties.layout.height !== 'auto',
        hasShadow: properties.appearance.shadowIntensity > 0,
        hasOpacity: properties.appearance.opacity < 100,
        hasRoundedCorners: properties.appearance.borderRadius > 0,
        hasBorder: properties.appearance.borderWidth > 0,
    };

    return requiredProps.every(prop => checks[prop]);
}

// ==========================================
// EXEMPLE 8: Générer un rapport de propriétés
// ==========================================
export function generateNodeReport(node) {
    const properties = getNodeProperties(node);

    if (!properties) {
        return 'Impossible de générer le rapport';
    }

    const report = {
        summary: `Nœud ${properties.type} (${properties.id})`,
        timestamp: new Date().toISOString(),
        properties: properties,
        formatted: formatPropertiesForDisplay(properties),
        stats: {
            hasCustomColors: properties.colors.backgroundColor !== '#FFFFFF',
            isRotated: properties.position.rotation !== 0,
            hasCustomSize: properties.layout.widthNumeric > 0,
            hasShadow: properties.appearance.shadowIntensity > 0,
            isTransparent: properties.appearance.opacity < 100
        }
    };

    return report;
}

// ==========================================
// EXEMPLE 9: Utilisation dans un hook personnalisé
// ==========================================
import { useMemo } from 'react';

export function useNodeProperties() {
    const { getSelectedNode, selectedNodeId } = useSelectedNode();

    const properties = useMemo(() => {
        if (!selectedNodeId) return null;

        const node = getSelectedNode();
        return getNodeProperties(node);
    }, [selectedNodeId, getSelectedNode]);

    return properties;
}

// Utilisation du hook:
// const properties = useNodeProperties();
// if (properties) {
//     console.log('Couleur de fond:', properties.colors.backgroundColor);
// }

// ==========================================
// EXEMPLE 10: Créer un preset depuis un nœud
// ==========================================
export function createPresetFromNode(node, presetName) {
    const properties = getNodeProperties(node);

    if (!properties) {
        console.error('Impossible de créer le preset');
        return null;
    }

    const preset = {
        name: presetName,
        description: `Preset créé depuis ${properties.type}`,
        createdAt: new Date().toISOString(),
        styles: {
            colors: properties.colors,
            layout: {
                width: properties.layout.width,
                height: properties.layout.height,
                textAlign: properties.layout.textAlign
            },
            appearance: {
                opacity: properties.appearance.opacityRaw,
                borderRadius: properties.appearance.borderRadius,
                borderWidth: properties.appearance.borderWidth,
                shadowIntensity: properties.appearance.shadowIntensity
            }
        }
    };

    // Sauvegarder le preset
    const presets = JSON.parse(localStorage.getItem('nodePresets') || '[]');
    presets.push(preset);
    localStorage.setItem('nodePresets', JSON.stringify(presets));

    console.log(`✅ Preset "${presetName}" créé avec succès !`);
    return preset;
}

export default {
    debugSelectedNode,
    NodePropertiesDisplay,
    copyNodeStyles,
    saveNodeToLocalStorage,
    restoreNodeFromLocalStorage,
    compareNodes,
    exportNodeToJSON,
    nodeHasProperties,
    generateNodeReport,
    useNodeProperties,
    createPresetFromNode
};

