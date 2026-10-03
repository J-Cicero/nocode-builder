/**
 * Fichier getPropriete.js
 * Récupère toutes les propriétés actuelles d'un nœud sélectionné
 * Propriétés : Couleurs, Position, Layout, Apparence, Bordures, Effets
 */

/**
 * Extrait une valeur numérique d'une chaîne CSS (ex: "10px" -> 10)
 * @param {string} value - La valeur CSS
 * @returns {number} - La valeur numérique
 */
const extractNumericValue = (value) => {
    if (!value) return 0;
    const num = parseFloat(value.toString().replace('px', '').replace('%', ''));
    return isNaN(num) ? 0 : num;
};

/**
 * Convertit une valeur d'opacité (0-1) en pourcentage (0-100)
 * @param {number|string} opacity - L'opacité
 * @returns {number} - L'opacité en pourcentage
 */
const getOpacityPercentage = (opacity) => {
    if (!opacity) return 100;
    const num = parseFloat(opacity);
    return isNaN(num) ? 100 : Math.round(num * 100);
};

/**
 * Détermine l'intensité de l'ombre (0-5) à partir du box-shadow
 * @param {string} boxShadow - La valeur CSS box-shadow
 * @returns {number} - L'intensité (0-5)
 */
const getShadowIntensity = (boxShadow) => {
    if (!boxShadow || boxShadow === 'none') return 0;

    // Détecte l'intensité en fonction de la valeur de l'ombre
    if (boxShadow.includes('25px 50px')) return 5;
    if (boxShadow.includes('20px 25px')) return 4;
    if (boxShadow.includes('10px 15px')) return 3;
    if (boxShadow.includes('4px 6px')) return 2;
    if (boxShadow.includes('1px 3px')) return 1;

    return 0;
};

/**
 * Récupère les propriétés de couleur du nœud
 * @param {Object} node - Le nœud React Flow
 * @returns {Object} - Les propriétés de couleur
 */
const getColorProperties = (node) => {
    const nodeType = node?.type;
    const style = { ...(node?.style || {}), ...(node?.data?.styles || {}) };

    let backgroundColor = '#FFFFFF';
    let textColor = '#000000';
    let borderColor = '#000000';

    // Récupère la couleur de fond selon le type de nœud
    if (nodeType === 'buttonNode') {
        backgroundColor = style['--button-bg-color'] || style.backgroundColor || '#3b82f6';
        textColor = style['--button-text-color'] || style.color || '#FFFFFF';
        // La bordure du bouton est appliquée sur l'élément <button> via une variable CSS
        borderColor = style['--button-border-color'] || style.borderColor || backgroundColor || '#3b82f6';
    } else {
        backgroundColor = style.backgroundColor || '#FFFFFF';
        textColor = style.color || '#000000';
        borderColor = style.borderColor || '#000000';
    }

    return {
        backgroundColor,
        textColor,
        borderColor
    };
};

/**
 * Récupère les propriétés de position du nœud
 * @param {Object} node - Le nœud React Flow
 * @returns {Object} - Les propriétés de position
 */
const getPositionProperties = (node) => {
    const position = node?.position || { x: 0, y: 0 };
    const style = { ...(node?.style || {}), ...(node?.data?.styles || {}) };

    // Récupère la rotation
    const transform = style.transform || '';
    let rotation = 0;

    const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    if (rotateMatch) {
        rotation = parseFloat(rotateMatch[1]);
    }

    return {
        x: Math.round(position.x),
        y: Math.round(position.y),
        rotation
    };
};

/**
 * Récupère les propriétés de layout (dimensions et alignement)
 * @param {Object} node - Le nœud React Flow
 * @returns {Object} - Les propriétés de layout
 */
const getLayoutProperties = (node) => {
    const style = { ...(node?.style || {}), ...(node?.data?.styles || {}) };

    return {
        width: style.width || 'auto',
        height: style.height || 'auto',
        widthNumeric: extractNumericValue(style.width),
        heightNumeric: extractNumericValue(style.height),
        textAlign: style.textAlign || 'left',
        display: style.display || 'block'
    };
};

/**
 * Récupère les propriétés d'apparence (opacité, border-radius, etc.)
 * @param {Object} node - Le nœud React Flow
 * @returns {Object} - Les propriétés d'apparence
 */
