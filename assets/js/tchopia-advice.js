// TchopIA Advice - Specialized Cooking Advice Page
// Configuration
const N8N_WEBHOOK_URL = 'https://n8n-service-apox.onrender.com/webhook/tchopia-ai';

// DOM Elements
let mobileMenuBtn, mobileMenu, adviceForm, adviceInput, getAdviceBtn;
let loadingState, errorState, adviceSection, adviceContent;

// Application state
let sessionId = null;
let currentAdviceData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    initializeSession();
});

function initializeSession() {
    sessionId = localStorage.getItem('tchopia-session-id') || `session_${Date.now()}`;
    localStorage.setItem('tchopia-session-id', sessionId);
    console.log('TchopIA Advice Session ID:', sessionId);
}

function initializeDOMElements() {
    // Navigation elements
    mobileMenuBtn = document.getElementById('mobile-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    
    // Form elements
    adviceForm = document.getElementById('advice-form');
    adviceInput = document.getElementById('advice-input');
    getAdviceBtn = document.getElementById('get-advice-btn');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
    
    // Content sections
    adviceSection = document.getElementById('advice-section');
    adviceContent = document.getElementById('advice-content');
}

function setupEventListeners() {
    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Form submission
    if (adviceForm) {
        adviceForm.addEventListener('submit', handleAdviceRequest);
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

async function handleAdviceRequest(event) {
    event.preventDefault();
    
    const adviceQuery = adviceInput.value.trim();
    if (!adviceQuery) {
        showError('Veuillez entrer votre question ou demande de conseil.');
        return;
    }
    
    try {
        showLoading();
        hideError();
        hideAdviceSection();
        
        console.log('Requesting cooking advice:', { 
            query: adviceQuery, 
            session_id: sessionId 
        });
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId,
                'User-Agent': navigator.userAgent || 'TchopIA-Advice-Frontend'
            },
            body: JSON.stringify({
                query: adviceQuery,
                action: 'cooking_advice', // Explicit action for advice
                context: {
                    timestamp: new Date().toISOString(),
                    source: 'advice-page',
                    request_type: 'cooking_advice'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Advice Response:', data);
        
        hideLoading();
        
        if (data.success) {
            handleAdviceResponse(data, adviceQuery);
        } else {
            handleErrorResponse(data);
        }
        
    } catch (error) {
        console.error('Error requesting advice:', error);
        hideLoading();
        showError('Erreur de connexion. Vérifiez que votre serveur n8n est en cours d\'exécution.');
    }
}

function handleAdviceResponse(data, originalQuery) {
    let advice = data.advice || data.data?.advice;
    
    // Try to extract advice from various response formats
    if (!advice && data.output) {
        const parsed = parseFromJsonString(data.output);
        advice = parsed?.advice || parsed;
    }
    
    // Fallback: create advice from text response
    if (!advice && (data.output || data.text || data.message)) {
        const textContent = data.output || data.text || data.message;
        advice = {
            advice_type: 'Conseil Général',
            main_advice: textContent,
            quick_tips: [],
            traditional_secrets: [],
            step_by_step: [],
            common_mistakes: [],
            cultural_context: ''
        };
    }
    
    if (advice) {
        currentAdviceData = advice;
        displayAdvice(advice, originalQuery);
    } else {
        showError('Impossible de générer des conseils. Veuillez reformuler votre demande.');
    }
}

function displayAdvice(advice, originalQuery) {
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
                <span class="bg-bouton text-white px-4 py-2 rounded-full text-sm font-semibold mr-3">
                    ${escapeHtml(advice.advice_type || 'Conseil Culinaire')}
                </span>
                ${advice.difficulty_level ? `
                    <span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                        ${escapeHtml(advice.difficulty_level)}
                    </span>
                ` : ''}
            </div>
        </div>
        
        <div class="mb-8">
            <h3 class="font-inter font-semibold text-[22px] text-gray-800 mb-4 flex items-center">
                💡 Conseil Principal
            </h3>
            <div class="bg-orange-50 border-l-4 border-bouton p-6 rounded-lg">
                <p class="text-gray-700 leading-relaxed text-[16px]">${escapeHtml(advice.main_advice || advice.content || 'Conseil non disponible')}</p>
            </div>
        </div>
        
        ${advice.quick_tips && advice.quick_tips.length > 0 ? `
            <div class="mb-8">
                <h3 class="font-inter font-semibold text-[20px] text-gray-800 mb-4 flex items-center">
                    ⚡ Astuces Rapides
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                    ${advice.quick_tips.map(tip => `
                        <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                            <p class="text-gray-700"><span class="text-bouton mr-2 font-bold">✓</span>${escapeHtml(tip)}</p>
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
                        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <p class="text-gray-700"><span class="text-yellow-600 mr-2 text-xl">🌟</span>${escapeHtml(secret)}</p>
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
                            <span class="bg-bouton text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-4 mt-1 font-semibold">
                                ${step.step || index + 1}
                            </span>
                            <div class="flex-1">
                                <p class="text-gray-700 mb-1 font-medium">${escapeHtml(step.action || step.description || '')}</p>
                                ${step.tip ? `<p class="text-sm text-gray-600 italic"><em>💡 ${escapeHtml(step.tip)}</em></p>` : ''}
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
                        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <p class="text-gray-700"><span class="text-red-600 mr-2 font-bold text-lg">❌</span>${escapeHtml(mistake)}</p>
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
                <div class="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                    <p class="text-gray-700 leading-relaxed">${escapeHtml(advice.cultural_context)}</p>
                </div>
            </div>
        ` : ''}
    `;
    
    // Update advice content
    if (adviceContent) {
        adviceContent.innerHTML = adviceHTML;
    }
    
    // Show advice section
    if (adviceSection) {
        adviceSection.classList.remove('hidden');
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
    const errorMessage = data.message || data.error || 'Une erreur s\'est produite lors de la génération des conseils';
    showError(errorMessage);
}

// Quick suggestion functions
function setAdviceQuery(query) {
    if (adviceInput) {
        adviceInput.value = query;
        adviceInput.focus();
    }
}

// Action functions
async function requestNewAdvice() {
    if (adviceInput) {
        adviceInput.value = '';
        adviceInput.focus();
    }
    hideAdviceSection();
}

function shareAdvice() {
    if (currentAdviceData && navigator.share) {
        const shareData = {
            title: 'Conseils Culinaires TchopIA',
            text: currentAdviceData.main_advice || 'Conseils culinaires',
            url: window.location.href
        };
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        const adviceText = currentAdviceData?.main_advice || 'Conseils culinaires TchopIA';
        navigator.clipboard.writeText(adviceText).then(() => {
            alert('Conseils copiés dans le presse-papiers !');
        });
    }
}

function printAdvice() {
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    const adviceHTML = adviceContent?.innerHTML || '';
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Conseils Culinaires TchopIA</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .bg-orange-50, .bg-yellow-50, .bg-red-50, .bg-blue-50 { background: #f9f9f9 !important; }
                .border-l-4 { border-left: 4px solid #BA5E0D; }
                .text-bouton { color: #BA5E0D; }
                .rounded-full { background: #BA5E0D; color: white; padding: 4px 8px; }
            </style>
        </head>
        <body>
            <h1>Conseils Culinaires TchopIA</h1>
            ${adviceHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Utility functions
function showLoading() {
    if (getAdviceBtn) {
        getAdviceBtn.disabled = true;
        getAdviceBtn.innerHTML = '⏳ TchopIA réfléchit...';
    }
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoading() {
    if (getAdviceBtn) {
        getAdviceBtn.disabled = false;
        getAdviceBtn.innerHTML = '💡 Obtenir des conseils d\'expert';
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

function hideAdviceSection() {
    if (adviceSection) {
        adviceSection.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for button interactions
window.setAdviceQuery = setAdviceQuery;
window.requestNewAdvice = requestNewAdvice;
window.shareAdvice = shareAdvice;
window.printAdvice = printAdvice;