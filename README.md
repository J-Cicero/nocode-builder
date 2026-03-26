# 🚀 NoCode Builder

**Une plateforme SaaS pour créer des applications sans coder.**

---

## 📋 Vue d'ensemble

NoCode Builder est une plateforme web qui permet à n'importe quel utilisateur de créer une application complète (base de données + interface + workflows automatisés) **sans écrire une seule ligne de code**.

### Objectifs du projet

✅ **Démocratiser la création d'applications** - Permettre aux non-développeurs de construire des apps complexes  
✅ **Modularité complète** - Architecture modulaire extensible et maintenable  
✅ **Flexibilité maximale** - Support de configurations JSON dynamiques  
✅ **Assistance IA intégrée** - Chatbot qui aide à concevoir les schémas de BD  
✅ **Automatisation des workflows** - Créer des workflows sans code (déclencheurs, conditions, actions)  

---

## 🏗️ Architecture générale

Le backend est construit avec **FastAPI**, **SQLAlchemy**, et **PostgreSQL**.  
Chaque fonctionnalité est organisée en modules indépendants avec une séparation claire des responsabilités.

### Pattern utilisé en tous les modules
```
router.py (endpoints HTTP)
    ↓
service.py (logique métier)
    ↓
repository.py (accès à la BD)
    ↓
models.py (entités SQLAlchemy)
    ↓
schema.py (Pydantic pour validation/serialization)
```

---

## 📦 Modules du backend

### 🔐 **AUTH** - Authentification & Gestion des utilisateurs
**Responsabilité:** Gérer l'inscription, connexion, rôles et abonnements.

**Entités principales:**
- `User` - Représente un utilisateur avec email, rôle (admin/user), plan (free/enterprise)

**Endpoints clés:**
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Renouveler le token JWT

**Points clés:**
- Mots de passe cryptés (NOT stocké en clair)
- JWT pour l'authentification
- Séparation `id` (interne) vs `tracking_id` (public)

---

### 📦 **PROJECTS** - Gestion des projets utilisateur
**Responsabilité:** CRUD des projets, gestion du cycle de vie (draft → published → archived).

**Entités principales:**
- `Project` - Un projet avec nom, description, statut, configuration