const getAppearanceProperties = (node) => {
    const style = { ...(node?.style || {}), ...(node?.data?.styles || {}) };

    // Pour les boutons, la largeur de bordure est gérée via une variable CSS
    let borderWidthValue = style.borderWidth;
    if (node?.type === 'buttonNode') {
        borderWidthValue = style['--button-border-width'] || style.borderWidth || '1px';
    }

    // Pour les boutons, l'arrondi est aussi géré via une variable CSS spécifique
    let borderRadiusValue = style.borderRadius;
    if (node?.type === 'buttonNode') {
        borderRadiusValue = style['--button-border-radius'] || style.borderRadius || '6px';
    }

    return {
        opacity: getOpacityPercentage(style.opacity),
        opacityRaw: parseFloat(style.opacity) || 1,
        borderRadius: extractNumericValue(borderRadiusValue),
        borderWidth: extractNumericValue(borderWidthValue),
        borderStyle: style.borderStyle || 'none',
        boxShadow: style.boxShadow || 'none',
        shadowIntensity: getShadowIntensity(style.boxShadow)
    };
};

/**
 * Récupère les propriétés de données du nœud
 * @param {Object} node - Le nœud React Flow
 * @returns {Object} - Les propriétés de données
 */
const getDataProperties = (node) => {
    const data = node?.data || {};

    return {
        label: data.label || '',
        content: data.content || '',
        customData: { ...data }
    };
};

/**
 * Fonction principale : Récupère TOUTES les propriétés d'un nœud
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Objet contenant toutes les propriétés, ou null si pas de nœud
 */
export function getNodeProperties(node) {
    if (!node) {
        console.warn('getNodeProperties: Aucun nœud fourni');
        return null;
    }

    return {
        // Informations de base
        id: node.id,
        type: node.type,

        // Couleurs (ColorPart)
        colors: getColorProperties(node),

        // Position et rotation (PositionPart)
        position: getPositionProperties(node),

        // Dimensions et alignement (LayoutPart)
        layout: getLayoutProperties(node),

        // Apparence visuelle (AppearancePart)
        appearance: getAppearanceProperties(node),

        // Données du nœud (InformationPart)
        data: getDataProperties(node),

        // Style brut complet (pour cas spécifiques)
        rawStyle: { ...(node.style || {}), ...(node.data?.styles || {}) },

        // Position brute
        rawPosition: { ...(node.position || { x: 0, y: 0 }) }
    };
}

/**
 * Récupère uniquement les propriétés de couleur
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Les propriétés de couleur
 */
export function getNodeColors(node) {
    if (!node) return null;
    return getColorProperties(node);
}

/**
 * Récupère uniquement les propriétés de position
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Les propriétés de position
 */
export function getNodePosition(node) {
    if (!node) return null;
    return getPositionProperties(node);
}

/**
 * Récupère uniquement les propriétés de layout
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Les propriétés de layout
 */
export function getNodeLayout(node) {
    if (!node) return null;
    return getLayoutProperties(node);
}

/**
 * Récupère uniquement les propriétés d'apparence
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Les propriétés d'apparence
 */
export function getNodeAppearance(node) {
    if (!node) return null;
    return getAppearanceProperties(node);
}

/**
 * Récupère uniquement les données du nœud
 * @param {Object} node - Le nœud React Flow
 * @returns {Object|null} - Les données du nœud
 */
export function getNodeData(node) {
    if (!node) return null;
    return getDataProperties(node);
}

/**
 * Formatte les propriétés pour l'affichage ou le debug
 * @param {Object} properties - Les propriétés du nœud
 * @returns {string} - Chaîne formatée
 */
export function formatPropertiesForDisplay(properties) {
    if (!properties) return 'Aucune propriété disponible';

    return `
Nœud: ${properties.type} (${properties.id})

🎨 COULEURS:
  - Fond: ${properties.colors.backgroundColor}
  - Texte: ${properties.colors.textColor}
  - Bordure: ${properties.colors.borderColor}

📍 POSITION:
  - X: ${properties.position.x}px
  - Y: ${properties.position.y}px
  - Rotation: ${properties.position.rotation}°

📐 LAYOUT:
  - Largeur: ${properties.layout.width}
  - Hauteur: ${properties.layout.height}
  - Alignement: ${properties.layout.textAlign}

✨ APPARENCE:
  - Opacité: ${properties.appearance.opacity}%
  - Border Radius: ${properties.appearance.borderRadius}px
  - Border Width: ${properties.appearance.borderWidth}px
  - Ombre: Intensité ${properties.appearance.shadowIntensity}/5

📝 DONNÉES:
  - Label: ${properties.data.label || '(vide)'}
  - Content: ${properties.data.content || '(vide)'}
    `.trim();
}

// Export des fonctions
const nodePropertyUtils = {
    getNodeProperties,
    getNodeColors,
    getNodePosition,
    getNodeLayout,
    getNodeAppearance,
    getNodeData,
    formatPropertiesForDisplay
};

export default nodePropertyUtils;

