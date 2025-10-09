# TchopIA AI Agent - Frontend Integration Guide

## 📦 Quick Setup

### Step 1: Import Workflows to n8n

1. **Import Main Workflow**
   - Go to n8n dashboard
   - Click "Add workflow" → "Import from File"
   - Import `tchopia-ai-workflow-enhanced.json`

2. **Import Sub-Workflows**
   - Import `suggestion_generator_enhanced.json`
   - Import `recipe_generator_enhanced.json`
   - Import `advice_generator_enhanced.json`

3. **Activate All Workflows**
   - Open each workflow
   - Click "Active" toggle in top-right
   - Ensure all 4 workflows are active

### Step 2: Get Your Webhook URL

Your API endpoint will be:
```
https://your-n8n-instance.com/webhook/tchopia-ai
```

Or for local development:
```
http://localhost:5678/webhook/tchopia-ai
```

---

## 🔌 Frontend Integration

### API Request Format

#### Option 1: General Query (Auto-Detection)
```javascript
const response = await fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': 'user-session-123' // Optional: for conversation memory
  },
  body: JSON.stringify({
    query: "J'ai du poulet, des poivrons et des oignons. Que puis-je cuisiner?"
  })
});

const data = await response.json();
```

#### Option 2: Explicit Action (When User Knows What They Want)

**For Suggestions:**
```javascript
fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Plats avec du poisson fumé",
    action: "get_suggestions"
  })
});
```

**For Recipe:**
```javascript
fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Comment préparer le Ndolé",
    action: "generate_recipe",
    context: {
      recipe_name: "Ndolé",
      description: "Plat national camerounais"
    }
  })
});
```

**For Advice:**
```javascript
fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Comment rendre mon Eru plus crémeux?",
    action: "cooking_advice"
  })
});
```

---

## 📤 Response Formats

### Suggestion Response
```json
{
  "success": true,
  "action": "get_suggestions",
  "suggestions": [
    {
      "name": "Ndolé",
      "description": "Plat national du Centre aux feuilles d'aité marinées..."
    },
    {
      "name": "Eru",
      "description": "Spécialité du Sud-Ouest aux feuilles d'eru finement..."
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "metadata": {
    "source": "TchopIA AI Assistant",
    "version": "2.0",
    "session_id": "user-session-123"
  }
}
```