**Endpoints clés:**
- `GET /api/projects` - Lister mes projets
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/{id}` - Modifier un projet
- `DELETE /api/projects/{id}` - Supprimer un projet

**Points clés:**
- Chaque projet appartient à UN utilisateur (owner)
- Configuration stockée en JSONB (flexible)
- Slug unique pour les URLs publiques

---

### 🎨 **SCHEMA** - Modélisation de la base de données
**Responsabilité:** Définir la structure de la BD (tables, champs, relations).

**Entités principales:**
- `Schema` - Schéma global du projet
- `TableSchema` - Représente une table
- `Field` - Représente un champ (colonnes: name, type, required, unique, indexed)
- `Relation` - Liens entre tables (1:N, N:1, N:N)

**Endpoints clés:**
- `POST /api/schema/{project_id}` - Créer un schéma
- `POST /api/schema/tables` - Ajouter une table
- `POST /api/schema/fields` - Ajouter un champ
- `POST /api/schema/relations` - Créer une relation

**Points clés:**
- Types de champs supportés: text, number, boolean, date, datetime, email, url, json
- Configuration flexible par champ (contraintes, validations)
- Relations complètes (une table peut avoir plusieurs relations sources et cibles)

---

### 📊 **DATA_ENGINE** - Gestion des données et audit trail
**Responsabilité:** CRUD sur les données du projet + historique complet des modifications.

**Entités principales:**
- `DonneeProjet` - Entrée de données dans une table
- `HistoriqueDonnee` - Historique des modifications (versioning complet)

**Endpoints clés:**
- `POST /api/data/projects/{project_id}/{table_name}` - Créer une donnée
- `GET /api/data/projects/{project_id}/{table_name}` - Récupérer les données
- `PUT /api/data/projects/{project_id}/{table_name}/{id}` - Modifier
- `DELETE /api/data/projects/{project_id}/{table_name}/{id}` - Supprimer

**Points clés:**
- Audit trail complet (qui a modifié, quand, avant/après)
- Support JSON flexible pour le contenu
- Traçabilité des modifications avec `created_by` et `modifie_par`

---

### 🖼️ **INTERFACE_BUILDER** - Constructeur d'interface utilisateur
**Responsabilité:** Créer l'interface visuelle du projet généré.

**Entités principales:**
- `Interface` - L'interface globale (1 par projet)
- `Page` - Représente une page/route
- `Composant` - Composants UI (bouton, formulaire, liste, etc.) avec imbrication possible

**Endpoints clés:**
- `POST /api/interface/{project_id}/pages` - Ajouter une page
- `POST /api/interface/{project_id}/pages/{page_id}/composants` - Ajouter un composant
- `PUT /api/interface/.../composants/{id}` - Modifier un composant

**Points clés:**
- Support de l'imbrication (composant dans composant)
- Types de composants: conteneur, texte, bouton, formulaire, input, liste, carte, image, navigation
- Configuration JSON pour styles et props
- Positionnement (X, Y, largeur, hauteur)

---

### 🔄 **GENERATOR** - Génération de code/export
**Responsabilité:** Générer une application exportable basée sur le schéma + interface.

**Entités principales:**
- `Generation` - Un job de génération avec statut et URL de téléchargement

**Endpoints clés:**
- `POST /api/generator/{project_id}` - Lancer une génération
- `GET /api/generator/{project_id}/generations` - Lister les générations
- `GET /api/generator/{generation_id}/download` - Télécharger le ZIP

**Points clés:**
- Statuts: pending, en_cours, complété, échoué
- Historique complet de toutes les générations
- Support des paramètres de génération (config JSON)

---

### 🎬 **WORKFLOW_ENGINE** - Automatisation et workflows
**Responsabilité:** Créer et exécuter des workflows automatisés.

**Entités principales:**
- `Workflow` - Un workflow avec nom et description
- `EtapeWorkflow` - Étapes du workflow (déclencheur, condition, action)
- `ExecutionWorkflow` - Historique d'exécution

**Endpoints clés:**
- `POST /api/workflows/{project_id}` - Créer un workflow
- `POST /api/workflows/{id}/execute` - Exécuter manuellement
- `GET /api/workflows/{id}/executions` - Voir l'historique

**Points clés:**
- Types d'étapes: déclencheur (quand?), condition (si?), action (alors?)
- Statuts d'exécution: en_cours, réussi, échoué
- Tracking du temps d'exécution
- Gestion des erreurs avec messages

---

### 🤖 **AI** - Assistant IA intégré
**Responsabilité:** Chat conversationnel + génération automatique de schémas.

**Entités principales:**
- `Conversation` - Une conversation par projet (chatbot)
- `Message` - Historique des messages (user/assistant)

**Endpoints clés:**
- `POST /api/ai/chat/{project_id}` - Envoyer un message au chatbot
- `POST /api/ai/generate-schema/{project_id}` - Générer un schéma à partir d'une description
- `GET /api/ai/history/{project_id}` - Récupérer l'historique
- `DELETE /api/ai/history/{project_id}` - Effacer la conversation

**Points clés:**
- Utilise l'API Groq (llama-3.3-70b-versatile)
- Répond dans la langue de l'utilisateur (French/English)
- Peut analyser une description et générer automatiquement un schéma SQL
- Historique complet conservé

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| **Backend** | FastAPI (Python 3.10+) |
| **BDD** | PostgreSQL 14+ |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Migrations** | Alembic |
| **Validation** | Pydantic v2 |
| **Auth** | JWT (Bearer tokens) |
| **IA** | Groq API (llama-3.3-70b) |
| **Frontend** | (Next.js ou React) |

---

## 📂 Structure du projet

```
app/
├── core/
│   ├── database.py       (connexion SQLAlchemy)
│   ├── config.py         (variables d'environnement)
│   └── security.py       (JWT, hashing)
├── modules/
│   ├── auth/             (authentification)
│   ├── projects/         (gestion des projets)
│   ├── schema/           (modélisation de BD)
│   ├── schema_builder/   (wrapper du schema)
│   ├── data_engine/      (gestion des données)
│   ├── interface_builder/(construction d'UI)
│   ├── generator/        (génération de code)
│   ├── workflow_engine/  (automatisation)
│   └── ai/               (assistant IA)
├── main.py               (point d'entrée FastAPI)
└── __init__.py

alembic/
├── env.py                (config migrations)
└── versions/             (fichiers de migration)

requirements.txt          (dépendances Python)
```

---

## 🚀 Démarrage rapide

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- pip ou Poetry

### Installation

```bash
# 1. Cloner et naviguer
git clone <repo>
cd nocode-builder

# 2. Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # sur Linux/Mac
# ou sur Windows: venv\Scripts\activate

# 3. Installer dépendances
pip install -r requirements.txt

# 4. Configurer .env
cp .env.example .env
# Remplir: DATABASE_URL, GROQ_API_KEY, SECRET_KEY, etc.

# 5. Lancer les migrations
alembic upgrade head

# 6. Démarrer le serveur
uvicorn app.main:app --reload
```

L'API sera disponible sur `http://localhost:8000`  
SwaggerUI: `http://localhost:8000/docs`

---

## 📝 Notes de conception

### Principes clés

✅ **Async partout** - FastAPI + SQLAlchemy async pour performance  
✅ **UUID tracking_id** - Tous les IDs publics sont des UUIDs, les ID entiers restent internes  
✅ **Foreign keys sur tracking_id** - Les relations BD utilisent des UUIDs, pas des IDs  
✅ **Cascade delete** - Suppression en cascade quand un projet est supprimé  
✅ **Audit trail complet** - Historique des modifications tracé partout  
✅ **JSON flexible** - JSONB pour les configurations dynamiques  

### Sécurité

- Mots de passe hashés avec bcrypt
- JWT pour authentification stateless
- Validation Pydantic stricte
- CORS configuré pour localhost

---

## 📄 Licence

À définir...

---

**Dernière mise à jour:** 26 Mars 2026  
**Statut:** En développement
