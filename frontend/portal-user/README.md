# NoCode FrontEnd

Frontend React (Create React App) du projet NoCode Builder.

## Prérequis
- Node.js 18+
- npm 9+
- Backend FastAPI lancé sur `http://localhost:8000`

## Démarrage après clone

### 1) Cloner et entrer dans le dossier

```bash
git clone <URL_DU_REPO>
cd noCode-frontEnd
```

### 2) Installer les dépendances

```bash
npm install
```

### 3) Vérifier la configuration API

Le frontend utilise la variable `REACT_APP_API_BASE_URL`.

Exemple de valeur locale:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

Le fichier `.env` du projet contient déjà cette valeur par défaut.

### 4) Lancer le frontend

```bash
npm start
```

Application disponible sur:
- `http://localhost:3000`

## Vérification de bout en bout (avec backend)

1. Démarrer le backend FastAPI sur le port 8000.
2. Démarrer ce frontend sur le port 3000.
3. Ouvrir `http://localhost:3000` et vérifier que les écrans qui chargent des données ne retournent pas d'erreur réseau.

## Scripts utiles

```bash
npm start      # mode développement
npm run build  # build production
npm test       # tests
```
