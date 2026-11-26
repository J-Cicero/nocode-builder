import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="rt-container">
      <section className="rt-card rt-not-found">
        <h1>Page introuvable</h1>
        <p className="rt-muted">La page demandée n&apos;existe pas dans cette application.</p>
        <Link to="/" className="rt-btn">
          Retour à l&apos;accueil
        </Link>
      </section>
    </main>
  );
}
