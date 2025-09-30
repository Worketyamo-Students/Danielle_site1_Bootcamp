// TchopIA - Advanced Culinary AI Assistant
// Powered by n8n Workflow Automation

class TchopIA {
    constructor() {
        this.config = null;
        this.sessionId = this.generateSessionId();
        this.currentRecipe = null;
        this.loadConfig().then(() => this.init());
    }

    async loadConfig() {
        try {
            // New lightweight config path
            const response = await fetch('./js/tchopia-config.json');
            this.config = await response.json();
        } catch (err) {
            console.warn('⚠️ Config file not found, using fallback defaults');
            this.config = {
                n8n: {
                    base_url: 'http://localhost:5678',
                    webhook_path: '/webhook/24ccdc71-4b9c-43dc-b203-8d7569b24910',
                    request_fields: {
                        request_type: 'Request Type',
                        meal_name: 'Meal Name',
                        ingredients: 'Available Ingredients',
                        dietary_restrictions: 'Dietary Restrictions',
                        servings: 'Number of Servings'
                    },
                    request_type_values: {
                        meal: 'I want to cook a specific meal',
                        ingredients: 'I have ingredients to use'
                    }
                },
                defaults: { servings: 4, dietary_restrictions: '', timeout_ms: 45000 },
                detection: {
                    ingredient_keywords: ["tomate", "oignon", "ail", "huile", "sel", "poivre", "viande", "poisson", "riz", "plantain"],
                    separators: [",", "et", "&", "+", ";"]
                }
            };
        }
        this.webhookUrl = `${this.config.n8n.base_url}${this.config.n8n.webhook_path}`;
        console.log('📋 TchopIA config ready:', this.webhookUrl);
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    init() {
        this.bindEvents();
        this.setupMarkdownRenderer();
        this.loadUserPreferences();
        console.log('🍽️ TchopIA initialized with session:', this.sessionId);
    }

    bindEvents() {
        const form = document.getElementById('recipe-form');
        const input = document.getElementById('recipe-input');
        const newQueryBtn = document.getElementById('new-query');
        const saveBtn = document.getElementById('save-recipe');
        const shareBtn = document.getElementById('share-recipe');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    this.processRecipeRequest(query);
                }
            });
        }

        if (newQueryBtn) {
            newQueryBtn.addEventListener('click', () => this.resetInterface());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveRecipe());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareRecipe());
        }

        // Auto-suggestions for common Cameronian dishes
        input?.addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });
    }

    async processRecipeRequest(query) {
        this.showLoading(true);
        this.hideError();
        try {
            const isIngredientList = this.detectIngredientList(query);
            const f = this.config.n8n.request_fields || this.config.n8n.request_fields || this.config.n8n.request_fields; // redundancy safe
            const values = this.config.n8n.request_type_values;
            const defaults = this.config.defaults;
            const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

            const payload = {
                [f.request_type]: isIngredientList ? values.ingredients : values.meal,
                [f.meal_name]: isIngredientList ? '' : query,
                [f.ingredients]: isIngredientList ? query : '',
                [f.dietary_restrictions]: defaults.dietary_restrictions,
                [f.servings]: defaults.servings,
                request_id: requestId
            };
            console.log('🚀 POST → n8n webhook', this.webhookUrl, payload);

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log('🔁 Raw n8n response:', data);

            // Expect structure from "Respond to Webhook" node
            const recipe = this.extractRecipeFromResponse(data);
            if (recipe) {
                this.displayRecipe(recipe.markdown || this.composeMarkdown(recipe));
                this.currentRecipe = { recipe: recipe.markdown || this.composeMarkdown(recipe), meta: recipe, requestId };
                this.saveToLocalHistory(query, recipe);
            } else {
                this.showError('Réponse inattendue du service IA');
            }
        } catch (e) {
            console.error(e);
            this.showError('Erreur lors de la génération: ' + e.message);
        } finally {
            this.showLoading(false);
        }
    }

    extractRecipeFromResponse(data) {
        if (!data) return null;
        // Try common wrappers
        const body = data.final_response || data.data || data;
        const content = body.recipe_content || body.content;
        if (content) {
            return {
                title: body.recipe_title || body.title || 'Recette ChefIA',
                content: content,
                generated_at: body.generated_at || new Date().toISOString(),
                request_id: body.request_id || body.id
            };
        }
        return null;
    }

    composeMarkdown(r) {
        return `# 🍽️ ${r.title}\n\n${r.content}`;
    }

    // Removed webhook listener logic (synchronous immediate response expected now)

    // Removed checkForWebhookResponse (legacy async pattern)

    detectIngredientList(query) {
        if (!this.config) return false;
        const detection = this.config.detection || this.config.frontend_config?.detection_logic;
        if (!detection) return false;
        const lowerQuery = query.toLowerCase();
        const hasSeparators = (detection.separators || []).some(sep => lowerQuery.includes(sep));
        const hasIngredientKeywords = (detection.ingredient_keywords || []).some(k => lowerQuery.includes(k.toLowerCase()));
        return hasSeparators && hasIngredientKeywords;
    }

    // Removed form submission intermediary (direct webhook usage)

    // Removed progressive UI (simplified synchronous flow)

    // Removed handleN8nResponse (no longer needed)

    // Removed polling fallback (simplified flow)

    async simulateRecipeGeneration(query, isIngredientList) {
        // Simulation d'attente pour le traitement
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockRecipe = this.generateMockRecipe(query, isIngredientList);
        
        this.showLoading(false);
        this.displayRecipe(mockRecipe);
        this.saveToLocalHistory(query, { recipe: mockRecipe, timestamp: new Date().toISOString() });
    }

    generateMockRecipe(query, isIngredientList) {
        if (isIngredientList) {
            return `# 🍽️ Recette suggérée avec vos ingrédients

## 📝 Analyse de vos ingrédients
Vous avez mentionné: **${query}**

## 🍲 Plat suggéré: Sauce Camerounaise
Basé sur vos ingrédients disponibles, je vous propose cette délicieuse sauce traditionnelle.

### 🛒 Ingrédients nécessaires
- ${query.split(/[,;+&]/).map(ing => `**${ing.trim()}**`).join('\n- ')}
- Cubes Maggi (si disponible)
- Huile de palme ou huile végétale

### 👨‍🍳 Instructions
1. **Préparation** (10 min): Épluchez et coupez tous les légumes
2. **Cuisson** (25 min): Faites revenir dans l'huile chaude
3. **Assaisonnement**: Ajoutez les épices et laissez mijoter
4. **Finalisation**: Goûtez et ajustez l'assaisonnement

### 💡 Conseils du Chef
- Laissez mijoter à feu doux pour développer les saveurs
- Servez avec du riz, plantain ou igname

*Recette générée par ChefIA basée sur vos ingrédients disponibles* ✨`;
        } else {
            return `# 🍽️ ${query.charAt(0).toUpperCase() + query.slice(1)}

## 📝 Description
${query} est un plat délicieux de la cuisine camerounaise qui ravira vos papilles.

### 🛒 Ingrédients (pour 4 personnes)
- Ingrédient principal selon votre demande
- Épices traditionnelles camerounaises
- Légumes frais de saison
- Huile de palme ou végétale

### 👨‍🍳 Préparation
1. **Préparation** (15 min): Préparez tous vos ingrédients
2. **Cuisson** (30 min): Suivez la méthode traditionnelle
3. **Assaisonnement**: Ajustez selon votre goût
4. **Dressage**: Servez chaud avec accompagnement

### 💡 Astuces de Chef
- Respectez les temps de cuisson pour préserver les saveurs
- N'hésitez pas à adapter selon vos préférences

*Recette personnalisée par ChefIA* 🇨🇲✨`;
        }
    }

    displayRecipe(recipeMarkdown) {
        const responseDiv = document.getElementById('recipe-response');
        const contentDiv = document.getElementById('recipe-content');
        
        if (!responseDiv || !contentDiv) return;

        // Convert markdown to HTML and display
        contentDiv.innerHTML = this.markdownToHtml(recipeMarkdown);
        responseDiv.classList.remove('hidden');
        
        // Add some nice animations
        this.addRecipeAnimations();
        
        console.log('✅ Recipe displayed successfully');
    }

    markdownToHtml(markdown) {
        // Enhanced markdown parser for recipe formatting
        return markdown
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-bouton mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-bouton mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-bouton mt-6 mb-4">$1</h1>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2 font-medium">$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-bouton">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
            .replace(/\n\n/g, '</p><p class="mb-3">')
            .replace(/^(.*)$/gim, '<p class="mb-3">$1</p>')
            .replace(/<p class="mb-3"><\/p>/g, '');
    }

    addRecipeAnimations() {
        // Add subtle animations to recipe elements
        const elements = document.querySelectorAll('#recipe-content h2, #recipe-content h3, #recipe-content li');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'all 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    showSuggestions(input) {
        const suggestions = [
            'Ndolè aux crevettes',
            'Okok au poisson fumé',
            'Eru traditionnel',
            'Poisson braisé camerounais',
            'Sauce jaune au poulet',
            'Beignets haricots',
            'Accra de morue',
            'Makossa (banane malaxée)',
            'Miondo aux légumes',
            'Sauce gombo'
        ];

        const filtered = suggestions.filter(s => 
            s.toLowerCase().includes(input.toLowerCase()) && input.length > 2
        );

        // Create and show suggestion dropdown (implement UI)
        this.showSuggestionDropdown(filtered);
    }

    showSuggestionDropdown(suggestions) {
        // Implementation for suggestion dropdown
        let dropdown = document.getElementById('suggestions-dropdown');
        
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'suggestions-dropdown';
            dropdown.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1';
            document.getElementById('recipe-form').appendChild(dropdown);
        }

        if (suggestions.length > 0) {
            dropdown.innerHTML = suggestions.map(suggestion => 
                `<div class="p-2 hover:bg-orange-50 cursor-pointer border-b last:border-b-0" onclick="document.getElementById('recipe-input').value = '${suggestion}'; this.parentElement.style.display = 'none';">
                    ${suggestion}
                </div>`
            ).join('');
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }

    getUserPreferences() {
        return JSON.parse(localStorage.getItem('tchopia-preferences') || '{}');
    }

    loadUserPreferences() {
        const prefs = this.getUserPreferences();
        console.log('👤 User preferences loaded:', prefs);
    }

    saveToLocalHistory(query, result) {
        const history = JSON.parse(localStorage.getItem('tchopia-history') || '[]');
        history.unshift({
            query,
            result,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20 queries
        if (history.length > 20) {
            history.splice(20);
        }
        
        localStorage.setItem('tchopia-history', JSON.stringify(history));
    }

    async saveRecipe() {
        if (!this.currentRecipe) return;
        
        try {
            // Save to browser storage
            const savedRecipes = JSON.parse(localStorage.getItem('tchopia-saved-recipes') || '[]');
            savedRecipes.push({
                ...this.currentRecipe,
                savedAt: new Date().toISOString()
            });
            localStorage.setItem('tchopia-saved-recipes', JSON.stringify(savedRecipes));
            
            // Visual feedback
            this.showToast('✅ Recette sauvegardée avec succès!', 'success');
            
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showToast('❌ Erreur lors de la sauvegarde', 'error');
        }
    }

    async shareRecipe() {
        if (!this.currentRecipe) return;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Recette TchopIA',
                    text: this.currentRecipe.recipe.substring(0, 200) + '...',
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(this.currentRecipe.recipe);
                this.showToast('📋 Recette copiée dans le presse-papiers!', 'success');
            }
        } catch (error) {
            console.error('Error sharing recipe:', error);
            this.showToast('❌ Erreur lors du partage', 'error');
        }
    }

    async getCookingTips() {
        const tips = [
            "🔥 Toujours préchauffer votre huile avant d'y ajouter les ingrédients",
            "🧂 Goûtez régulièrement et ajustez l'assaisonnement progressivement",
            "⏱️ Respectez les temps de cuisson pour préserver les saveurs",
            "🥬 Lavez soigneusement les légumes avant utilisation",
            "🐟 Pour le poisson fumé, le dessaler avant utilisation si nécessaire"
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showToast(randomTip, 'info', 5000);
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loading-state');
        const responseDiv = document.getElementById('recipe-response');
        
        if (loadingDiv) {
            if (show) {
                loadingDiv.classList.remove('hidden');
                responseDiv?.classList.add('hidden');
            } else {
                loadingDiv.classList.add('hidden');
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-state');
        const errorMsg = document.getElementById('error-message');
        
        if (errorDiv && errorMsg) {
            errorMsg.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('error-state');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    resetInterface() {
        const input = document.getElementById('recipe-input');
        const responseDiv = document.getElementById('recipe-response');
        
        if (input) input.value = '';
        if (responseDiv) responseDiv.classList.add('hidden');
        
        this.hideError();
        this.currentRecipe = null;
    }

    setupMarkdownRenderer() {
        // Enhanced markdown rendering setup
        console.log('📝 Markdown renderer initialized');
    }
}

// Initialize TchopIA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on the IA page
    if (document.getElementById('recipe-form')) {
        window.tchopIA = new TchopIA();
    }
});

// Legacy functions for backward compatibility
function initializeInterface() {
    console.log('🔄 Legacy interface initialization');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TchopIA;
}