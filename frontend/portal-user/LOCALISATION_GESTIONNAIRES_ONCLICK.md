# 📍 LOCALISATION - Gestionnaires d'événements des boutons de personnalisation

## 🎯 Où sont implémentés les gestionnaires onClick ?

Tous les gestionnaires d'événements des boutons de la sidebar de modifications sont définis dans les fichiers de composants de chaque section.

---

## 📁 **1. LayoutPart.jsx** - Dimensions et Alignement

### 🔹 Gestionnaire pour les dimensions
**Localisation** : Lignes 23-36

```javascript
const handleDimensionChange = useCallback((dimension, value) => {
  setDimensions(prev => ({ ...prev, [dimension]: value }));

  const numValue = parseFloat(value);
  if (!isNaN(numValue) && numValue > 0) {
    updateSelectedNodeStyle({
      [dimension]: `${numValue}px`
    });
  } else if (value === '') {
    updateSelectedNodeStyle({
      [dimension]: 'auto'
    });
  }
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Input largeur : `onChange={(e) => handleDimensionChange('width', e.target.value)}`
- Input hauteur : `onChange={(e) => handleDimensionChange('height', e.target.value)}`

### 🔹 Gestionnaire pour l'alignement du texte
**Localisation** : Lignes 38-43

```javascript
const handleAlignmentChange = useCallback((newAlignment) => {
  setAlignment(newAlignment);
  updateSelectedNodeStyle({
    textAlign: newAlignment
  });
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Bouton gauche : `onClick={() => handleAlignmentChange('left')}`
- Bouton centre : `onClick={() => handleAlignmentChange('center')}`
- Bouton droite : `onClick={() => handleAlignmentChange('right')}`

### 🔹 Gestionnaire pour les tailles prédéfinies
**Localisation** : Lignes 45-70

```javascript
const applyPresetSize = useCallback((preset) => {
  let newDimensions = {};

  switch (preset) {
    case 'auto':
      newDimensions = { width: 'auto', height: 'auto' };
      setDimensions({ width: '', height: '' });
      break;
    case 'fullWidth':
      newDimensions = { width: '100%' };
      setDimensions(prev => ({ ...prev, width: '100' }));
      break;
    case 'button':
      newDimensions = { width: '120px', height: '40px' };
      setDimensions({ width: '120', height: '40' });
      break;
    case 'card':
      newDimensions = { width: '300px', height: '200px' };
      setDimensions({ width: '300', height: '200' });
      break;
    default:
      return;
  }

  updateSelectedNodeStyle(newDimensions);
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Bouton Auto : `onClick={() => applyPresetSize('auto')}`
- Bouton Largeur 100% : `onClick={() => applyPresetSize('fullWidth')}`
- Bouton Bouton (120×40) : `onClick={() => applyPresetSize('button')}`
- Bouton Carte (300×200) : `onClick={() => applyPresetSize('card')}`

### 🔹 Gestionnaire pour l'espacement rapide
**Utilisation directe** :
```javascript
onClick={() => updateSelectedNodeStyle({ padding: '8px' })}
onClick={() => updateSelectedNodeStyle({ padding: '16px' })}
onClick={() => updateSelectedNodeStyle({ margin: '8px' })}
onClick={() => updateSelectedNodeStyle({ margin: '16px' })}
```

---

## 📁 **2. AppearancePart.jsx** - Apparence et Effets

### 🔹 Gestionnaire pour l'opacité
**Localisation** : Lignes 24-29

```javascript
const handleOpacityChange = useCallback((value) => {
  setOpacity(value);
  updateSelectedNodeStyle({
    opacity: value / 100
  });
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Slider opacité : `onChange={(e) => handleOpacityChange(parseInt(e.target.value))}`

### 🔹 Gestionnaire pour le border radius
**Localisation** : Lignes 31-36

```javascript
const handleBorderRadiusChange = useCallback((value) => {
  setBorderRadius(value);
  updateSelectedNodeStyle({
    borderRadius: `${value}px`
  });
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Slider arrondi : `onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}`

### 🔹 Gestionnaire pour la largeur de bordure
**Localisation** : Lignes 38-46

```javascript
const handleBorderWidthChange = useCallback((value) => {
  setBorderWidth(value);
  updateSelectedNodeStyle({
    borderWidth: `${value}px`,
    borderStyle: value > 0 ? 'solid' : 'none',
    borderColor: value > 0 ? '#d1d5db' : 'transparent'
  });
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Slider bordure : `onChange={(e) => handleBorderWidthChange(parseInt(e.target.value))}`

### 🔹 Gestionnaire pour les ombres
**Localisation** : Lignes 48-66

```javascript
const handleShadowChange = useCallback((intensity) => {
  setShadowIntensity(intensity);

  let boxShadow = 'none';
  if (intensity > 0) {
    const shadows = {
      1: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      2: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      3: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      4: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      5: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      };
    boxShadow = shadows[intensity] || shadows[3];
  }

  updateSelectedNodeStyle({
    boxShadow
  });
}, [updateSelectedNodeStyle]);
```

**Utilisation** :
- Slider ombre : `onChange={(e) => handleShadowChange(parseInt(e.target.value))}`

### 🔹 Gestionnaire pour les effets prédéfinis
**Localisation** : Lignes 68-100

```javascript
const applyPresetEffect = useCallback((effectType) => {
  switch (effectType) {
    case 'card':
      handleBorderRadiusChange(8);
      handleShadowChange(2);
      break;
    case 'button':
      handleBorderRadiusChange(6);
      handleShadowChange(1);
      break;
    case 'modal':
      handleBorderRadiusChange(12);
      handleShadowChange(4);
      break;
    case 'flat':
      handleBorderRadiusChange(0);
      handleShadowChange(0);
      handleBorderWidthChange(1);
      break;
    case 'pill':
      handleBorderRadiusChange(50);
      handleShadowChange(1);
      break;
    case 'glass':
      handleOpacityChange(80);
      handleBorderRadiusChange(12);
      handleShadowChange(3);
      break;
  }
}, [handleBorderRadiusChange, handleShadowChange, handleBorderWidthChange, handleOpacityChange]);
```

**Utilisation** :
- Bouton Carte : `onClick={() => applyPresetEffect('card')}`
- Bouton Bouton : `onClick={() => applyPresetEffect('button')}`
- Bouton Modal : `onClick={() => applyPresetEffect('modal')}`
- Bouton Plat : `onClick={() => applyPresetEffect('flat')}`
- Bouton Pilule : `onClick={() => applyPresetEffect('pill')}`
- Bouton Verre : `onClick={() => applyPresetEffect('glass')}`

---

## 📁 **3. ColorPart.jsx** - Couleurs

### 🔹 Gestionnaire pour les couleurs prédéfinies
**Localisation** : Ligne 52

```javascript
const handlePresetColor = (color) => {
  currentHook.handleColorPicker(color);
};
```

**Utilisation** :
- Chaque bouton de couleur : `onClick={() => handlePresetColor(color)}`

### 🔹 Gestionnaire pour le sélecteur de couleur
**Utilisation directe du hook** :
```javascript
onChange={(e) => currentHook.handleColorPicker(e.target.value)}
```

### 🔹 Gestionnaire pour l'input hexadécimal
**Utilisation directe du hook** :
```javascript
onChange={(e) => currentHook.handleInputChange(e.target.value)}
```

---

## 📁 **4. PositionPart.jsx** - Position et Rotation

### 🔹 Gestionnaire pour la position
**Localisation** : Lignes 63-69

```javascript
const handlePositionChange = (axis, value) => {
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    setPosition({ [axis]: numValue });
    setDisplayPosition(prev => ({ ...prev, [axis]: numValue }));
  }
};
```

**Utilisation** :
- Input X : `onChange={(e) => handlePositionChange('x', e.target.value)}`
- Input Y : `onChange={(e) => handlePositionChange('y', e.target.value)}`

### 🔹 Gestionnaire pour la rotation
**Localisation** : Lignes 71-77

```javascript
const handleRotationChange = (value) => {
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    setRotation(numValue);
    setDisplayRotation(numValue);
  }
};
```

**Utilisation** :
- Input rotation : `onChange={(e) => handleRotationChange(e.target.value)}`
- Slider rotation : `onChange={(e) => handleRotationChange(e.target.value)}`

### 🔹 Gestionnaires pour les boutons de rotation
**Utilisation des fonctions du hook** :
```javascript
onClick={() => addRotation(-45)}       // Rotation -45°
onClick={() => addRotation(45)}        // Rotation +45°
onClick={flipHorizontal}               // Retourner horizontalement
onClick={flipVertical}                 // Retourner verticalement
onClick={resetRotation}                // Réinitialiser la rotation
```

### 🔹 Gestionnaires pour les positions prédéfinies
**Utilisation directe** :
```javascript
onClick={() => setPosition({ x: 0, y: 0 })}       // Origine
onClick={() => setPosition({ x: 100, y: 100 })}   // (100, 100)
onClick={() => setPosition({ x: 200, y: 200 })}   // (200, 200)
```

---

## 📁 **5. InformationPart.jsx** - Informations et Suppression

### 🔹 Gestionnaire pour supprimer le nœud
**Localisation** : Lignes 34-38

```javascript
const handleDelete = () => {
  if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
    deleteSelectedNode();
  }
};
```

**Utilisation** :
```javascript
onClick={handleDelete}  // Bouton de suppression
```

---

## 🔄 Flux d'exécution général

```
1. Utilisateur clique sur un bouton
   ↓
2. onClick déclenche le gestionnaire (handleXXX)
   ↓
3. Le gestionnaire met à jour l'état local (setState)
   ↓
4. Le gestionnaire appelle updateSelectedNodeStyle() ou setPosition()
   ↓
5. updateSelectedNodeStyle() provient de SelectionProvider.jsx
   ↓
6. SelectionProvider appelle reactFlowInstance.setNodes()
   ↓
7. React Flow met à jour le nœud dans le canvas
   ↓
8. ✨ Le changement est visible immédiatement !
```

---

## 📊 Résumé des fichiers

| Fichier | Gestionnaires principaux | Ligne(s) |
|---------|-------------------------|----------|
| **LayoutPart.jsx** | handleDimensionChange, handleAlignmentChange, applyPresetSize | 23-70 |
| **AppearancePart.jsx** | handleOpacityChange, handleBorderRadiusChange, handleShadowChange, applyPresetEffect | 24-100 |
| **ColorPart.jsx** | handlePresetColor, currentHook.handleColorPicker | 52 |
| **PositionPart.jsx** | handlePositionChange, handleRotationChange | 63-77 |
| **InformationPart.jsx** | handleDelete | 34-38 |

---

## 🔑 Point clé : updateSelectedNodeStyle()

**Tous les gestionnaires utilisent** `updateSelectedNodeStyle()` qui provient de :
```javascript
const { updateSelectedNodeStyle } = useSelectedNode();
```

Cette fonction est définie dans **SelectionProvider.jsx** (ligne 54-58) et utilise React Flow pour mettre à jour le nœud :

```javascript
const updateSelectedNodeStyle = useCallback((styleUpdates) => {
  if (!baseSelection.selectedNodeId) return;
  updateNodeStyle(baseSelection.selectedNodeId, styleUpdates);
}, [baseSelection.selectedNodeId, updateNodeStyle]);
```

---

✅ **Tous les gestionnaires d'événements sont maintenant localisés !**

