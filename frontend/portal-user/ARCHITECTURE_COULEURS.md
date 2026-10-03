ok c'est bon le backend inexistant etait preeu tu a a vu les couleur utiliser le style et le nom quo'n a donner tu veroa EnoC ecrit qu'elque part c'est le nom de notre apli de nos code est ce que c'est bon la# Architecture de l'application des couleurs

## 🎨 Fichiers clés de l'application des couleurs

### 1. **ColorPart.jsx** - Interface utilisateur
📁 `src/components/canvas/sideBars/sideBarModificationsParts/ColorPart.jsx`

**Rôle** : Affiche l'interface de sélection des couleurs dans la sidebar
- Onglets pour 3 types de couleurs : Fond, Bordure, Texte
- Sélecteur de couleur visuel
- Input hexadécimal
- Palette de couleurs prédéfinies

### 2. **useNodeBackgroundColor.js** - Logic métier couleur de fond
📁 `src/selection/useNodeBackgroundColor.js`

**Rôle** : Hook qui gère la couleur de fond des nœuds
- **Fonction principale** : `applyBackgroundColor(color)` (ligne 126-165)
- S'adapte au type de nœud (ButtonNode vs TextNode)
- Calcule automatiquement la couleur du texte pour garantir la lisibilité

**Comment ça fonctionne** :
```javascript
// Pour un ButtonNode
updateSelectedNodeStyle({
    '--button-bg-color': color,
    '--button-text-color': getContrastColor(color),
});

// Pour un TextNode
updateSelectedNodeStyle({
    backgroundColor: color,
    color: getContrastColor(color),
});
```

### 3. **useNodeBorderColor.js** - Logic métier couleur de bordure
📁 `src/selection/useNodeBorderColor.js`

**Rôle** : Hook qui gère la couleur de bordure
- **Fonction principale** : `applyBorderColor(color)` (ligne 66-90)

### 4. **useNodeTextColor.js** - Logic métier couleur de texte
📁 `src/selection/useNodeTextColor.js`

**Rôle** : Hook qui gère la couleur du texte
- **Fonction principale** : `applyTextColor(color)` (ligne 66-90)

### 5. **SelectionProvider.jsx** - Connexion avec React Flow
📁 `src/selection/SelectionProvider.jsx`

**Rôle** : Fournit les fonctions pour modifier les nœuds React Flow
- **Fonction clé** : `updateSelectedNodeStyle(styleUpdates)` (ligne 54-58)
- Utilise `reactFlowInstance.setNodes()` pour mettre à jour le DOM

## 🔄 Flux d'application des couleurs

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. L'utilisateur clique sur une couleur dans ColorPart.jsx     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. handleColorPicker() appelle applyBackgroundColor(color)     │
│    (dans useNodeBackgroundColor.js)                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. applyBackgroundColor() détermine le type de nœud            │
│    et prépare les styles appropriés                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Appelle updateSelectedNodeStyle(styleUpdates)               │
│    (fourni par SelectionProvider.jsx)                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. updateSelectedNodeStyle() utilise React Flow                │
│    pour mettre à jour le nœud dans le canvas                   │
│    → reactFlowInstance.setNodes(...)                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Fonction getContrastColor()

**Objectif** : Calculer automatiquement si le texte doit être noir ou blanc

**Localisation** : Ligne 36-42 dans useNodeBackgroundColor.js

**Algorithme** :
1. Convertit la couleur hex en RGB
2. Calcule la luminosité selon la formule : `(R * 299 + G * 587 + B * 114) / 1000`
3. Si luminosité > 128 → **texte noir** (#000000)
4. Si luminosité ≤ 128 → **texte blanc** (#FFFFFF)

**Exemple** :
- Fond bleu clair (#3b82f6, luminosité ~100) → Texte blanc ✓
- Fond jaune (#f59e0b, luminosité ~150) → Texte noir ✓

## ✅ Corrections apportées

### Problème initial
❌ Boucle infinie causée par :
- `useCallback` appelé dans une fonction normale (SelectionProvider.jsx)
- `getSelectedNode` dans les dépendances des `useEffect` créait des re-renders infinis

### Solution appliquée
✅ Utilisation de `React.useRef()` pour stocker `getSelectedNode`
✅ Suppression de `getSelectedNode` des dépendances des `useEffect`
✅ Remplacement des fonctions placeholder par des fonctions stables définies en dehors du composant

## 📝 Code clé dans SelectionProvider.jsx

```javascript
// Avant (causait des boucles)
getSelectedNode: useCallback(() => {
    console.warn('getSelectedNode non disponible');
    return null;
}, [])

// Après (stable)
const placeholderGetSelectedNode = () => null;
// ...
getSelectedNode: placeholderGetSelectedNode
```

## 🚀 Résultat

Les modifications de couleur s'appliquent maintenant correctement sans erreur de boucle infinie !

