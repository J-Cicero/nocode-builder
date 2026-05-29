# Endpoint /config - Auto-Configuration du Frontend

## 📋 Vue d'ensemble

Le système de génération crée maintenant un **endpoint `/config`** dans le backend généré qui permet au frontend de **découvrir automatiquement** l'URL du backend sans configuration manuelle.

## 🏗️ Architecture

### Backend Généré
```python
@app.get("/config")
async def get_config():
    """Retourne la configuration de l'application (utilisée par le frontend)"""
    return {
        "api_url": "{{BASE_URL}}",
        "app_name": "Application Générée",
        "version": "1.0.0"
    }
```

### Frontend Généré

#### 1. **ApiContext** (`src/context/ApiContext.jsx`)
- Contexte React centralisé pour l'instance Axios
- Charge la config au démarrage via GET `/config`
- Fallback automatique si `/config` échoue (utilise `VITE_API_URL`)

```javascript
const { api, loading, error } = useApi();
```

#### 2. **main.jsx** - ApiProvider wrapper
```javascript
<ApiProvider>
  <App />
</ApiProvider>
```

#### 3. **App.jsx** - Loading state
Affiche "Chargement de la configuration..." pendant que ApiContext charge la config.

#### 4. **Pages React** - Hook useApi()
```javascript
const { api } = useApi();
await api.post('/users/', data);
```

## 🚀 Flux de démarrage

```
1. Frontend démarre (main.jsx)
   ↓
2. ApiProvider se monte
   ↓
3. useEffect() → GET /config
   ↓
4. (Succès) api_url retourné → axios créé avec cette URL
   (Erreur) Fallback sur VITE_API_URL → axios créé avec fallback
   ↓
5. App.jsx reçoit l'instance API
   ↓
6. Pages peuvent utiliser useApi()
```

## 🔧 Déploiement

### Backend (Railway/Docker)
```bash
# Rien à faire - /config sera disponible automatiquement
# L'URL sera correctement définie par l'environnement de déploiement
```

### Frontend (Vercel/Netlify)
```bash
# .env.local (optional)
VITE_API_URL=https://mon-backend-railway.app/api

# Si VITE_API_URL n'est pas défini:
# Le frontend essaiera GET /config
# Puis utilisera http://localhost:8000/api comme dernier fallback
```

## 📝 Variables d'environnement

### Backend (.env)
```
APP_NAME=Application Générée
DATABASE_URL=postgresql://...
SECRET_KEY=votre-clé
ACCESS_TOKEN_EXPIRE_HOURS=24
# VITE_API_URL n'est pas utilisé ici
```

### Frontend (.env.example)
```
VITE_API_URL=http://localhost:8000/api
```

## ✅ Avantages

- ✅ **Aucune configuration manuelle** - Découverte automatique
- ✅ **Résilient** - Fallback si /config échoue
- ✅ **Déploiement simple** - Backend et frontend indépendants
- ✅ **Multi-environnements** - Marche en dev, staging, prod
- ✅ **Centralisé** - Un seul point de vérité pour l'URL API

## 🔍 Debugging

### Le frontend affiche "Chargement de la configuration..."
→ ApiContext tente de charger /config

### Erreur dans la console: "Impossible de charger /config"
→ C'est normal! Le fallback s'active automatiquement

### Les requêtes API échouent (404)
→ Vérifier que l'URL du backend est correcte dans:
  1. `/config` response (vérifier Backend)
  2. `VITE_API_URL` (.env du frontend)
  3. Logs de la console du navigateur

## 📚 Exemple complet

### Créer une app
```bash
POST /api/generator/{project_id}
# Génère backend + frontend avec /config endpoint
```

### Déployer le backend
```bash
# Railway détecte le Dockerfile
# Déploie l'app
# URL: https://app-123.railway.app
```

### Déployer le frontend
```bash
# Vercel détecte package.json
# Déploie l'app
# Au démarrage: GET https://app-123.railway.app/config
# → Obtient: { "api_url": "https://app-123.railway.app/api", ... }
# → Toutes les requêtes utilisent cette URL
```

## ⚠️ Notes importantes

1. **CORS doit être activé** sur le backend pour `/config`
2. **L'endpoint /config n'est pas authentifié** (c'est voulu - config publique)
3. **Le `{BASE_URL}` placeholder** doit être remplacé par le vrai serveur lors du déploiement
4. **Si le backend change d'URL**, le frontend redémarage se reconnectera automatiquement
