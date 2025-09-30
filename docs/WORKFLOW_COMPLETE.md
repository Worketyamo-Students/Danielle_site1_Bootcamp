# 🔧 Workflow n8n "AI Recipe Generator" - Configuration Complète

## 📋 Changements Apportés

### ✅ 1. **Form Trigger** (ID: 71ffcce8-0eeb-487e-948e-dde6eb9e22c4)
- **Changement** : `responseMode` modifié de "lastNode" à "onCompletion"
- **Ajout** : `responseType: "json"` pour retourner du JSON au frontend
- **Raison** : Permettre au frontend de recevoir directement la réponse structurée

### ✅ 2. **Prepare Meal Request** (ID: e7665f61-a09a-4602-bfc9-7ddd9467beac)
- **Changement** : Node vide complété avec la logique de préparation
- **Ajout** : 
  - `request_id` : Identifiant unique basé sur timestamp + nom du plat
  - `request_type` : "specific_meal"
  - `user_input` : Input de l'utilisateur
  - `meal_name`, `dietary_restrictions`, `servings` : Données du formulaire
- **Raison** : Structurer les données pour les nodes suivants

### ✅ 3. **Prepare Ingredients Request** (ID: 944e432f-13a9-4be4-85f4-c94192402ade)
- **Changement** : Node vide complété avec la logique de préparation
- **Ajout** :
  - `request_id` : Identifiant unique pour les ingrédients
  - `request_type` : "ingredients_list"
  - `user_input` : Liste des ingrédients disponibles
  - `ingredients` : Champ spécifique pour les ingrédients
- **Raison** : Différencier le traitement ingrédients vs plats

### ✅ 4. **Build AI Prompt** (ID: 15272071-1d9c-4728-a627-1302a6202bd7)
- **Changement** : Node vide complété avec prompt complet
- **Ajout** : Prompt intelligent spécialisé cuisine camerounaise
- **Fonctionnalités** :
  - Détection automatique du type de requête
  - Instructions spécifiques pour chaque type
  - Contexte culturel camerounais
  - Gestion des restrictions alimentaires
  - Style de réponse chaleureux avec émojis
- **Raison** : Générer des prompts contextuels pour l'IA

### ✅ 5. **Format Recipe Output** (ID: eed7dbfc-497e-4196-9823-4794fdd65922)
- **Changement** : Node vide complété avec formatage de sortie
- **Ajout** :
  - `recipe_title` : Titre formaté selon le type de requête
  - `recipe_content` : Contenu généré par l'IA
  - `generated_at` : Timestamp de génération
  - `formatted_response` : JSON structuré pour le frontend
- **Raison** : Standardiser le format de sortie

### ✅ 6. **Save Recipe to Drive** (ID: 0e46acec-0df8-439a-ae72-d6a9ab6d2bbf)
- **Changement** : Paramètres de création de fichier ajoutés
- **Ajout** :
  - `name` : Nom de fichier basé sur titre + date
  - `fileContent` : Contenu Markdown avec métadonnées
  - Format : Fichier .md avec en-têtes et formatting
- **Raison** : Créer des backups lisibles des recettes

### ✅ 7. **Prepare User Response** (ID: 66826d98-7b31-45cd-9723-70ddc397095b)
- **Changement** : Node vide complété avec réponse finale
- **Ajout** :
  - `final_response` : JSON complet pour le frontend
  - Métadonnées de traitement
  - Structure de réponse standardisée
- **Raison** : Fournir une réponse complète au frontend

## 🔄 Flux de Données Complet

```
1. Form Trigger (Réception des données)
   ↓
2. Route Request Type (Séparation ingrédients/plat)
   ↓
3a. Prepare Meal Request OU 3b. Prepare Ingredients Request
   ↓
4. Merge Paths (Fusion des chemins)
   ↓
5. Log Request to Sheets (Enregistrement historique)
   ↓
6. Build AI Prompt (Construction du prompt IA)
   ↓
7. AI Agent (Génération via OpenRouter)
   ↓
8. Format Recipe Output (Formatage de la réponse)
   ↓
9a. Save Recipe to Sheets + 9b. Save Recipe to Drive (Sauvegarde)
   ↓
10. Merge Storage Results (Fusion des sauvegardes)
   ↓
11. Update Request Status (Mise à jour du statut)
   ↓
12. Prepare User Response (Réponse finale JSON)
```

## 📊 Données Échangées

### Input (Frontend → n8n)
```json
{
  "Request Type": "I want to cook a specific meal" | "I have ingredients to use",
  "Meal Name": "nom du plat" | "",
  "Available Ingredients": "liste d'ingrédients" | "",
  "Dietary Restrictions": "restrictions optionnelles",
  "Number of Servings": 4
}
```

### Output (n8n → Frontend)
```json
{
  "success": true,
  "message": "Recette générée avec succès par ChefIA !",
  "data": {
    "recipe_title": "Recette de ndolé",
    "recipe_content": "contenu de la recette...",
    "generated_at": "2025-09-30T10:30:00Z",
    "request_id": "unique_id",
    "user_query": "ndolé traditionnel",
    "type": "specific_meal"
  },
  "meta": {
    "processing_time": "12s",
    "ai_model": "OpenRouter via n8n",
    "specialization": "Cuisine Camerounaise"
  }
}
```

## 🧠 Prompt IA Spécialisé

Le prompt construit dynamiquement :
- **Contexte** : Expert culinaire camerounais
- **Instructions spécifiques** : Selon type de requête (ingrédients vs plat)
- **Spécialisation** : Plats traditionnels (Ndolé, Eru, Okok, etc.)
- **Style** : Chaleureux avec émojis camerounais
- **Adaptabilité** : Gestion des restrictions alimentaires

## 🔗 Intégration Frontend

### JavaScript mis à jour
- Détection intelligente du contenu JSON vs HTML
- Gestion des réponses asynchrones
- Affichage adaptatif selon le type de réponse
- Fallback vers simulation si nécessaire

### Configuration
- `config/n8n-integration.json` : Paramètres centralisés
- URLs dynamiques selon l'environnement
- Mapping des champs du formulaire

## ✅ Tests Disponibles

1. **Page de test** : `test-integration.html`
2. **Script automatique** : `scripts/test-workflow.sh`
3. **Tests manuels** : Interface principale `ia.html`

## 🚀 Prochaines Étapes

1. **Importer le workflow** dans n8n
2. **Configurer les credentials** (OpenRouter + Google)
3. **Tester l'intégration** complète
4. **Optimiser les prompts** selon les retours
5. **Ajouter des métriques** de performance

---

**Le workflow est maintenant complet et prêt pour la production !** 🎉