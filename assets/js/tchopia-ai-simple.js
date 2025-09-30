// Simple TchopIA Integration - Fixed Version
// This handles the communication between the frontend and n8n workflow

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on pages with the recipe form
    if (!document.getElementById('recipe-form')) return;
    
    console.log('🍽️ TchopIA Recipe Generator loaded');
    
    // Configuration
    const config = {
        webhookUrl: 'http://localhost:5678/webhook/24ccdc71-4b9c-43dc-b203-8d7569b24910',
        timeout: 45000
    };
    
    // Get form elements
    const form = document.getElementById('recipe-form');
    const ingredientsInput = document.getElementById('ingredients-input');
    const dishInput = document.getElementById('dish-input');
    const loadingDiv = document.getElementById('loading-state');
    const responseDiv = document.getElementById('recipe-response');
    const contentDiv = document.getElementById('recipe-content');
    const errorDiv = document.getElementById('error-state');
    const errorMsg = document.getElementById('error-message');
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const ingredients = ingredientsInput.value.trim();
        const dishName = dishInput.value.trim();
        
        if (!ingredients || !dishName) {
            showError('Veuillez remplir tous les champs');
            return;
        }
        
        await generateRecipe(ingredients, dishName);
    });
    
    // Generate recipe function
    async function generateRecipe(ingredients, dishName) {
        showLoading(true);
        hideError();
        
        try {
            const payload = {
                ingredients: ingredients,
                dish_name: dishName,
                dietary_restrictions: "",
                servings: 4,
                request_id: 'req_' + Date.now()
            };
            
            console.log('🚀 Sending request to n8n:', payload);
            
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Response received:', data);
            
            // Handle the response based on the updated structure
            let recipeContent = '';
            
            if (data.data && data.data.recipe) {
                // New structure
                recipeContent = data.data.recipe.content || data.data.recipe.title || 'Recette générée';
            } else if (data.recipe_content || data.content) {
                // Fallback for older structure
                recipeContent = data.recipe_content || data.content;
            } else {
                throw new Error('Format de réponse inattendu');
            }
            
            displayRecipe(recipeContent);
            
        } catch (error) {
            console.error('❌ Error:', error);
            showError('Erreur lors de la génération: ' + error.message);
        } finally {
            showLoading(false);
        }
    }
    
    // Display recipe
    function displayRecipe(content) {
        if (contentDiv) {
            // Simple markdown to HTML conversion
            const htmlContent = content
                .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-bouton mt-4 mb-2">$1</h3>')
                .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-bouton mt-6 mb-3">$1</h2>')
                .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-bouton mt-6 mb-4">$1</h1>')
                .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
                .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-2 font-medium">$1</li>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-bouton">$1</strong>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');
            
            contentDiv.innerHTML = htmlContent;
            responseDiv.classList.remove('hidden');
        }
    }
    
    // Show loading state
    function showLoading(show) {
        if (loadingDiv) {
            if (show) {
                loadingDiv.classList.remove('hidden');
                responseDiv?.classList.add('hidden');
            } else {
                loadingDiv.classList.add('hidden');
            }
        }
    }
    
    // Show error
    function showError(message) {
        if (errorDiv && errorMsg) {
            errorMsg.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
    
    // Hide error
    function hideError() {
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    // Add dish suggestions
    const cameroonDishes = [
        'Ndolé aux crevettes',
        'Okok au poisson fumé',
        'Eru traditionnel',
        'Poisson braisé camerounais',
        'Sauce jaune au poulet',
        'Beignets haricots',
        'Koki aux feuilles',
        'Mbongo tchobi',
        'Sauce gombo'
    ];
    
    // Simple autocomplete for dish names
    dishInput.addEventListener('input', function(e) {
        const value = e.target.value.toLowerCase();
        
        if (value.length < 2) return;
        
        const suggestions = cameroonDishes.filter(dish => 
            dish.toLowerCase().includes(value)
        );
        
        // You can implement a dropdown here if needed
        console.log('Suggestions:', suggestions);
    });
    
    // Handle action buttons
    const newQueryBtn = document.getElementById('new-query');
    if (newQueryBtn) {
        newQueryBtn.addEventListener('click', function() {
            ingredientsInput.value = '';
            dishInput.value = '';
            responseDiv.classList.add('hidden');
            hideError();
        });
    }
    
    console.log('🎉 TchopIA integration ready!');
});