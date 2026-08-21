#!/usr/bin/env python3
"""
=============================================================
  NoCode Builder — Script de réinitialisation & seed
=============================================================
  Actions :
    1. Vide TOUTES les tables (en respectant les FK)
    2. Crée un utilisateur ADMIN de test
    3. Crée un utilisateur USER (free) de test

  Usage :
    python reset_and_seed.py

  ⚠️  Ce script utilise une connexion directe à la base via
      psycopg2 (synchrone) — pas besoin de lancer le serveur.
=============================================================
"""

import os
import sys
import bcrypt
import uuid
from datetime import date
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# ─── Chargement de l'env ────────────────────────────────────
load_dotenv()

DB_CONFIG = {
    "host":     os.getenv("POSTGRES_HOST", "localhost"),
    "port":     int(os.getenv("POSTGRES_PORT", 5432)),
    "user":     os.getenv("POSTGRES_USER", "nocode"),
    "password": os.getenv("POSTGRES_PASSWORD", "nocode"),
    "dbname":   os.getenv("POSTGRES_DB", "nocode_builder_v2"),
}

# Si on est en dehors de Docker, le host "db" ne résout pas
# → on force localhost
if DB_CONFIG["host"] == "db":
    DB_CONFIG["host"] = "localhost"
    # Le port exposé est 5433 sur l'hôte
    DB_CONFIG["port"] = 5433
    print("ℹ️  Host 'db' détecté → connexion via localhost:5433 (port exposé)")

# ─── Credentials utilisateurs de test ───────────────────────
TEST_ADMIN = {
    "email":    "admin@test.com",
    "name":     "Admin",
    "surname":  "Test",
    "password": "Admin@1234!",   # doit respecter les règles de complexité
    "role":     "ADMIN",         # valeurs en MAJUSCULES côté PostgreSQL
    "plan":     "ENTERPRISE",
}

TEST_USER = {
    "email":    "user@test.com",
    "name":     "User",
    "surname":  "Test",
    "password": "User@1234!",
    "role":     "USER",
    "plan":     "FREE",
}

# ─── Tables à vider (dans l'ordre respectant les FK) ─────────
TABLES_TO_TRUNCATE = [
    # Dépendants en premier
    "messages",
    "conversations",
    "generations",
    "deployments",
    "executions_workflow",
    "etapes_workflow",
    "workflows",
    "historique_donnees",
    "donnees_projets",
    "composants",
    "pages",
    "interfaces",
    "blueprints",
    "fields",
    "tables_schema",
    "relations",
    "schemas",
    "sections",
    "nocode_projects",
    "projects",
    "workspaces",
    "users",
]


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        conn.autocommit = False
        return conn
    except psycopg2.OperationalError as e:
        print(f"\n❌ Impossible de se connecter à la base de données :")
        print(f"   {e}")
        print(f"\n💡 Vérifiez que le container PostgreSQL tourne :")
        print(f"   docker ps | grep nocode_db")
        sys.exit(1)


def truncate_all_tables(conn):
    print("\n🗑️  Vidage de toutes les tables...")
    with conn.cursor() as cur:
        # Désactiver temporairement les FK checks
        cur.execute("SET session_replication_role = 'replica';")
        for table in TABLES_TO_TRUNCATE:
            try:
                cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
                print(f"   ✅ {table} — vidée")
            except psycopg2.errors.UndefinedTable:
                print(f"   ⚠️  {table} — table introuvable (ignorée)")
                conn.rollback()
                cur.execute("SET session_replication_role = 'replica';")
        # Réactiver les FK checks
        cur.execute("SET session_replication_role = 'origin';")
    conn.commit()
    print("✅ Toutes les tables ont été vidées.\n")


def create_user(conn, user_data: dict):
    hashed = hash_password(user_data["password"])
    tracking = str(uuid.uuid4())

    with conn.cursor() as cur:
        # Vérifier si l'email existe déjà
        cur.execute("SELECT id FROM users WHERE email = %s", (user_data["email"],))
        existing = cur.fetchone()
        if existing:
            print(f"   ⚠️  {user_data['email']} — existe déjà (ignoré)")
            return None

        cur.execute(
            """
            INSERT INTO users (
                tracking_id, email, name, surname,
                hashed_password, role, plan,
                is_active, is_verified,
                birth_place, birth_date, country, phone,
                company_name, company_size
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                TRUE, TRUE,
                NULL, NULL, NULL, NULL,
                NULL, NULL
            )
            RETURNING tracking_id, email, role, plan;
            """,
            (
                tracking,
                user_data["email"],
                user_data["name"],
                user_data["surname"],
                hashed,
                user_data["role"],
                user_data["plan"],
            ),
        )
        result = cur.fetchone()
        conn.commit()
        return result


def print_banner():
    print("=" * 60)
    print("  NoCode Builder — Réinitialisation & Seed")
    print("=" * 60)
    print(f"  Base de données : {DB_CONFIG['dbname']}")
    print(f"  Hôte            : {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print("=" * 60)


def main():
    print_banner()

    conn = get_connection()
    print("✅ Connexion à la base de données établie.")

    # 1 — Vider toutes les tables
    truncate_all_tables(conn)

    # 2 — Créer les utilisateurs de test
    print("👤 Création des utilisateurs de test...")

    admin = create_user(conn, TEST_ADMIN)
    if admin:
        print(f"   ✅ ADMIN créé")
        print(f"      Email    : {TEST_ADMIN['email']}")
        print(f"      Password : {TEST_ADMIN['password']}")
        print(f"      Role     : {admin['role']}")
        print(f"      Plan     : {admin['plan']}")
        print(f"      UUID     : {admin['tracking_id']}")

    print()
    user = create_user(conn, TEST_USER)
    if user:
        print(f"   ✅ USER créé")
        print(f"      Email    : {TEST_USER['email']}")
        print(f"      Password : {TEST_USER['password']}")
        print(f"      Role     : {user['role']}")
        print(f"      Plan     : {user['plan']}")
        print(f"      UUID     : {user['tracking_id']}")

    conn.close()

    print("\n" + "=" * 60)
    print("  🎉 Réinitialisation terminée avec succès !")
    print("=" * 60)
    print("\n📋 Récapitulatif des comptes de test :")
    print(f"   Admin  → {TEST_ADMIN['email']} / {TEST_ADMIN['password']}")
    print(f"   User   → {TEST_USER['email']} / {TEST_USER['password']}")
    print("\n🚀 Tu peux maintenant tester avec ces credentials sur :")
    print("   POST /api/v1/auth/login")
    print()


if __name__ == "__main__":
    main()
