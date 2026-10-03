# Guide d'utilisation - getPropriete.js

## 📚 Vue d'ensemble

Le fichier `getPropriete.js` fournit des fonctions utilitaires pour récupérer toutes les propriétés actuelles d'un nœud sélectionné dans votre application no-code.

## 🎯 Fonctions disponibles

### 1. **getNodeProperties(node)** - Fonction principale
Récupère **TOUTES** les propriétés d'un nœud en une seule fois.

```javascript
import { getNodeProperties } from './selection';

const node = getSelectedNode();
const properties = getNodeProperties(node);

console.log(properties);
// {
//   id: "node-1",
//   type: "buttonNode",
//   colors: { backgroundColor, textColor, borderColor },
//   position: { x, y, rotation },
//   layout: { width, height, textAlign },
//   appearance: { opacity, borderRadius, borderWidth, shadowIntensity },
//   data: { label, content },
//   rawStyle: { ... },
//   rawPosition: { x, y }
// }
```

### 2. **Fonctions spécialisées**

#### getNodeColors(node)
Récupère uniquement les couleurs :
```javascript
import { getNodeColors } from './selection';

const colors = getNodeColors(node);
// {
//   backgroundColor: '#3b82f6',
//   textColor: '#FFFFFF',
//   borderColor: '#000000'
// }
```

#### getNodePosition(node)
Récupère position et rotation :
```javascript
import { getNodePosition } from './selection';

const position = getNodePosition(node);
// {
//   x: 100,
//   y: 200,
//   rotation: 45
// }
```

#### getNodeLayout(node)
Récupère dimensions et alignement :
```javascript
import { getNodeLayout } from './selection';

const layout = getNodeLayout(node);
// {
//   width: '200px',
//   height: '100px',
//   widthNumeric: 200,
//   heightNumeric: 100,
//   textAlign: 'center',
//   display: 'block'
// }
```

#### getNodeAppearance(node)
Récupère les effets visuels :
```javascript
import { getNodeAppearance } from './selection';

const appearance = getNodeAppearance(node);
// {
//   opacity: 80,           // En pourcentage (0-100)
//   opacityRaw: 0.8,       // Valeur brute (0-1)
//   borderRadius: 8,
//   borderWidth: 2,
//   borderStyle: 'solid',
//   boxShadow: '0 4px 6px...',
//   shadowIntensity: 2     // Niveau 0-5
// }
```

#### getNodeData(node)
Récupère les données du nœud :
```javascript
import { getNodeData } from './selection';

const data = getNodeData(node);
// {
//   label: 'Mon Bouton',
//   content: 'Texte du bouton',
//   customData: { ... }    // Toutes les données
// }
```

### 3. **formatPropertiesForDisplay(properties)**
Formatte les propriétés pour l'affichage console :
```javascript
import { getNodeProperties, formatPropertiesForDisplay } from './selection';

const properties = getNodeProperties(node);
console.log(formatPropertiesForDisplay(properties));
```

**Résultat :**
```
Nœud: buttonNode (node-1)

🎨 COULEURS:
  - Fond: #3b82f6
  - Texte: #FFFFFF
  - Bordure: #000000

📍 POSITION:
  - X: 100px
  - Y: 200px
  - Rotation: 45°

📐 LAYOUT:
  - Largeur: 200px
  - Hauteur: 100px
  - Alignement: center

✨ APPARENCE:
  - Opacité: 80%
  - Border Radius: 8px
  - Border Width: 2px
  - Ombre: Intensité 2/5

📝 DONNÉES:
  - Label: Mon Bouton
  - Content: Cliquez ici
```

## 💡 Cas d'usage pratiques

### 1. Débugger un nœud
```javascript
import { useSelectedNode, getNodeProperties, formatPropertiesForDisplay } from './selection';

function DebugComponent() {
  const { getSelectedNode } = useSelectedNode();
  
  const handleDebug = () => {
    const node = getSelectedNode();
    const props = getNodeProperties(node);
    console.log(formatPropertiesForDisplay(props));
  };
  
  return <button onClick={handleDebug}>Debug Node</button>;
}
```

### 2. Copier les styles d'un nœud
```javascript
import { getNodeProperties } from './selection';

function copyNodeStyles(sourceNode) {
  const properties = getNodeProperties(sourceNode);
  
  // Récupérer uniquement les styles CSS
  return {
    backgroundColor: properties.colors.backgroundColor,
    color: properties.colors.textColor,
    borderRadius: `${properties.appearance.borderRadius}px`,
    opacity: properties.appearance.opacityRaw,
    // ... etc
  };
}
```

### 3. Sauvegarder l'état d'un nœud
```javascript
import { getNodeProperties } from './selection';

function saveNodeState(node) {
  const properties = getNodeProperties(node);
  
  localStorage.setItem(
    `node-${node.id}`,
    JSON.stringify(properties)
  );
}
```

