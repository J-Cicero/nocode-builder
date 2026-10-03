FROM node:20-alpine

WORKDIR /app

# Copier uniquement les fichiers de configuration des dépendances pour optimiser le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Définir l'environnement pour que React ne tente pas d'ouvrir le navigateur
ENV BROWSER=none

# Exposer le port par défaut de react-scripts
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
