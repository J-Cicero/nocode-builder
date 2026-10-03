import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4">E-noCode</h3>
            <p className="text-gray-400 text-sm">
              Créez des applications sans code en quelques minutes.
            </p>
          </div>

          {/* Links - Product */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-gray-400 hover:text-white transition">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition">
                  Tarification
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-gray-400 hover:text-white transition">
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Links - Resources */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">Ressources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/use-cases" className="text-gray-400 hover:text-white transition">
                  Cas d'usage
                </Link>
              </li>
              <li>
                <a href="#docs" className="text-gray-400 hover:text-white transition">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Links - Company */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition">
                  À propos
                </Link>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-gray-400 hover:text-white transition">
                  Confidentialité
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm">
            © {currentYear} E-noCode. Tous droits réservés.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#twitter" className="text-gray-500 hover:text-white transition text-sm">
              Twitter
            </a>
            <a href="#github" className="text-gray-500 hover:text-white transition text-sm">
              GitHub
            </a>
            <a href="#linkedin" className="text-gray-500 hover:text-white transition text-sm">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
