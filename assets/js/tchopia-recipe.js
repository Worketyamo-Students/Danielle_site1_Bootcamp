// TchopIA Recipe Generator - Specialized Recipe Generation Page
// Configuration
const N8N_WEBHOOK_URL = 'https://n8n-service-apox.onrender.com/webhook/tchopia-ai';

// DOM Elements
let mobileMenuBtn, mobileMenu, recipeForm, recipeInput, generateRecipeBtn;
let loadingState, errorState, recipeSection, recipeContent;
let includeTips, includeVariations, includeHistory;

// Application state
let sessionId = null;
let currentRecipeData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    initializeSession();
    handleUrlParameters();
});

function initializeSession() {
    sessionId = localStorage.getItem('tchopia-session-id') || `session_${Date.now()}`;
    localStorage.setItem('tchopia-session-id', sessionId);
    console.log('TchopIA Recipe Session ID:', sessionId);
}

function initializeDOMElements() {
    // Navigation elements
    mobileMenuBtn = document.getElementById('mobile-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    
    // Form elements
    recipeForm = document.getElementById('recipe-form');
    recipeInput = document.getElementById('recipe-input');
    generateRecipeBtn = document.getElementById('generate-recipe-btn');
    
    // Preference checkboxes
    includeTips = document.getElementById('include-tips');
    includeVariations = document.getElementById('include-variations');
    includeHistory = document.getElementById('include-history');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
    
    // Content sections
    recipeSection = document.getElementById('recipe-section');
    recipeContent = document.getElementById('recipe-content');
}

function setupEventListeners() {
    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Form submission
    if (recipeForm) {
        recipeForm.addEventListener('submit', handleRecipeRequest);
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

async function handleRecipeRequest(event) {
    event.preventDefault();
    
    const recipeQuery = recipeInput.value.trim();
    if (!recipeQuery) {
        showError('Veuillez entrer le nom du plat ou votre demande de recette.');
        return;
    }
    
    // Build enhanced query with preferences
    let enhancedQuery = recipeQuery;
    const preferences = [];
    
    if (includeTips && includeTips.checked) {
        preferences.push('inclure des astuces de chef');
    }
    if (includeVariations && includeVariations.checked) {
        preferences.push('inclure des variantes du plat');
    }
    if (includeHistory && includeHistory.checked) {
        preferences.push('inclure l\'histoire et le contexte culturel');
    }
    
    if (preferences.length > 0) {
        enhancedQuery += `. Veuillez ${preferences.join(', ')}.`;
    }
    
    try {
        showLoading();
        hideError();
        hideRecipeSection();
        
        console.log('Requesting recipe generation:', { 
            query: enhancedQuery, 
            session_id: sessionId 
        });
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId,
                'User-Agent': navigator.userAgent || 'TchopIA-Recipe-Frontend'
            },
            body: JSON.stringify({
                query: enhancedQuery,
                action: 'generate_recipe', // Explicit action for recipe generation
                context: {
                    timestamp: new Date().toISOString(),
                    source: 'recipe-page',
                    request_type: 'recipe_generation',
                    preferences: {
                        include_tips: includeTips?.checked || false,
                        include_variations: includeVariations?.checked || false,
                        include_history: includeHistory?.checked || false
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Recipe Response:', data);
        
        hideLoading();
        
        if (data.success) {
            handleRecipeResponse(data, recipeQuery);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error requesting recipe:', error);
        hideLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function handleRecipeResponse(data, originalQuery) {
    let recipe = data.recipe || data.data?.recipe;
    
    // Try to extract recipe from various response formats
    if (!recipe && data.output) {
        const parsed = parseFromJsonString(data.output);
        recipe = parsed?.recipe || parsed;
    }
    
    // Fallback: create recipe from text response
    if (!recipe && (data.output || data.text || data.message)) {
        const textContent = data.output || data.text || data.message;
        recipe = parseTextToRecipe(textContent, originalQuery);
    }
    
    if (recipe) {
        currentRecipeData = recipe;
        displayRecipe(recipe, originalQuery);
    } else {
        showError('Impossible de générer la recette. Veuillez reformuler votre demande.');
    }
}

function parseTextToRecipe(text, dishName) {
    // Try to extract recipe information from plain text
    const lines = text.split('\n').filter(line => line.trim());
    
    const recipe = {
        name: dishName,
        description: '',
        ingredients: [],
        instructions: [],
        tips: [],
        prep_time: null,
        cook_time: null,
        servings: null
    };
    
    let currentSection = '';
    
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('ingrédient') || lowerLine.includes('ingredient')) {
            currentSection = 'ingredients';
        } else if (lowerLine.includes('instruction') || lowerLine.includes('étape') || lowerLine.includes('préparation')) {
            currentSection = 'instructions';
        } else if (lowerLine.includes('conseil') || lowerLine.includes('astuce') || lowerLine.includes('tip')) {
            currentSection = 'tips';
        } else if (line.trim() && currentSection) {
            recipe[currentSection].push(line.trim());
        } else if (!recipe.description && line.trim().length > 20) {
            recipe.description = line.trim();
        }
    }
    
    return recipe;
}

function displayRecipe(recipe, originalQuery) {
    console.log('Displaying recipe:', recipe);
    
    // Update query display
    const recipeQueryDisplay = document.getElementById('recipe-query-display');
    if (recipeQueryDisplay) {
        recipeQueryDisplay.textContent = `Recette pour : "${originalQuery}"`;
    }
    
    // Create recipe HTML
    const recipeHTML = `
        <div class="mb-8">
            <div class="text-center mb-6">
                <h3 class="font-inter font-bold text-[28px] sm:text-[32px] text-gray-800 mb-3">
                    ${escapeHtml(recipe.name || 'Recette Camerounaise')}
                </h3>
                ${recipe.description ? `
                    <p class="font-inter text-gray-600 text-[16px] sm:text-[18px] max-w-2xl mx-auto leading-relaxed">
                        ${escapeHtml(recipe.description)}
                    </p>
                ` : ''}
                ${recipe.region ? `<p class="text-sm text-bouton mt-2 font-medium">📍 Région: ${escapeHtml(recipe.region)}</p>` : ''}
            </div>
        </div>
        
        <div class="grid lg:grid-cols-3 gap-8 mb-8">
            <!-- Recipe Information Panel -->
            <div class="lg:col-span-1">
                <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 sticky top-4">
                    <h4 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        ⏱️ Informations
                    </h4>
                    <div class="space-y-3">
                        ${recipe.prep_time ? `
                            <div class="flex items-center">
                                <span class="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                                <span class="text-sm"><strong>Préparation:</strong> ${recipe.prep_time} min</span>
                            </div>
                        ` : ''}
                        ${recipe.cook_time ? `
                            <div class="flex items-center">
                                <span class="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                                <span class="text-sm"><strong>Cuisson:</strong> ${recipe.cook_time} min</span>
                            </div>
                        ` : ''}
                        ${recipe.total_time ? `
                            <div class="flex items-center">
                                <span class="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                                <span class="text-sm"><strong>Total:</strong> ${recipe.total_time} min</span>
                            </div>
                        ` : ''}
                        ${recipe.servings ? `
                            <div class="flex items-center">
                                <span class="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                                <span class="text-sm"><strong>Portions:</strong> ${escapeHtml(recipe.servings)}</span>
                            </div>
                        ` : ''}
                        ${recipe.difficulty ? `
                            <div class="flex items-center">
                                <span class="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                                <span class="text-sm"><strong>Difficulté:</strong> ${escapeHtml(recipe.difficulty)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Main Recipe Content -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Ingredients Section -->
                ${recipe.ingredients && recipe.ingredients.length > 0 ? `
                    <div class="recipe-section">
                        <h4 class="font-inter font-semibold text-[22px] text-gray-800 mb-6 flex items-center">
                            🥘 Ingrédients
                        </h4>
                        <div class="space-y-3">
                            ${recipe.ingredients.map(ingredient => {
                                if (typeof ingredient === 'string') {
                                    return `
                                        <div class="ingredient-item p-4 rounded-lg">
                                            <span class="text-gray-700 font-medium">${escapeHtml(ingredient)}</span>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="ingredient-item p-4 rounded-lg">
                                            <span class="text-bouton font-semibold">${escapeHtml(ingredient.quantity || '')}</span>
                                            <span class="text-gray-700 ml-2">${escapeHtml(ingredient.item || ingredient.name || '')}</span>
                                        </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Instructions Section -->
                ${recipe.instructions && recipe.instructions.length > 0 ? `
                    <div class="recipe-section">
                        <h4 class="font-inter font-semibold text-[22px] text-gray-800 mb-6 flex items-center">
                            👨‍🍳 Instructions
                        </h4>
                        <div class="space-y-4">
                            ${recipe.instructions.map((instruction, index) => {
                                if (typeof instruction === 'string') {
                                    return `
                                        <div class="instruction-step p-4 rounded-lg">
                                            <div class="flex items-start">
                                                <span class="bg-bouton text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                                                    ${index + 1}
                                                </span>
                                                <div class="flex-1">
                                                    <p class="text-gray-700 font-medium leading-relaxed">${escapeHtml(instruction)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="instruction-step p-4 rounded-lg">
                                            <div class="flex items-start">
                                                <span class="bg-bouton text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                                                    ${instruction.step || index + 1}
                                                </span>
                                                <div class="flex-1">
                                                    <p class="text-gray-700 font-medium leading-relaxed mb-2">${escapeHtml(instruction.action || instruction.description || '')}</p>
                                                    ${instruction.tips ? `<p class="text-sm text-gray-600 italic">💡 ${escapeHtml(instruction.tips)}</p>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Additional Sections -->
        <div class="grid md:grid-cols-2 gap-8">
            <!-- Tips Section -->
            ${recipe.tips && recipe.tips.length > 0 ? `
                <div class="recipe-section">
                    <h4 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        💡 Conseils de Chef
                    </h4>
                    <div class="space-y-3">
                        ${recipe.tips.map(tip => `
                            <div class="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                                <p class="text-gray-700"><span class="text-green-600 mr-2 font-bold">✓</span>${escapeHtml(tip)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Variations Section -->
            ${recipe.variations && recipe.variations.length > 0 ? `
                <div class="recipe-section">
                    <h4 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                        🔄 Variantes
                    </h4>
                    <div class="space-y-3">
                        ${recipe.variations.map(variation => `
                            <div class="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
                                <p class="text-gray-700">${escapeHtml(variation)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <!-- Cultural Notes -->
        ${recipe.cultural_notes || recipe.history ? `
            <div class="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    🏛️ Notes Culturelles & Histoire
                </h4>
                <p class="text-gray-700 leading-relaxed">${escapeHtml(recipe.cultural_notes || recipe.history)}</p>
            </div>
        ` : ''}
    `;
    
    // Update recipe content
    if (recipeContent) {
        recipeContent.innerHTML = recipeHTML;
    }
    
    // Show recipe section
    if (recipeSection) {
        recipeSection.classList.remove('hidden');
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
    const errorMessage = data.message || data.error || 'Une erreur s\'est produite lors de la génération de la recette';
    showError(errorMessage);
}

// Quick suggestion functions
function setRecipeQuery(query) {
    if (recipeInput) {
        recipeInput.value = query;
        recipeInput.focus();
    }
}

// Action functions
function generateNewRecipe() {
    if (recipeInput) {
        recipeInput.value = '';
        recipeInput.focus();
    }
    hideRecipeSection();
}

function saveRecipe() {
    if (currentRecipeData) {
        const recipeText = JSON.stringify(currentRecipeData, null, 2);
        const blob = new Blob([recipeText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `recette_${currentRecipeData.name || 'tchopia'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Recette sauvegardée !');
    }
}

function shareRecipe() {
    if (currentRecipeData && navigator.share) {
        const shareData = {
            title: `Recette: ${currentRecipeData.name}`,
            text: currentRecipeData.description || 'Recette camerounaise',
            url: window.location.href
        };
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        const recipeText = currentRecipeData?.name || 'Recette TchopIA';
        navigator.clipboard.writeText(recipeText).then(() => {
            alert('Recette copiée dans le presse-papiers !');
        });
    }
}

function printRecipe() {
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    const recipeHTML = recipeContent?.innerHTML || '';
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Recette: ${currentRecipeData?.name || 'TchopIA'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .ingredient-item, .instruction-step { 
                    background: #f9f9f9 !important; 
                    border-left: 4px solid #BA5E0D; 
                    margin-bottom: 8px; 
                }
                .bg-bouton { background: #BA5E0D; color: white; }
                .text-bouton { color: #BA5E0D; }
                .rounded-full { border-radius: 50%; }
                .grid { display: block; }
                .lg\\:col-span-2, .lg\\:col-span-1 { width: 100%; }
                @media print {
                    .sticky { position: static !important; }
                }
            </style>
        </head>
        <body>
            <h1>Recette TchopIA</h1>
            ${recipeHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function requestAdviceForRecipe() {
    if (currentRecipeData) {
        const adviceQuery = `Conseils pour bien préparer ${currentRecipeData.name}`;
        const url = `./conseil.html?dish=${encodeURIComponent(currentRecipeData.name)}&query=${encodeURIComponent(adviceQuery)}`;
        window.location.href = url;
    }
}

// Handle URL parameters (for pre-filled queries from other pages)
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const dish = urlParams.get('dish');
    
    if (query && recipeInput) {
        recipeInput.value = query;
    } else if (dish && recipeInput) {
        recipeInput.value = `Recette complète du ${dish}`;
    }
}

// Utility functions
function showLoading() {
    if (generateRecipeBtn) {
        generateRecipeBtn.disabled = true;
        generateRecipeBtn.innerHTML = '⏳ TchopIA prépare...';
    }
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoading() {
    if (generateRecipeBtn) {
        generateRecipeBtn.disabled = false;
        generateRecipeBtn.innerHTML = '📖 Générer la recette complète';
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

function hideRecipeSection() {
    if (recipeSection) {
        recipeSection.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for button interactions
window.setRecipeQuery = setRecipeQuery;
window.generateNewRecipe = generateNewRecipe;
window.saveRecipe = saveRecipe;
window.shareRecipe = shareRecipe;
window.printRecipe = printRecipe;
window.requestAdviceForRecipe = requestAdviceForRecipe;