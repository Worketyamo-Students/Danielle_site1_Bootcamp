// TchopIA Enhanced - AI Assistant for Culinary Experiences
// Updated for n8n AI Agent Workflow with Tool Integration

// Configuration
// const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/tchopia-ai';
const N8N_WEBHOOK_URL = 'https://n8n-service-apox.onrender.com/webhook/tchopia-ai';


// DOM Elements
let mobileMenuBtn, mobileMenu, aiForm, userInput, generateBtn, loadingState, errorState;
let suggestionsSection, suggestionsGrid, recipeSection, adviceSection;

// Current application state
let currentSuggestions = null;
let currentRecipeData = null;
let currentAdviceData = null;
let currentQuery = '';
let sessionId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    initializeSession();
});

function initializeSession() {
    // Generate or retrieve session ID for conversation memory
    sessionId = localStorage.getItem('tchopia-session-id') || `session_${Date.now()}`;
    localStorage.setItem('tchopia-session-id', sessionId);
    console.log('TchopIA Session ID:', sessionId);
}

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
    
    // Content sections
    suggestionsSection = document.getElementById('suggestions-section');
    suggestionsGrid = document.getElementById('suggestions-grid');
    recipeSection = document.getElementById('recipe-section');
    adviceSection = document.getElementById('advice-section');
    
    // Create advice section if it doesn't exist
    if (!adviceSection) {
        createAdviceSection();
    }
}

function createAdviceSection() {
    const mainContent = document.querySelector('main') || document.body;
    
    const adviceSectionHTML = `
        <div id="advice-section" class="hidden mt-8 max-w-6xl mx-auto">
            <div class="text-center mb-6">
                <h2 class="font-inter font-bold text-[24px] sm:text-[28px] md:text-[32px] text-gray-800">
                    💡 Conseils Culinaires TchopIA
                </h2>
                <p id="advice-query-display" class="font-inter text-gray-600 mt-2"></p>
            </div>
            <div id="advice-content" class="bg-white rounded-lg shadow-xl p-6 md:p-8"></div>
        </div>
    `;
    
    // Insert advice section after suggestions section
    const suggestionsSection = document.getElementById('suggestions-section');
    if (suggestionsSection) {
        suggestionsSection.insertAdjacentHTML('afterend', adviceSectionHTML);
        adviceSection = document.getElementById('advice-section');
    }
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
    if (mobileMenu) {
        mobileMenu.classList.contains('hidden') ? showMobileMenu() : hideMobileMenu();
    }
}

function showMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.remove('hidden');
    }
}

function hideMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }
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
        
        console.log('Sending request to TchopIA AI Agent:', { 
            query: userQuery, 
            session_id: sessionId 
        });
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId,
                'User-Agent': navigator.userAgent || 'TchopIA-Frontend'
            },
            body: JSON.stringify({
                query: userQuery,
                // Let the AI agent auto-detect the action type
                context: {
                    timestamp: new Date().toISOString(),
                    source: 'web-frontend'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AI Agent Response:', data);
        
        hideLoading();
        
        // Handle the new AI agent response format
        if (data.success) {
            handleSuccessResponse(data, userQuery);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error calling TchopIA AI Agent:', error);
        hideLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function handleSuccessResponse(data, userQuery) {
    const responseType = detectResponseType(data);
    
    console.log('Detected response type:', responseType);
    
    switch (responseType) {
        case 'suggestions':
            handleSuggestionsResponse(data, userQuery);
            break;
        case 'recipe':
            handleRecipeResponse(data, userQuery);
            break;
        case 'advice':
            handleAdviceResponse(data, userQuery);
            break;
        default:
            // Fallback: try to extract any recognizable content
            handleGenericResponse(data, userQuery);
    }
}

function detectResponseType(data) {
    // Check for explicit action in response
    if (data.action) {
        switch (data.action) {
            case 'get_suggestions':
                return 'suggestions';
            case 'generate_recipe':
                return 'recipe';
            case 'cooking_advice':
                return 'advice';
        }
    }
    
    // Check for data structure indicators
    if (data.suggestions || (data.data && data.data.suggestions)) {
        return 'suggestions';
    }
    
    if (data.recipe || (data.data && data.data.recipe)) {
        return 'recipe';
    }
    
    if (data.advice || (data.data && data.data.advice)) {
        return 'advice';
    }
    
    // Check response content for keywords
    const responseText = JSON.stringify(data).toLowerCase();
    
    if (responseText.includes('suggestions') || responseText.includes('plats')) {
        return 'suggestions';
    }
    
    if (responseText.includes('recette') || responseText.includes('ingrédients')) {
        return 'recipe';
    }
    
    if (responseText.includes('conseil') || responseText.includes('astuce')) {
        return 'advice';
    }
    
    return 'generic';
}

function handleSuggestionsResponse(data, userQuery) {
    let suggestions = data.suggestions || data.data?.suggestions || [];
    
    // Try to extract suggestions from various response formats
    if (suggestions.length === 0) {
        // Check if suggestions are nested deeper
        if (data.data && Array.isArray(data.data)) {
            for (const item of data.data) {
                if (item.suggestions) {
                    suggestions = item.suggestions;
                    break;
                }
            }
        }
        
        // Try to parse from text output
        if (suggestions.length === 0 && data.output) {
            suggestions = parseFromJsonString(data.output, 'suggestions') || [];
        }
    }
    
    if (suggestions.length > 0) {
        currentSuggestions = suggestions;
        displaySuggestions(suggestions, userQuery, data);
    } else {
        showError('Aucune suggestion trouvée. Veuillez reformuler votre demande.');
    }
}

function handleRecipeResponse(data, userQuery) {
    let recipe = data.recipe || data.data?.recipe;
    
    if (!recipe && data.output) {
        const parsed = parseFromJsonString(data.output, 'recipe');
        recipe = parsed?.recipe || parsed;
    }
    
    if (recipe) {
        currentRecipeData = recipe;
        displayRecipe(recipe, userQuery, data);
        showSuccess(`Recette générée avec succès pour ${recipe.name || 'le plat demandé'}!`);
    } else {
        showError('Impossible de générer la recette. Veuillez réessayer.');
    }
}

function handleAdviceResponse(data, userQuery) {
    let advice = data.advice || data.data?.advice;
    
    if (!advice && data.output) {
        const parsed = parseFromJsonString(data.output, 'advice');
        advice = parsed?.advice || parsed;
    }
    
    if (advice) {
        currentAdviceData = advice;
        displayAdvice(advice, userQuery, data);
        showSuccess(`Conseils générés avec succès pour ${advice.advice_type || 'votre demande'}!`);
    } else {
        showError('Impossible de générer les conseils. Veuillez réessayer.');
    }
}

function handleGenericResponse(data, userQuery) {
    // Try to extract any usable content from the response
    let content = data.output || data.text || data.message || JSON.stringify(data);
    
    // Check if it contains structured data we can parse
    const parsedSuggestions = parseFromJsonString(content, 'suggestions');
    if (parsedSuggestions && parsedSuggestions.length > 0) {
        handleSuggestionsResponse({ suggestions: parsedSuggestions }, userQuery);
        return;
    }
    
    const parsedRecipe = parseFromJsonString(content, 'recipe');
    if (parsedRecipe) {
        handleRecipeResponse({ recipe: parsedRecipe }, userQuery);
        return;
    }
    
    const parsedAdvice = parseFromJsonString(content, 'advice');
    if (parsedAdvice) {
        handleAdviceResponse({ advice: parsedAdvice }, userQuery);
        return;
    }
    
    // Fallback: display as text content
    displayTextResponse(content, userQuery);
}

function parseFromJsonString(text, expectedType) {
    if (!text || typeof text !== 'string') return null;
    
    try {
        // Try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Return parsed data based on expected type
            if (expectedType === 'suggestions' && Array.isArray(parsed)) {
                return parsed;
            } else if (expectedType === 'recipe' && parsed.name) {
                return parsed;
            } else if (expectedType === 'advice' && parsed.advice_type) {
                return parsed;
            }
            
            return parsed;
        }
    } catch (error) {
        console.log('JSON parsing failed:', error);
    }
    
    return null;
}

function handleErrorResponse(data) {
    const errorMessage = data.message || data.error || 'Une erreur s\'est produite';
    showError(errorMessage);
    
    // Display suggestions if provided in error response
    if (data.suggestions && data.suggestions.length > 0) {
        setTimeout(() => {
            hideError();
            displaySuggestions(data.suggestions, currentQuery, data);
        }, 2000);
    }
}

function displaySuggestions(suggestions, originalQuery, responseData = null) {
    console.log('Displaying suggestions:', suggestions);
    
    // Update query display
    const queryDisplay = document.getElementById('query-display');
    if (queryDisplay) {
        queryDisplay.textContent = `Suggestions pour : "${originalQuery}"`;
    }
    
    // Show metadata if available
    if (responseData && responseData.metadata) {
        displayMetadata(responseData.metadata, 'suggestions');
    }
    
    // Create suggestions HTML
    const suggestionsHTML = suggestions.map((suggestion, index) => `
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-bouton hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex items-start justify-between mb-3">
                <h3 class="font-inter font-semibold text-[18px] sm:text-[20px] text-gray-800 mb-2">
                    ${escapeHtml(suggestion.name || `Suggestion ${index + 1}`)}
                </h3>
                <span class="text-sm text-bouton font-medium bg-orange-50 px-2 py-1 rounded-full">
                    #${index + 1}
                </span>
            </div>
            
            <p class="font-inter text-gray-600 text-[14px] sm:text-[16px] leading-relaxed mb-4">
                ${escapeHtml(suggestion.description || 'Description non disponible')}
            </p>
            
            ${suggestion.region ? `
                <div class="flex items-center text-gray-500 text-xs mb-2">
                    <ion-icon name="location-outline" class="mr-1"></ion-icon>
                    <span>Région: ${escapeHtml(suggestion.region)}</span>
                </div>
            ` : ''}
            
            ${suggestion.difficulty ? `
                <div class="flex items-center text-gray-500 text-xs mb-3">
                    <ion-icon name="analytics-outline" class="mr-1"></ion-icon>
                    <span>Difficulté: ${escapeHtml(suggestion.difficulty)}</span>
                </div>
            ` : ''}
            
            <div class="flex flex-col sm:flex-row gap-2">
                <button 
                    id="recipe-btn-${i}"
                    data-dish-name="${escapeHtml(suggestion.name)}"
                    onclick="requestRecipe('${escapeHtml(suggestion.name)}', '${escapeHtml(suggestion.description)}')" 
                    class="flex-1 bg-bouton text-white font-inter font-semibold py-3 px-4 rounded-[20px] text-[14px] sm:text-[16px] hover:bg-orange-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center"
                >
                    <span class="btn-text">📖 Voir la recette</span>
                    <span class="btn-loading hidden">
                        <svg class="animate-spin h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Génération...
                    </span>
                </button>
                <button 
                    id="advice-btn-${i}"
                    data-dish-name="${escapeHtml(suggestion.name)}"
                    onclick="requestAdvice('${escapeHtml(suggestion.name)}')" 
                    class="flex-1 bg-gray-600 text-white font-inter font-semibold py-3 px-4 rounded-[20px] text-[14px] sm:text-[16px] hover:bg-gray-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center"
                >
                    <span class="btn-text">💡 Conseils</span>
                    <span class="btn-loading hidden">
                        <svg class="animate-spin h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Génération...
                    </span>
                </button>
            </div>
        </div>
    `).join('');
    
    // Update suggestions grid
    if (suggestionsGrid) {
        suggestionsGrid.innerHTML = suggestionsHTML;
    }
    
    // Show suggestions section
    if (suggestionsSection) {
        suggestionsSection.classList.remove('hidden');
    }
}

function displayRecipe(recipe, originalQuery, responseData = null) {
    console.log('Displaying recipe:', recipe);
    
    // Update recipe section content
    const recipeContent = `
        <div class="bg-white rounded-lg shadow-xl p-6 md:p-8">
            <div class="text-center mb-8">
                <h2 class="font-inter font-bold text-[24px] sm:text-[28px] md:text-[32px] text-gray-800 mb-2">
                    ${escapeHtml(recipe.name || 'Recette Camerounaise')}
                </h2>
                <p class="font-inter text-gray-600">
                    ${escapeHtml(recipe.description || 'Recette traditionnelle camerounaise')}
                </p>
                ${recipe.region ? `<p class="text-sm text-bouton mt-2">Région: ${escapeHtml(recipe.region)}</p>` : ''}
            </div>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        🥘 Ingrédients
                    </h3>
                    <ul class="space-y-2">
                        ${(recipe.ingredients || []).map(ingredient => {
                            if (typeof ingredient === 'string') {
                                return `<li class="flex items-start"><span class="text-bouton mr-2">•</span>${escapeHtml(ingredient)}</li>`;
                            } else {
                                return `<li class="flex items-start"><span class="text-bouton mr-2">•</span><strong>${escapeHtml(ingredient.quantity || '')}</strong> ${escapeHtml(ingredient.item || ingredient.name || '')}</li>`;
                            }
                        }).join('')}
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        ⏱️ Informations
                    </h3>
                    <div class="space-y-2 text-sm">
                        ${recipe.prep_time ? `<p><strong>Préparation:</strong> ${recipe.prep_time} min</p>` : ''}
                        ${recipe.cook_time ? `<p><strong>Cuisson:</strong> ${recipe.cook_time} min</p>` : ''}
                        ${recipe.total_time ? `<p><strong>Total:</strong> ${recipe.total_time} min</p>` : ''}
                        ${recipe.servings ? `<p><strong>Portions:</strong> ${escapeHtml(recipe.servings)}</p>` : ''}
                        ${recipe.difficulty ? `<p><strong>Difficulté:</strong> ${escapeHtml(recipe.difficulty)}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="mt-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    👨‍🍳 Instructions
                </h3>
                <ol class="space-y-4">
                    ${(recipe.instructions || []).map((instruction, index) => {
                        if (typeof instruction === 'string') {
                            return `<li class="flex items-start"><span class="bg-bouton text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-1">${index + 1}</span><div>${escapeHtml(instruction)}</div></li>`;
                        } else {
                            return `<li class="flex items-start"><span class="bg-bouton text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-1">${instruction.step || index + 1}</span><div><p>${escapeHtml(instruction.action || instruction.description || '')}</p>${instruction.tips ? `<p class="text-sm text-gray-600 mt-1"><em>💡 ${escapeHtml(instruction.tips)}</em></p>` : ''}</div></li>`;
                        }
                    }).join('')}
                </ol>
            </div>
            
            ${recipe.tips && recipe.tips.length > 0 ? `
                <div class="mt-8">
                    <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        💡 Conseils de Chef
                    </h3>
                    <ul class="space-y-2">
                        ${recipe.tips.map(tip => `<li class="flex items-start"><span class="text-bouton mr-2">✓</span>${escapeHtml(tip)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recipe.cultural_notes ? `
                <div class="mt-8 bg-orange-50 border-l-4 border-bouton p-4 rounded">
                    <h4 class="font-semibold text-gray-800 mb-2">🏛️ Notes Culturelles</h4>
                    <p class="text-gray-700">${escapeHtml(recipe.cultural_notes)}</p>
                </div>
            ` : ''}
            
            <div class="mt-8 flex flex-wrap gap-4 justify-center">
                <button onclick="hideSections()" class="bg-gray-600 text-white px-6 py-3 rounded-[20px] hover:bg-gray-700 transition-all">
                    ← Retour aux suggestions
                </button>
                <button onclick="window.print()" class="bg-bouton text-white px-6 py-3 rounded-[20px] hover:bg-orange-700 transition-all">
                    🖨️ Imprimer
                </button>
            </div>
        </div>
    `;
    
    // Update recipe section
    if (recipeSection) {
        recipeSection.innerHTML = recipeContent;
        recipeSection.classList.remove('hidden');
    }
    
    // Hide other sections
    if (suggestionsSection) suggestionsSection.classList.add('hidden');
    if (adviceSection) adviceSection.classList.add('hidden');
}

function displayAdvice(advice, originalQuery, responseData = null) {
    console.log('Displaying advice:', advice);
    
    // Update query display
    const adviceQueryDisplay = document.getElementById('advice-query-display');
    if (adviceQueryDisplay) {
        adviceQueryDisplay.textContent = `Conseils pour : "${originalQuery}"`;
    }
    
    // Create advice HTML
    const adviceHTML = `
        <div class="mb-6">
            <div class="flex items-center mb-4">
                <span class="bg-bouton text-white px-3 py-1 rounded-full text-sm font-semibold mr-3">
                    ${escapeHtml(advice.advice_type || 'Conseil')}
                </span>
                ${advice.difficulty_level ? `
                    <span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                        ${escapeHtml(advice.difficulty_level)}
                    </span>
                ` : ''}
            </div>
        </div>
        
        <div class="mb-8">
            <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                💡 Conseil Principal
            </h3>
            <div class="bg-orange-50 border-l-4 border-bouton p-6 rounded">
                <p class="text-gray-700 leading-relaxed">${escapeHtml(advice.main_advice || advice.content || 'Conseil non disponible')}</p>
            </div>
        </div>
        
        ${advice.quick_tips && advice.quick_tips.length > 0 ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    ⚡ Astuces Rapides
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                    ${advice.quick_tips.map(tip => `
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <p class="text-gray-700"><span class="text-bouton mr-2">✓</span>${escapeHtml(tip)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${advice.traditional_secrets && advice.traditional_secrets.length > 0 ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    🔐 Secrets Traditionnels
                </h3>
                <div class="space-y-3">
                    ${advice.traditional_secrets.map(secret => `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p class="text-gray-700"><span class="text-yellow-600 mr-2">🌟</span>${escapeHtml(secret)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${advice.step_by_step && advice.step_by_step.length > 0 ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    📋 Étapes Détaillées
                </h3>
                <ol class="space-y-4">
                    ${advice.step_by_step.map((step, index) => `
                        <li class="flex items-start">
                            <span class="bg-bouton text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-4 mt-1">
                                ${step.step || index + 1}
                            </span>
                            <div class="flex-1">
                                <p class="text-gray-700 mb-1">${escapeHtml(step.action || step.description || '')}</p>
                                ${step.tip ? `<p class="text-sm text-gray-600"><em>💡 ${escapeHtml(step.tip)}</em></p>` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ol>
            </div>
        ` : ''}
        
        ${advice.common_mistakes && advice.common_mistakes.length > 0 ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    ⚠️ Erreurs à Éviter
                </h3>
                <div class="space-y-3">
                    ${advice.common_mistakes.map(mistake => `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p class="text-gray-700"><span class="text-red-600 mr-2">❌</span>${escapeHtml(mistake)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${advice.cultural_context ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    🏛️ Contexte Culturel
                </h3>
                <div class="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                    <p class="text-gray-700">${escapeHtml(advice.cultural_context)}</p>
                </div>
            </div>
        ` : ''}
        
        <div class="flex flex-wrap gap-4 justify-center">
            <button onclick="hideSections()" class="bg-gray-600 text-white px-6 py-3 rounded-[20px] hover:bg-gray-700 transition-all">
                ← Retour aux suggestions
            </button>
            <button onclick="requestMoreAdvice()" class="bg-bouton text-white px-6 py-3 rounded-[20px] hover:bg-orange-700 transition-all">
                💡 Plus de conseils
            </button>
        </div>
    `;
    
    // Update advice content
    const adviceContent = document.getElementById('advice-content');
    if (adviceContent) {
        adviceContent.innerHTML = adviceHTML;
    }
    
    // Show advice section
    if (adviceSection) {
        adviceSection.classList.remove('hidden');
    }
    
    // Hide other sections
    if (suggestionsSection) suggestionsSection.classList.add('hidden');
    if (recipeSection) recipeSection.classList.add('hidden');
}

function displayTextResponse(content, originalQuery) {
    // Create a simple text display for generic responses
    const textHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 md:p-8">
            <h2 class="font-inter font-bold text-[24px] text-gray-800 mb-4">
                Réponse TchopIA
            </h2>
            <div class="prose max-w-none">
                <p class="text-gray-700 leading-relaxed">${escapeHtml(content)}</p>
            </div>
            <div class="mt-6 text-center">
                <button onclick="hideSections()" class="bg-bouton text-white px-6 py-3 rounded-[20px] hover:bg-orange-700 transition-all">
                    ← Retour
                </button>
            </div>
        </div>
    `;
    
    if (recipeSection) {
        recipeSection.innerHTML = textHTML;
        recipeSection.classList.remove('hidden');
    }
}

function displayMetadata(metadata, responseType) {
    // Display response metadata for debugging/info
    if (metadata && metadata.generated_at) {
        const metadataDiv = document.getElementById('metadata-info') || createMetadataDiv();
        metadataDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 max-w-2xl mx-auto mb-4">
                <p class="text-sm text-green-700 text-center">
                    ✅ Réponse générée avec succès 
                    <span class="font-mono text-xs">(${responseType})</span>
                    • ${new Date(metadata.generated_at).toLocaleString('fr-FR')}
                </p>
            </div>
        `;
        metadataDiv.classList.remove('hidden');
    }
}

function createMetadataDiv() {
    const metadataDiv = document.createElement('div');
    metadataDiv.id = 'metadata-info';
    metadataDiv.className = 'hidden';
    
    const mainContent = document.querySelector('main') || document.body;
    const firstSection = mainContent.querySelector('section');
    if (firstSection) {
        firstSection.insertAdjacentElement('afterend', metadataDiv);
    }
    
    return metadataDiv;
}

// Interaction functions
async function requestRecipe(dishName, description = '') {
    try {
        // Show specific recipe loading state
        showRecipeLoading(dishName);
        hideError();
        
        console.log('Requesting recipe for:', dishName);
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                query: `Comment préparer ${dishName}`,
                action: 'generate_recipe',
                context: {
                    recipe_name: dishName,
                    description: description,
                    source: 'suggestion-click'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hideRecipeLoading();
        
        if (data.success) {
            handleRecipeResponse(data, `Recette pour ${dishName}`);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error requesting recipe:', error);
        hideRecipeLoading();
        showError('Erreur lors de la génération de la recette.');
    }
}

async function requestAdvice(dishName) {
    try {
        // Show specific advice loading state
        showAdviceLoading(dishName);
        hideError();
        
        console.log('Requesting advice for:', dishName);
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                query: `Donnez-moi des conseils pour bien préparer ${dishName}`,
                action: 'cooking_advice',
                context: {
                    dish_name: dishName,
                    source: 'suggestion-click'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hideAdviceLoading();
        
        if (data.success) {
            handleAdviceResponse(data, `Conseils pour ${dishName}`);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error requesting advice:', error);
        hideAdviceLoading();
        showError('Erreur lors de la génération des conseils.');
    }
}

async function requestMoreAdvice() {
    if (currentAdviceData && currentQuery) {
        const newQuery = `Donnez-moi plus de conseils détaillés sur ${currentQuery}`;
        userInput.value = newQuery;
        await handleFormSubmission({ preventDefault: () => {} });
    }
}

// Utility functions
// Enhanced Loading States for Individual Actions

function showRecipeLoading(dishName) {
    console.log('Showing recipe loading for:', dishName);
    
    // Find and update the specific recipe button
    const recipeButtons = document.querySelectorAll('[data-dish-name]');
    recipeButtons.forEach(button => {
        if (button.dataset.dishName === dishName && button.id.startsWith('recipe-btn-')) {
            const btnText = button.querySelector('.btn-text');
            const btnLoading = button.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.classList.add('hidden');
                btnLoading.classList.remove('hidden');
            }
            
            button.disabled = true;
            button.classList.add('opacity-75', 'cursor-not-allowed');
            button.classList.remove('hover:scale-[1.02]');
        }
    });
    
    // Show the overlay loading state
    const recipeLoadingOverlay = document.getElementById('recipe-loading');
    if (recipeLoadingOverlay) {
        recipeLoadingOverlay.classList.remove('hidden');
        
        // Update loading message
        const loadingText = recipeLoadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.innerHTML = `👩‍🍳 Génération de la recette pour <strong>${dishName}</strong>...`;
        }
    }
}

function hideRecipeLoading() {
    console.log('Hiding recipe loading');
    
    // Reset all recipe buttons
    const recipeButtons = document.querySelectorAll('[id^="recipe-btn-"]');
    recipeButtons.forEach(button => {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
        
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        button.classList.add('hover:scale-[1.02]');
    });
    
    // Hide the overlay loading state
    const recipeLoadingOverlay = document.getElementById('recipe-loading');
    if (recipeLoadingOverlay) {
        recipeLoadingOverlay.classList.add('hidden');
    }
}

function showAdviceLoading(dishName) {
    console.log('Showing advice loading for:', dishName);
    
    // Find and update the specific advice button
    const adviceButtons = document.querySelectorAll('[data-dish-name]');
    adviceButtons.forEach(button => {
        if (button.dataset.dishName === dishName && button.id.startsWith('advice-btn-')) {
            const btnText = button.querySelector('.btn-text');
            const btnLoading = button.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.classList.add('hidden');
                btnLoading.classList.remove('hidden');
            }
            
            button.disabled = true;
            button.classList.add('opacity-75', 'cursor-not-allowed');
            button.classList.remove('hover:scale-[1.02]');
        }
    });
    
    // Show general loading state for advice
    showLoading();
    
    // Update loading message
    if (loadingState) {
        const loadingText = loadingState.querySelector('span');
        if (loadingText) {
            loadingText.innerHTML = `🤔 TchopIA prépare des conseils pour <strong>${dishName}</strong>...`;
        }
    }
}

function hideAdviceLoading() {
    console.log('Hiding advice loading');
    
    // Reset all advice buttons
    const adviceButtons = document.querySelectorAll('[id^="advice-btn-"]');
    adviceButtons.forEach(button => {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
        
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        button.classList.add('hover:scale-[1.02]');
    });
    
    // Hide general loading state
    hideLoading();
}

// Original Loading Functions (Enhanced)

function showLoading() {
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '⏳ TchopIA réfléchit...';
    }
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoading() {
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🚀 Demander à TchopIA';
    }
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorState) {
        errorState.classList.remove('hidden');
    }
}

function hideError() {
    if (errorState) {
        errorState.classList.add('hidden');
    }
}

function showSuccess(message) {
    const successState = document.getElementById('success-state');
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.textContent = message;
    }
    if (successState) {
        successState.classList.remove('hidden');
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successState.classList.add('hidden');
        }, 3000);
    }
}

function hideSections() {
    if (suggestionsSection) suggestionsSection.classList.add('hidden');
    if (recipeSection) recipeSection.classList.add('hidden');
    if (adviceSection) adviceSection.classList.add('hidden');
    
    // Also hide success state when starting new operations
    const successState = document.getElementById('success-state');
    if (successState) {
        successState.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for button interactions
window.requestRecipe = requestRecipe;
window.requestAdvice = requestAdvice;
window.requestMoreAdvice = requestMoreAdvice;
window.hideSections = hideSections;
