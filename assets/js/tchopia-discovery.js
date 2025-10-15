// TchopIA Discovery - Specialized Dish Discovery Page
// Configuration
const N8N_WEBHOOK_URL = 'https://n8n-service-apox.onrender.com/webhook/tchopia-ai';

// DOM Elements
let mobileMenuBtn, mobileMenu, discoveryForm, discoveryInput, discoverDishesBtn;
let loadingState, errorState, suggestionsSection, suggestionsGrid;

// Application state
let sessionId = null;
let currentSuggestions = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    initializeSession();
});

function initializeSession() {
    sessionId = localStorage.getItem('tchopia-session-id') || `session_${Date.now()}`;
    localStorage.setItem('tchopia-session-id', sessionId);
    console.log('TchopIA Discovery Session ID:', sessionId);
}

function initializeDOMElements() {
    // Navigation elements
    mobileMenuBtn = document.getElementById('mobile-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    
    // Form elements
    discoveryForm = document.getElementById('discovery-form');
    discoveryInput = document.getElementById('discovery-input');
    discoverDishesBtn = document.getElementById('discover-dishes-btn');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
    
    // Content sections
    suggestionsSection = document.getElementById('suggestions-section');
    suggestionsGrid = document.getElementById('suggestions-grid');
}

function setupEventListeners() {
    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Form submission
    if (discoveryForm) {
        discoveryForm.addEventListener('submit', handleDiscoveryRequest);
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

async function handleDiscoveryRequest(event) {
    event.preventDefault();
    
    const discoveryQuery = discoveryInput.value.trim();
    if (!discoveryQuery) {
        showError('Veuillez entrer vos ingrédients ou préférences.');
        return;
    }
    
    try {
        showLoading();
        hideError();
        hideSuggestionsSection();
        
        console.log('Requesting dish discovery:', { 
            query: discoveryQuery, 
            session_id: sessionId 
        });
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId,
                'User-Agent': navigator.userAgent || 'TchopIA-Discovery-Frontend'
            },
            body: JSON.stringify({
                query: discoveryQuery,
                action: 'get_suggestions', // Explicit action for suggestions
                context: {
                    timestamp: new Date().toISOString(),
                    source: 'discovery-page',
                    request_type: 'dish_discovery'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Discovery Response:', data);
        
        hideLoading();
        
        if (data.success) {
            handleSuggestionsResponse(data, discoveryQuery);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error requesting discovery:', error);
        hideLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function handleSuggestionsResponse(data, originalQuery) {
    let suggestions = data.suggestions || data.data?.suggestions || [];
    
    // Try to extract suggestions from various response formats
    if (suggestions.length === 0) {
        if (data.output) {
            const parsed = parseFromJsonString(data.output);
            suggestions = parsed?.suggestions || parsed || [];
        }
        
        // If still no suggestions, try to parse from text
        if (suggestions.length === 0 && (data.output || data.text)) {
            suggestions = parseTextToSuggestions(data.output || data.text);
        }
    }
    
    if (suggestions.length > 0) {
        currentSuggestions = suggestions;
        displaySuggestions(suggestions, originalQuery);
    } else {
        showError('Aucun plat trouvé. Essayez avec d\'autres ingrédients ou préférences.');
    }
}

function parseTextToSuggestions(text) {
    // Try to extract dish suggestions from plain text
    const suggestions = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
        if (line.includes(':') || line.includes('-')) {
            const parts = line.split(/[:|-]/);
            if (parts.length >= 2) {
                suggestions.push({
                    name: parts[0].trim(),
                    description: parts.slice(1).join(' ').trim(),
                    region: 'Cameroun'
                });
            }
        }
    }
    
    return suggestions;
}

function displaySuggestions(suggestions, originalQuery) {
    console.log('Displaying suggestions:', suggestions);
    
    // Update query display
    const suggestionsQueryDisplay = document.getElementById('suggestions-query-display');
    if (suggestionsQueryDisplay) {
        suggestionsQueryDisplay.textContent = `Plats découverts pour : "${originalQuery}"`;
    }
    
    // Create suggestions HTML
    const suggestionsHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-card bg-white rounded-xl shadow-lg p-6 border-l-4 border-bouton">
            <div class="flex items-start justify-between mb-4">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-2">
                    ${escapeHtml(suggestion.name || `Plat ${index + 1}`)}
                </h3>
                <span class="text-sm text-bouton font-bold bg-orange-50 px-3 py-1 rounded-full">
                    #${index + 1}
                </span>
            </div>
            
            <p class="font-inter text-gray-600 text-[16px] leading-relaxed mb-4">
                ${escapeHtml(suggestion.description || 'Description non disponible')}
            </p>
            
            <div class="flex flex-wrap gap-2 mb-4">
                ${suggestion.region ? `
                    <span class="ingredient-tag text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        📍 ${escapeHtml(suggestion.region)}
                    </span>
                ` : ''}
                ${suggestion.difficulty ? `
                    <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        ⚡ ${escapeHtml(suggestion.difficulty)}
                    </span>
                ` : ''}
                ${suggestion.prep_time ? `
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        ⏱️ ${escapeHtml(suggestion.prep_time)}
                    </span>
                ` : ''}
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <button 
                    onclick="requestRecipeFromDiscovery('${escapeHtml(suggestion.name)}', '${escapeHtml(suggestion.description || '')}')" 
                    class="flex-1 bg-bouton text-white font-inter font-semibold py-3 px-4 rounded-xl text-[16px] hover:bg-orange-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center"
                >
                    📖 Voir la recette
                </button>
                <button 
                    onclick="requestAdviceFromDiscovery('${escapeHtml(suggestion.name)}')" 
                    class="flex-1 bg-gray-600 text-white font-inter font-semibold py-3 px-4 rounded-xl text-[16px] hover:bg-gray-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center"
                >
                    💡 Conseils
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

function parseFromJsonString(text) {
    if (!text || typeof text !== 'string') return null;
    
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.log('JSON parsing failed:', error);
    }
    
    return null;
}

function handleErrorResponse(data) {
    const errorMessage = data.message || data.error || 'Une erreur s\'est produite lors de la recherche de plats';
    showError(errorMessage);
}

// Quick suggestion functions
function setDiscoveryQuery(query) {
    if (discoveryInput) {
        discoveryInput.value = query;
        discoveryInput.focus();
    }
}

// Action functions for discovered dishes
async function requestRecipeFromDiscovery(dishName, description = '') {
    // Redirect to recipe generation page with pre-filled data
    const recipeQuery = `Recette complète du ${dishName}`;
    const url = `./genere.html?dish=${encodeURIComponent(dishName)}&query=${encodeURIComponent(recipeQuery)}`;
    window.location.href = url;
}

async function requestAdviceFromDiscovery(dishName) {
    // Redirect to advice page with pre-filled data
    const adviceQuery = `Conseils pour bien préparer ${dishName}`;
    const url = `./conseil.html?dish=${encodeURIComponent(dishName)}&query=${encodeURIComponent(adviceQuery)}`;
    window.location.href = url;
}

function requestNewDiscovery() {
    if (discoveryInput) {
        discoveryInput.value = '';
        discoveryInput.focus();
    }
    hideSuggestionsSection();
}

// Utility functions
function showLoading() {
    if (discoverDishesBtn) {
        discoverDishesBtn.disabled = true;
        discoverDishesBtn.innerHTML = '⏳ TchopIA cherche...';
    }
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoading() {
    if (discoverDishesBtn) {
        discoverDishesBtn.disabled = false;
        discoverDishesBtn.innerHTML = '🔍 Découvrir des plats';
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

function hideSuggestionsSection() {
    if (suggestionsSection) {
        suggestionsSection.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle URL parameters (for pre-filled queries from other pages)
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const dish = urlParams.get('dish');
    
    if (query && discoveryInput) {
        discoveryInput.value = query;
    } else if (dish && discoveryInput) {
        discoveryInput.value = `Plats similaires à ${dish}`;
    }
}

// Initialize URL parameters on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(handleUrlParameters, 100);
});

// Global functions for button interactions
window.setDiscoveryQuery = setDiscoveryQuery;
window.requestRecipeFromDiscovery = requestRecipeFromDiscovery;
window.requestAdviceFromDiscovery = requestAdviceFromDiscovery;
window.requestNewDiscovery = requestNewDiscovery;