### Recipe Response
```json
{
  "success": true,
  "action": "generate_recipe",
  "recipe": {
    "name": "Ndolé",
    "description": "Plat emblématique camerounais...",
    "region": "Centre",
    "difficulty": "Moyen",
    "prep_time": 30,
    "cook_time": 60,
    "total_time": 90,
    "servings": "4-6 personnes",
    "ingredients": [
      {
        "item": "Feuilles de ndolé",
        "quantity": "500g",
        "notes": "Fraîches ou congelées"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "action": "Laver et faire bouillir les feuilles...",
        "time": "15 minutes",
        "tips": "Changer l'eau 2-3 fois pour réduire l'amertume"
      }
    ],
    "tips": ["Conseil 1", "Conseil 2"],
    "cultural_notes": "Plat servi lors des grandes occasions...",
    "nutritional_highlights": "Riche en protéines et fer..."
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Advice Response
```json
{
  "success": true,
  "action": "cooking_advice",
  "advice": {
    "advice_type": "Technique",
    "main_advice": "Pour rendre votre Eru plus crémeux...",
    "quick_tips": ["Astuce 1", "Astuce 2", "Astuce 3"],
    "traditional_secrets": ["Secret 1", "Secret 2"],
    "ingredients_focus": {
      "recommended": ["Ingrédient 1"],
      "substitutes": ["Alternative 1"],
      "avoid": ["À éviter"]
    },
    "step_by_step": [
      {
        "step": 1,
        "action": "Action détaillée",
        "tip": "Conseil spécifique"
      }
    ],
    "cultural_context": "Contexte culturel...",
    "common_mistakes": ["Erreur 1 et solution"],
    "seasonal_notes": "Considérations saisonnières",
    "difficulty_level": "Intermédiaire",
    "estimated_time": "20 minutes"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "request_failed",
  "message": "Désolé, une erreur s'est produite. Veuillez réessayer.",
  "suggestions": [
    "Reformulez votre demande plus simplement",
    "Assurez-vous que votre requête est claire",
    "Réessayez dans quelques instants"
  ],
  "support": {
    "error_id": "error_1736938200000",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## 💻 Frontend Implementation Examples

### React Component Example

```javascript
import { useState } from 'react';

function TchopIAChat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const WEBHOOK_URL = 'YOUR_WEBHOOK_URL';

  const sendQuery = async (action = null) => {
    setLoading(true);
    
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': `session_${Date.now()}`
        },
        body: JSON.stringify({
          query: query,
          ...(action && { action: action })
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        success: false,
        message: 'Erreur de connexion'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tchopia-chat">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Posez votre question culinaire..."
      />
      
      {/* General Search */}
      <button onClick={() => sendQuery()}>
        Rechercher
      </button>

      {/* Specific Actions */}
      <button onClick={() => sendQuery('get_suggestions')}>
        Obtenir des suggestions
      </button>
      
      <button onClick={() => sendQuery('generate_recipe')}>
        Générer une recette
      </button>
      
      <button onClick={() => sendQuery('cooking_advice')}>
        Demander un conseil
      </button>

      {loading && <p>Chargement...</p>}

      {response && response.success && (
        <div className="response">
          {/* Render suggestions */}
          {response.suggestions && (
            <div className="suggestions">
              {response.suggestions.map((s, i) => (
                <div key={i} className="suggestion-card">
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Render recipe */}
          {response.recipe && (
            <div className="recipe">
              <h2>{response.recipe.name}</h2>
              <p>{response.recipe.description}</p>
              <div className="recipe-meta">
                <span>⏱️ {response.recipe.total_time} min</span>
                <span>👥 {response.recipe.servings}</span>
                <span>📍 {response.recipe.region}</span>
              </div>
              {/* Render ingredients and instructions */}
            </div>
          )}

          {/* Render advice */}
          {response.advice && (
            <div className="advice">
              <h3>Conseil: {response.advice.advice_type}</h3>
              <p>{response.advice.main_advice}</p>
              <ul>
                {response.advice.quick_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {response && !response.success && (
        <div className="error">
          <p>{response.message}</p>
        </div>
      )}
    </div>
  );
}

export default TchopIAChat;
```

### Vanilla JavaScript Example

```javascript
const WEBHOOK_URL = 'YOUR_WEBHOOK_URL';

async function askTchopIA(query, action = null) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        ...(action && { action: action })
      })
    });

    const data = await response.json();
    
    if (data.success) {
      displayResponse(data);
    } else {
      displayError(data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayResponse(data) {
  const container = document.getElementById('response-container');
  
  if (data.suggestions) {
    // Display suggestions
    container.innerHTML = data.suggestions.map(s => `
      <div class="suggestion">
        <h3>${s.name}</h3>
        <p>${s.description}</p>
      </div>
    `).join('');
  } else if (data.recipe) {
    // Display recipe
    container.innerHTML = `
      <h2>${data.recipe.name}</h2>
      <p>${data.recipe.description}</p>
      <!-- Add more recipe details -->
    `;
  } else if (data.advice) {
    // Display advice
    container.innerHTML = `
      <h3>${data.advice.advice_type}</h3>
      <p>${data.advice.main_advice}</p>
      <ul>${data.advice.quick_tips.map(t => `<li>${t}</li>`).join('')}</ul>
    `;
  }
}

// Usage
document.getElementById('search-btn').addEventListener('click', () => {
  const query = document.getElementById('query-input').value;
  askTchopIA(query);
});

document.getElementById('suggestions-btn').addEventListener('click', () => {
  const query = document.getElementById('query-input').value;
  askTchopIA(query, 'get_suggestions');
});
```

---

## 🎯 Action Parameters Guide

| Action | When to Use | Example Query |
|--------|-------------|---------------|
| `null` (auto-detect) | General search, unclear intent | "Plats pour le weekend" |
| `get_suggestions` | User wants dish ideas | "Suggère des plats avec du poisson" |
| `generate_recipe` | User wants cooking instructions | "Comment faire le Koki?" |
| `cooking_advice` | User needs help/tips | "Comment éviter que mon Eru soit amer?" |

---

## 🔧 Advanced Features

### Session Management
```javascript
// Generate or retrieve session ID
const sessionId = localStorage.getItem('tchopia-session') || 
                  `session_${Date.now()}`;
localStorage.setItem('tchopia-session', sessionId);

// Include in requests
fetch(WEBHOOK_URL, {
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId
  },
  body: JSON.stringify({ query: '...' })
});
```

### Loading States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      setError(data.message || 'Une erreur est survenue');
    } else {
      setResponse(data);
    }
  } catch (err) {
    setError('Impossible de contacter TchopIA. Réessayez plus tard.');
  } finally {
    setLoading(false);
  }
};
```

### Response Caching (Optional)
```javascript
const cache = new Map();

async function getCachedResponse(query, action) {
  const cacheKey = `${action || 'auto'}_${query}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await askTchopIA(query, action);
  cache.set(cacheKey, response);
  
  return response;
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure webhook has `allowedOrigins: "*"` in n8n
- Or set specific domains: `allowedOrigins: "https://yoursite.com"`

**2. Empty Responses**
- Check that all 4 workflows are active in n8n
- Verify webhook URL is correct
- Check n8n execution logs for errors

**3. Slow Responses**
- AI generation takes 3-10 seconds
- Show loading indicator to users
- Consider implementing timeout (30s recommended)

**4. Parse Errors**
- Workflows include fallback parsing
- Check response structure matches expected format
- Report persistent issues to backend team

---

## 📊 Testing

### Test Requests

```bash
# Test general query
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "Plats camerounais avec du poisson"}'

# Test suggestions
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "Quoi cuisiner ce soir?", "action": "get_suggestions"}'

# Test recipe generation
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "Recette du Ndolé", "action": "generate_recipe"}'

# Test advice
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "Comment améliorer mon Eru?", "action": "cooking_advice"}'
```

---

## 🚀 Deployment Checklist

- [ ] All 4 workflows imported to n8n
- [ ] All workflows activated
- [ ] Webhook URL configured in frontend
- [ ] CORS settings configured
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Session management (optional)
- [ ] Response rendering tested
- [ ] Mobile responsiveness checked

---

## 📞 Support

For issues or questions:
1. Check n8n execution logs
2. Verify request/response format
3. Test with curl commands above
4. Contact backend team with error details

---

## 🎉 You're Ready!

Your TchopIA AI assistant is now integrated and ready to help users discover and cook amazing Cameroon dishes!

**Next Steps:**
1. Test all three action types
2. Implement UI for displaying responses
3. Add user feedback mechanisms
4. Monitor usage and performance

Happy cooking! 👨‍🍳🇨🇲