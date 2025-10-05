// TchopIA - AI Assistant for Culinary Experiences
// Configuration
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/tchopia-ai'; // Update with your n8n webhook URL

// DOM Elements
let mobileMenuBtn, mobileMenu, aiForm, userInput, generateBtn, loadingState, errorState;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
});

function initializeDOMElements() {
    // Navigation elements
    mobileMenuBtn = document.getElementById('mobile-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    
    // Form elements
    aiForm = document.getElementById('ai-form');
    userInput = document.getElementById('user-input');
    generateBtn = document.getElementById('generate-suggestions-btn');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
}

function setupEventListeners() {
    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Form submission
    if (aiForm) {
        aiForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Hide mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && !mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
            hideMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    if (mobileMenu.classList.contains('hidden')) {
        showMobileMenu();
    } else {
        hideMobileMenu();
    }
}

function showMobileMenu() {
    mobileMenu.classList.remove('hidden');
    mobileMenuBtn.querySelector('ion-icon').setAttribute('name', 'close');
}

function hideMobileMenu() {
    mobileMenu.classList.add('hidden');
    mobileMenuBtn.querySelector('ion-icon').setAttribute('name', 'menu');
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    const userQuery = userInput.value.trim();
    if (!userQuery) {
        showError('Veuillez entrer votre demande.');
        return;
    }
    
    try {
        showLoading();
        hideError();
        
        // Make API call to n8n workflow
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: userQuery,
                action: 'get_suggestions'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loading state
        hideLoading();
        
        console.log('Raw response from n8n:', data);
        
        // Handle the new enhanced workflow response format
        let suggestions = null;
        let responseData = null;
        
        // Check if response is an array (enhanced workflow format)
        if (Array.isArray(data) && data.length > 0 && data[0].suggestions) {
            responseData = data[0];
            suggestions = responseData.suggestions;
        }
        // Fallback: check for direct suggestions property (old format)
        else if (data.suggestions) {
            suggestions = data.suggestions;
            responseData = data;
        }
        
        if (suggestions && suggestions.length > 0) {
            // Store additional metadata for the suggestions page
            const enhancedData = {
                suggestions: suggestions,
                success: responseData.success || true,
                timestamp: responseData.timestamp || new Date().toISOString(),
                parseInfo: responseData.parseInfo || null,
                action: responseData.action || 'get_suggestions'
            };
            
            // Create and redirect to suggestions page
            createSuggestionsPage(suggestions, userQuery, enhancedData);
        } else {
            showError('Aucune suggestion trouvée. Veuillez reformuler votre demande.');
        }
        
    } catch (error) {
        console.error('Error calling n8n workflow:', error);
        hideLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function showLoading() {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '⏳ Traitement en cours...';
    loadingState.classList.remove('hidden');
}

function hideLoading() {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '🚀 Obtenir des suggestions';
    loadingState.classList.add('hidden');
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    errorState.classList.remove('hidden');
}

function hideError() {
    errorState.classList.add('hidden');
}

function createSuggestionsPage(suggestions, originalQuery, enhancedData = null) {
    // Store data in sessionStorage for the suggestions page
    sessionStorage.setItem('tchopia_suggestions', JSON.stringify(suggestions));
    sessionStorage.setItem('tchopia_original_query', originalQuery);
    
    // Store enhanced metadata if available
    if (enhancedData) {
        sessionStorage.setItem('tchopia_enhanced_data', JSON.stringify(enhancedData));
    }
    
    // Redirect to the suggestions page
    window.location.href = './suggestions.html';
}

function generateSuggestionsHTML(suggestions, originalQuery) {
    const suggestionsCards = suggestions.map((suggestion, index) => `
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-bouton hover:shadow-xl transition-shadow duration-300">
            <h3 class="font-inter font-semibold text-lg text-bouton mb-3">${suggestion.name || `Suggestion ${index + 1}`}</h3>
            <p class="font-inter text-gray-600 mb-4">${suggestion.description || 'Description non disponible'}</p>
            <button 
                onclick="generateRecipe('${suggestion.name || `Suggestion ${index + 1}`}')" 
                class="w-full bg-bouton text-white font-inter font-semibold py-3 px-6 rounded-[25px] text-[16px] hover:bg-orange-700 transition-all hover:scale-[1.02] shadow-lg"
            >
                🍽️ Générer la recette
            </button>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TchopIA - Suggestions</title>
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
        <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style type="text/tailwindcss">
            @theme {
                --color-bouton:#BA5E0D;
                --font-inter:"Inter", sans-serif;
            }
        </style>
        <style>
            .animate-pulse {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        </style>
    </head>
    <body class="bg-gray-50 font-inter">
        <header class="w-full p-4 bg-white shadow-sm">
            <div class="flex items-center justify-between max-w-6xl mx-auto">
                <div class="flex items-center">
                    <h1 class="font-semibold text-[24px] text-bouton">TchopIA</h1>
                </div>
                <button onclick="window.close()" class="text-gray-600 hover:text-bouton">
                    <ion-icon name="close" class="text-[24px]"></ion-icon>
                </button>
            </div>
        </header>

        <main class="max-w-6xl mx-auto p-6">
            <div class="mb-6">
                <h2 class="font-inter font-semibold text-[28px] text-center mb-4">Suggestions pour : "${originalQuery}"</h2>
                <p class="text-center text-gray-600">Choisissez un plat pour obtenir la recette complète</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${suggestionsCards}
            </div>

            <!-- Loading state for recipe generation -->
            <div id="recipe-loading" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-bouton mx-auto mb-4"></div>
                    <p class="font-inter text-bouton">Génération de la recette en cours...</p>
                </div>
            </div>

            <!-- Recipe display -->
            <div id="recipe-display" class="hidden mt-8 bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-inter font-semibold text-2xl text-bouton">Recette complète</h3>
                    <button onclick="closeRecipe()" class="text-gray-600 hover:text-bouton">
                        <ion-icon name="close" class="text-[24px]"></ion-icon>
                    </button>
                </div>
                <div id="recipe-content" class="prose max-w-none">
                    <!-- Recipe content will be inserted here -->
                </div>
            </div>
        </main>

        <script>
            const N8N_WEBHOOK_URL = '${N8N_WEBHOOK_URL}';

            async function generateRecipe(recipeName) {
                try {
                    showRecipeLoading();
                    
                    const response = await fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            recipe_name: recipeName,
                            action: 'generate_recipe'
                        })
                    });

                    if (!response.ok) {
                        throw new Error(\`HTTP error! status: \${response.status}\`);
                    }

                    const data = await response.json();
                    hideRecipeLoading();
                    
                    if (data.recipe) {
                        displayRecipe(recipeName, data.recipe);
                    } else {
                        alert('Erreur lors de la génération de la recette.');
                    }
                    
                } catch (error) {
                    console.error('Error generating recipe:', error);
                    hideRecipeLoading();
                    alert('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\\'exécution.');
                }
            }

            function showRecipeLoading() {
                document.getElementById('recipe-loading').classList.remove('hidden');
            }

            function hideRecipeLoading() {
                document.getElementById('recipe-loading').classList.add('hidden');
            }

            function displayRecipe(recipeName, recipeContent) {
                const recipeDisplay = document.getElementById('recipe-display');
                const recipeContentDiv = document.getElementById('recipe-content');
                
                recipeContentDiv.innerHTML = \`
                    <h4 class="text-xl font-semibold mb-4">\${recipeName}</h4>
                    <div class="whitespace-pre-wrap">\${recipeContent}</div>
                \`;
                
                recipeDisplay.classList.remove('hidden');
                recipeDisplay.scrollIntoView({ behavior: 'smooth' });
            }

            function closeRecipe() {
                document.getElementById('recipe-display').classList.add('hidden');
            }
        </script>
    </body>
    </html>
    `;
}

// Export functions for global access (if needed)
window.toggleMobileMenu = toggleMobileMenu;
window.generateRecipe = generateRecipe;