### 4. Comparer deux nœuds
```javascript
import { getNodeProperties } from './selection';

function compareNodes(node1, node2) {
  const props1 = getNodeProperties(node1);
  const props2 = getNodeProperties(node2);
  
  return {
    sameColors: JSON.stringify(props1.colors) === JSON.stringify(props2.colors),
    samePosition: props1.position.x === props2.position.x && 
                  props1.position.y === props2.position.y,
    sameSize: props1.layout.width === props2.layout.width &&
              props1.layout.height === props2.layout.height
  };
}
```

### 5. Créer un panneau d'informations
```javascript
import { useSelectedNode, getNodeProperties } from './selection';

function NodeInfoPanel() {
  const { getSelectedNode, selectedNodeId } = useSelectedNode();
  
  if (!selectedNodeId) return <div>Aucun nœud sélectionné</div>;
  
  const node = getSelectedNode();
  const props = getNodeProperties(node);
  
  return (
    <div>
      <h3>{props.type}</h3>
      <p>Position: ({props.position.x}, {props.position.y})</p>
      <p>Couleur de fond: {props.colors.backgroundColor}</p>
      <p>Opacité: {props.appearance.opacity}%</p>
    </div>
  );
}
```

## 🔧 Correspondance avec la Sidebar

Chaque fonction correspond à une section de la sidebar de modifications :

| Fonction | Section Sidebar | Propriétés récupérées |
|----------|----------------|----------------------|
| `getNodeColors()` | **ColorPart** | backgroundColor, textColor, borderColor |
| `getNodePosition()` | **PositionPart** | x, y, rotation |
| `getNodeLayout()` | **LayoutPart** | width, height, textAlign |
| `getNodeAppearance()` | **AppearancePart** | opacity, borderRadius, borderWidth, boxShadow |
| `getNodeData()` | **InformationPart** | label, content, customData |

## ⚠️ Notes importantes

1. **Toujours vérifier si le nœud existe** :
```javascript
const node = getSelectedNode();
if (node) {
  const properties = getNodeProperties(node);
  // ...
}
```

2. **Les fonctions retournent null si pas de nœud** :
```javascript
const colors = getNodeColors(null); // null
```

3. **Les valeurs numériques sont extraites** :
```javascript
// Si width = "200px"
layout.width = "200px"        // Chaîne originale
layout.widthNumeric = 200     // Valeur numérique
```

4. **Adaptation selon le type de nœud** :
```javascript
// ButtonNode : utilise les variables CSS
colors.backgroundColor = style['--button-bg-color']

// TextNode : utilise les propriétés standard
colors.backgroundColor = style.backgroundColor
```

## 🚀 Bonnes pratiques

1. **Utiliser la fonction appropriée** : Si vous avez besoin uniquement des couleurs, utilisez `getNodeColors()` plutôt que `getNodeProperties()`.

2. **Mémoriser les résultats** avec useMemo si utilisé dans un composant React :
```javascript
const properties = useMemo(() => 
  getNodeProperties(getSelectedNode()), 
  [selectedNodeId]
);
```

3. **Gérer les cas d'erreur** :
```javascript
try {
  const properties = getNodeProperties(node);
  // ...
} catch (error) {
  console.error('Erreur lors de la récupération des propriétés:', error);
}
```

## 📝 Exemple complet

```javascript
import React from 'react';
import { useSelectedNode, getNodeProperties } from './selection';

function NodePropertiesPanel() {
  const { getSelectedNode, selectedNodeId } = useSelectedNode();
  
  if (!selectedNodeId) {
    return <div>Sélectionnez un élément</div>;
  }
  
  const node = getSelectedNode();
  const properties = getNodeProperties(node);
  
  if (!properties) {
    return <div>Erreur lors du chargement des propriétés</div>;
  }
  
  return (
    <div className="properties-panel">
      <h2>Propriétés du nœud</h2>
      
      <section>
        <h3>🎨 Couleurs</h3>
        <div>Fond: <span style={{ backgroundColor: properties.colors.backgroundColor }}>
          {properties.colors.backgroundColor}
        </span></div>
        <div>Texte: {properties.colors.textColor}</div>
      </section>
      
      <section>
        <h3>📍 Position</h3>
        <div>X: {properties.position.x}px</div>
        <div>Y: {properties.position.y}px</div>
        <div>Rotation: {properties.position.rotation}°</div>
      </section>
      
      <section>
        <h3>📐 Dimensions</h3>
        <div>Largeur: {properties.layout.width}</div>
        <div>Hauteur: {properties.layout.height}</div>
      </section>
      
      <section>
        <h3>✨ Apparence</h3>
        <div>Opacité: {properties.appearance.opacity}%</div>
        <div>Border Radius: {properties.appearance.borderRadius}px</div>
        <div>Ombre: Niveau {properties.appearance.shadowIntensity}/5</div>
      </section>
    </div>
  );
}

export default NodePropertiesPanel;
```

---

✅ Votre fichier `getPropriete.js` est maintenant prêt à être utilisé dans toute votre application !

