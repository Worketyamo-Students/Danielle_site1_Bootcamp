# 🔗 Guide d'Intégration TchopIA ↔ n8n

## Vue d'ensemble

Ce guide explique comment le frontend TchopIA communique avec le workflow n8n "AI Receipe generator" pour générer des recettes intelligentes.

## 🏗️ Architecture

```
Frontend (ia.html)
     ↓
JavaScript (tchopia-ai.js)
     ↓
Configuration (n8n-integration.json)
     ↓
n8n Workflow (AI Receipe generator.json)
     ↓
OpenRouter API + Google Sheets
```

## 📋 Configuration Requise

### 1. n8n Setup
```bash
# Installer n8n si nécessaire
npm install -g n8n

# Démarrer n8n
npx n8n
```

### 2. Importer le Workflow
1. Ouvrir n8n sur http://localhost:5678
2. Créer un nouveau workflow
3. Importer le fichier `n8n-workflows/AI Receipe generator.json`
4. Configurer les credentials OpenRouter et Google Sheets

### 3. Variables d'Environnement
```bash
export OPENROUTER_API_KEY="your_openrouter_key"
export GOOGLE_SHEETS_CLIENT_ID="your_google_client_id"
export GOOGLE_SHEETS_CLIENT_SECRET="your_google_client_secret"
```

## 🔧 Fonctionnement de l'Intégration

### 1. Détection Intelligente
Le JavaScript analyse l'input utilisateur pour déterminer :
- **Liste d'ingrédients** : "tomates, oignons, huile de palme"
- **Plat spécifique** : "Je veux faire du ndolé"

### 2. Envoi vers n8n
```javascript
// Données envoyées au workflow
{
  "Request Type": "I have ingredients to use" | "I want to cook a specific meal",
  "Meal Name": "nom du plat" | "",
  "Available Ingredients": "liste d'ingrédients" | "",
  "Dietary Restrictions": "",
  "Number of Servings": 4
}
```

### 3. Traitement par n8n
1. **Form Trigger** : Reçoit les données du frontend
2. **Route Request Type** : Dirige selon le type de demande
3. **AI Agent** : Génère la recette via OpenRouter
4. **Storage** : Sauvegarde dans Google Sheets/Drive
5. **Response** : Retourne la recette formatée

## 📁 Structure des Fichiers

```
├── assets/
│   ├── ia.html              # Interface utilisateur
│   └── js/
│       └── tchopia-ai.js    # Logique d'intégration
├── config/
│   └── n8n-integration.json # Configuration des endpoints
├── n8n-workflows/
│   └── AI Receipe generator.json # Workflow n8n
└── test-integration.html    # Page de test
```

## 🧪 Tests

### Test Manuel
1. Ouvrir `test-integration.html`
2. Tester la configuration
3. Tester la connexion n8n
4. Tester les requêtes

### Test Automatique
```bash
./scripts/test-integration.sh
```

## 🔍 Debugging

### Vérifier n8n
```bash
curl http://localhost:5678/form/24ccdc71-4b9c-43dc-b203-8d7569b24910
```

### Console JavaScript
```javascript
// Tester la détection
tchopia.detectIngredientList("tomates, oignons, ail");  // true
tchopia.detectIngredientList("je veux du ndolé");       // false
```

### Logs n8n
- Ouvrir n8n Editor
- Aller dans Executions
- Voir les logs détaillés

## 🚨 Dépannage

### Problème : "Impossible de se connecter au service IA"
**Solution :**
1. Vérifier que n8n est démarré
2. Vérifier l'URL dans `n8n-integration.json`
3. Vérifier que le workflow est activé

### Problème : "CORS Error"
**Solution :**
```bash
# Démarrer n8n avec CORS désactivé
n8n start --tunnel
```

### Problème : "Workflow not found"
**Solution :**
1. Vérifier l'ID du workflow : `24ccdc71-4b9c-43dc-b203-8d7569b24910`
2. Réimporter le workflow si nécessaire

## 📊 Monitoring

### Métriques à Surveiller
- Taux de succès des requêtes
- Temps de réponse du workflow
- Qualité des recettes générées
- Utilisation de l'API OpenRouter

### Google Sheets
- **RecipeHistory** : Historique des demandes
- **GeneratedRecipes** : Recettes générées

## 🔄 Workflow n8n en Détail

### Nodes Principaux

1. **Form Trigger** (`71ffcce8-0eeb-487e-948e-dde6eb9e22c4`)
   - Reçoit les données du frontend
   - URL: `/form/24ccdc71-4b9c-43dc-b203-8d7569b24910`

2. **Route Request Type** (`f11b4f40-a77c-4cd7-a39e-6b070d98087a`)
   - Sépare ingrédients vs plats spécifiques

3. **AI Agent** (`2c839929-8df7-43f3-95f8-235127086ef1`)
   - Utilise OpenRouter pour générer les recettes
   - Modèle: `openai/gpt-oss-20b:free`

4. **Storage Nodes**
   - `88e0afa1-d690-4362-a187-f39810e02872`: Log vers Google Sheets
   - `54d5631a-1470-4cb6-aa82-fad7a3ca422a`: Sauvegarde recettes
   - `0e46acec-0df8-439a-ae72-d6a9ab6d2bbf`: Backup Google Drive

## 🎯 Prochaines Étapes

1. **Améliorer la Réponse en Temps Réel**
   - Utiliser WebSockets pour les mises à jour live
   - Implémenter un système de polling intelligent

2. **Optimiser la Détection**
   - Machine Learning pour la classification
   - Plus de mots-clés camerounais

3. **Monitoring Avancé**
   - Dashboard de métriques
   - Alertes en cas d'erreur

## 📞 Support

En cas de problème :
1. Vérifier les logs JavaScript (F12)
2. Vérifier les executions n8n
3. Tester avec `test-integration.html`
4. Consulter ce guide de dépannage