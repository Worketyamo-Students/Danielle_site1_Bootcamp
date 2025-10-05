// TchopIA - AI Assistant for Culinary Experiences (Single Page Version)
// Configuration
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/tchopia-ai';

// DOM Elements
let mobileMenuBtn, mobileMenu, aiForm, userInput, generateBtn, loadingState, errorState;
let suggestionsSection, suggestionsGrid, recipeSection, recipeLoading;

// Current application state
let currentSuggestions = null;
let currentRecipeData = null;
let currentQuery = '';

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
    
    // New sections
    suggestionsSection = document.getElementById('suggestions-section');
    suggestionsGrid = document.getElementById('suggestions-grid');
    recipeSection = document.getElementById('recipe-section');
    recipeLoading = document.getElementById('recipe-loading');
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
        showError('Veuillez entrer votre demande avant de continuer.');
        return;
    }
    
    currentQuery = userQuery;
    
    try {
        showLoading();
        hideError();
        hideSections();
        
        console.log('Sending request to n8n workflow:', { query: userQuery, action: 'get_suggestions' });
        
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
        console.log('Raw response from n8n:', data);
        
        // Hide loading state
        hideLoading();
        
        // Handle the enhanced workflow response format
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
            currentSuggestions = suggestions;
            displaySuggestions(suggestions, userQuery, responseData);
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

function hideSections() {
    suggestionsSection.classList.add('hidden');
    recipeSection.classList.add('hidden');
}

function displaySuggestions(suggestions, originalQuery, responseData = null) {
    console.log('Displaying suggestions:', suggestions);
    
    // Update query display
    const queryDisplay = document.getElementById('query-display');
    queryDisplay.textContent = `Suggestions pour : "${originalQuery}"`;
    
    // Show parse info if available
    if (responseData && responseData.parseInfo) {
        const parseInfoDiv = document.getElementById('parse-info');
        parseInfoDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 max-w-2xl mx-auto">
                <p class="text-sm text-green-700 text-center">
                    ✅ Suggestions analysées avec succès 
                    <span class="font-mono text-xs">(${responseData.parseInfo.method})</span>
                    ${responseData.timestamp ? ` • ${new Date(responseData.timestamp).toLocaleString('fr-FR')}` : ''}
                </p>
            </div>
        `;
        parseInfoDiv.classList.remove('hidden');
    }
    
    // Create suggestions HTML
    const suggestionsHTML = suggestions.map((suggestion, index) => `
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-bouton hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex items-start justify-between mb-3">
                <h3 class="font-inter font-semibold text-lg text-bouton flex-1">${suggestion.name || `Suggestion ${index + 1}`}</h3>
                <span class="text-xs text-gray-400 ml-2">#${index + 1}</span>
            </div>
            
            <p class="font-inter text-gray-600 mb-4 text-sm leading-relaxed">${suggestion.description || 'Description non disponible'}</p>
            
            ${suggestion.estimated_time ? `
                <div class="flex items-center text-gray-500 text-xs mb-3">
                    <ion-icon name="time-outline" class="mr-1"></ion-icon>
                    <span>Temps estimé: ${suggestion.estimated_time}</span>
                </div>
            ` : ''}
            
            ${suggestion.difficulty ? `
                <div class="flex items-center text-gray-500 text-xs mb-3">
                    <ion-icon name="analytics-outline" class="mr-1"></ion-icon>
                    <span>Difficulté: ${suggestion.difficulty}</span>
                </div>
            ` : ''}
            
            <button 
                onclick="generateRecipe('${(suggestion.name || `Suggestion ${index + 1}`).replace(/'/g, "\\'")}')" 
                class="w-full bg-bouton text-white font-inter font-semibold py-3 px-6 rounded-[25px] text-[16px] hover:bg-orange-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center"
            >
                <ion-icon name="restaurant-outline" class="mr-2"></ion-icon>
                Générer la recette
            </button>
        </div>
    `).join('');
    
    // Add summary
    const summaryHTML = `
        <div class="col-span-full mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-inter font-semibold text-blue-800 mb-2 text-center">📊 Résumé des suggestions</h3>
            <p class="text-blue-700 text-sm text-center">
                ${suggestions.length} plat${suggestions.length > 1 ? 's' : ''} suggéré${suggestions.length > 1 ? 's' : ''} 
                • Cliquez sur "Générer la recette" pour obtenir les instructions détaillées
            </p>
        </div>
    `;
    
    suggestionsGrid.innerHTML = summaryHTML + suggestionsHTML;
    suggestionsSection.classList.remove('hidden');
    
    // Scroll to suggestions
    suggestionsSection.scrollIntoView({ behavior: 'smooth' });
}

async function generateRecipe(recipeName) {
    try {
        showRecipeLoading();
        hideError();
        
        console.log('Generating recipe for:', recipeName);
        
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Recipe response from n8n:', data);
        hideRecipeLoading();
        
        // Handle enhanced workflow response format
        let recipeContent = null;
        let responseData = null;
        
        // Check if response is an array (enhanced workflow format)
        if (Array.isArray(data) && data.length > 0) {
            responseData = data[0];
            
            // Look for recipe content in different possible fields
            if (responseData.parsedResponse && responseData.parsedResponse.content) {
                recipeContent = responseData.parsedResponse.content;
            } else if (responseData.rawResponse) {
                recipeContent = responseData.rawResponse;
            }
        }
        // Fallback: check for direct recipe property (old format)
        else if (data.recipe) {
            recipeContent = data.recipe;
            responseData = data;
        }
        // Additional fallback: check for content directly
        else if (data.content) {
            recipeContent = data.content;
            responseData = data;
        }
        
        if (recipeContent) {
            currentRecipeData = {
                name: recipeName,
                content: recipeContent,
                metadata: {
                    success: responseData.success || true,
                    timestamp: responseData.timestamp || new Date().toISOString(),
                    parseInfo: responseData.parseInfo || null,
                    action: responseData.action || 'generate_recipe'
                }
            };
            displayRecipe(recipeName, recipeContent, responseData);
        } else {
            console.error('No recipe content found in response:', data);
            showError('Erreur lors de la génération de la recette. Aucun contenu reçu.');
        }
        
    } catch (error) {
        console.error('Error generating recipe:', error);
        hideRecipeLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function showRecipeLoading() {
    recipeLoading.classList.remove('hidden');
}

function hideRecipeLoading() {
    recipeLoading.classList.add('hidden');
}

function displayRecipe(recipeName, recipeContent, responseData = null) {
    const recipeContentDiv = document.getElementById('recipe-content');
    
    // Format the recipe content for better display
    let formattedContent = recipeContent;
    
    // If we have structured recipe data, format it nicely
    if (responseData && responseData.parsedResponse) {
        const parsed = responseData.parsedResponse;
        
        if (parsed.title || parsed.ingredients || parsed.instructions) {
            formattedContent = '';
            
            if (parsed.title) {
                formattedContent += `<h5 class="text-lg font-semibold mb-3 text-bouton">${parsed.title}</h5>`;
            }
            
            if (parsed.cookingTime) {
                formattedContent += `<p class="text-sm text-gray-600 mb-3">⏱️ <strong>Temps de cuisson:</strong> ${parsed.cookingTime}</p>`;
            }
            
            if (parsed.servings) {
                formattedContent += `<p class="text-sm text-gray-600 mb-4">👥 <strong>Portions:</strong> ${parsed.servings}</p>`;
            }
            
            if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
                formattedContent += `
                    <div class="mb-4">
                        <h6 class="font-semibold text-bouton mb-2">🥘 Ingrédients:</h6>
                        <ul class="list-disc list-inside space-y-1">
                            ${parsed.ingredients.map(ingredient => `<li class="text-sm">${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (parsed.instructions && Array.isArray(parsed.instructions)) {
                formattedContent += `
                    <div class="mb-4">
                        <h6 class="font-semibold text-bouton mb-2">👩‍🍳 Instructions:</h6>
                        <ol class="list-decimal list-inside space-y-2">
                            ${parsed.instructions.map(instruction => `<li class="text-sm leading-relaxed">${instruction}</li>`).join('')}
                        </ol>
                    </div>
                `;
            }
            
            if (parsed.content && parsed.content !== recipeContent) {
                formattedContent += `<div class="mt-4 text-sm text-gray-700 leading-relaxed">${parsed.content}</div>`;
            }
        } else {
            // Fallback to formatted text content
            formattedContent = `<div class="whitespace-pre-wrap leading-relaxed text-sm">${recipeContent}</div>`;
        }
    } else {
        // Basic formatting for plain text
        formattedContent = `<div class="whitespace-pre-wrap leading-relaxed text-sm">${recipeContent}</div>`;
    }
    
    recipeContentDiv.innerHTML = `
        <div class="border-b border-gray-200 pb-4 mb-4">
            <h4 class="text-xl font-semibold text-bouton">${recipeName}</h4>
            ${responseData && responseData.parseInfo ? 
                `<p class="text-xs text-gray-500 mt-1">✅ Analysé avec succès (${responseData.parseInfo.method})</p>` : 
                ''
            }
        </div>
        ${formattedContent}
    `;
    
    // Hide suggestions and show recipe
    suggestionsSection.classList.add('hidden');
    recipeSection.classList.remove('hidden');
    recipeSection.scrollIntoView({ behavior: 'smooth' });
}

// Navigation functions
function resetToSearch() {
    hideSections();
    hideError();
    userInput.value = '';
    userInput.focus();
    currentSuggestions = null;
    currentRecipeData = null;
    currentQuery = '';
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToSuggestions() {
    if (currentSuggestions) {
        recipeSection.classList.add('hidden');
        suggestionsSection.classList.remove('hidden');
        suggestionsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        resetToSearch();
    }
}

function closeRecipe() {
    backToSuggestions();
}

// Recipe action functions
function saveRecipe() {
    if (currentRecipeData) {
        const blob = new Blob([`${currentRecipeData.name}\n\n${currentRecipeData.content}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentRecipeData.name.replace(/[^a-z0-9]/gi, '_')}_recipe.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function shareRecipe() {
    if (currentRecipeData && navigator.share) {
        navigator.share({
            title: `Recette: ${currentRecipeData.name}`,
            text: currentRecipeData.content
        });
    } else if (currentRecipeData) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${currentRecipeData.name}\n\n${currentRecipeData.content}`)
            .then(() => alert('Recette copiée dans le presse-papiers!'))
            .catch(err => console.error('Erreur lors de la copie:', err));
    }
}

function printRecipe() {
    if (currentRecipeData) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Recette: ${currentRecipeData.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #BA5E0D; }
                    .content { white-space: pre-wrap; line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>${currentRecipeData.name}</h1>
                <div class="content">${currentRecipeData.content}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}