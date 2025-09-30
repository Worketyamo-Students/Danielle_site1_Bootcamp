# 🍽️ TchopIA - Architecture & Setup Guide

## 📋 System Overview

TchopIA is an advanced AI-powered culinary assistant specializing in Cameronian cuisine, built with n8n workflow automation and modern web technologies.

### 🏗️ Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   n8n Workflows  │───▶│   AI Services   │
│   (HTML/JS)     │    │   (Automation)   │    │   (Grok-2)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Local Storage   │    │ Google Sheets    │    │ Vector Database │
│ (User Prefs)    │    │ (Main DB)        │    │ (RAG Memory)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 Core Features

### 1. **Intelligent Recipe Generation**
- **AI Brain**: Grok-2-1212 for creative and authentic recipes
- **Cameronian Expertise**: Specialized knowledge of local cuisine
- **Contextual Responses**: Considers user preferences and dietary needs

### 2. **RAG Memory System**
- **Vector Storage**: Embeddings for semantic search
- **Knowledge Base**: Growing database of culinary knowledge
- **Continuous Learning**: System improves with each interaction

### 3. **Multi-Platform Integration**
- **Google Sheets**: Primary database and logging
- **Google Drive**: Recipe backup and sharing
- **Notion**: Knowledge base management

## 🛠️ Setup Instructions

### Step 1: n8n Instance Setup

1. **Deploy n8n**:
```bash
# Using Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n

# Or using npm
npm install n8n -g
n8n start
```

2. **Configure Environment Variables**:
```env
# .env file
N8N_WEBHOOK_URL=https://your-domain.com/webhook
OPENAI_API_KEY=your_openai_key
GROK_API_KEY=your_x_ai_key
GOOGLE_SHEETS_CLIENT_ID=your_google_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_google_client_secret
NOTION_API_KEY=your_notion_integration_key
```

### Step 2: Import Workflows

1. **Main Recipe Generator**:
   - Import `recipe-ai-agent.json`
   - Configure webhook endpoint
   - Set up AI model credentials

2. **RAG Memory System**:
   - Import `rag-memory-system.json`
   - Configure vector database
   - Set up knowledge base connections

### Step 3: Database Setup

#### Google Sheets Structure

**Sheet 1: RecipeQueries**
```
| session_id | timestamp | user_query | user_preferences | status |
|------------|-----------|------------|------------------|---------|
| session_123| 2025-01-01| Ndolè recipe| {"dietary": "none"}| completed|
```

**Sheet 2: GeneratedRecipes**
```
| recipe_id | session_id | user_query | generated_recipe | generation_timestamp | feedback | rating |
|-----------|------------|------------|------------------|---------------------|----------|--------|
| recipe_456| session_123| Ndolè recipe| Full recipe text | 2025-01-01T12:00:00Z| Good!   | 5     |
```

**Sheet 3: KnowledgeBase**
```
| content_hash | query | embedding | timestamp | context |
|--------------|-------|-----------|-----------|---------|
| abc123       | Ndolè | [0.1,0.2] | 2025-01-01| {...}   |
```

#### Notion Database Structure

**Properties:**
- `title` (Title): Recipe/Knowledge name
- `content` (Rich Text): Full content
- `cuisine_type` (Select): camerounaise, african, fusion
- `relevance_score` (Number): 0.0 - 1.0
- `tags` (Multi-select): ingredients, techniques, regions

### Step 4: Frontend Configuration

1. **Update Webhook URL**:
```javascript
// In tchopia-ai.js
this.n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/recipe-generator';
```

2. **Configure Features**:
```javascript
// Feature flags
const CONFIG = {
    enableRAG: true,
    enableGoogleSheets: true,
    enableNotionIntegration: true,
    aiProvider: 'grok-2-1212'
};
```

## 🚀 Advanced Features

### 1. **Smart Suggestions System**
```javascript
// Auto-complete for Cameronian dishes
const suggestions = [
    'Ndolè aux crevettes',
    'Okok au poisson fumé',
    'Eru traditionnel',
    // ... more dishes
];
```

### 2. **User Preference Learning**
```javascript
// Adaptive preferences based on user history
{
    "dietary_restrictions": ["vegetarian", "gluten-free"],
    "preferred_proteins": ["fish", "chicken"],
    "spice_level": "medium",
    "cooking_experience": "intermediate"
}
```

### 3. **Recipe Optimization**
```javascript
// AI optimizes based on:
- Available ingredients
- Cooking time preferences
- Skill level
- Regional variations
```

## 🔧 Workflow Details

### Recipe Generation Flow
1. **User Input** → Webhook triggers n8n
2. **Input Validation** → Checks query validity
3. **RAG Search** → Retrieves relevant knowledge
4. **AI Processing** → Grok-2 generates recipe
5. **Data Storage** → Saves to multiple destinations
6. **Response** → Returns formatted recipe

### Memory System Flow
1. **Query Analysis** → Extracts semantic meaning
2. **Vector Search** → Finds similar content
3. **Knowledge Compilation** → Aggregates relevant info
4. **Context Enhancement** → Enriches AI prompt
5. **Learning Update** → Stores new knowledge

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **Query Volume**: Requests per day/hour
- **Response Quality**: User ratings and feedback
- **Knowledge Growth**: New entries in RAG system
- **User Engagement**: Session duration, repeat users

### Dashboard Creation
```sql
-- Example queries for Google Sheets/BigQuery
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_queries,
    AVG(rating) as avg_rating
FROM RecipeQueries
GROUP BY DATE(timestamp)
ORDER BY date DESC
```

## 🔒 Security & Privacy

### Data Protection
- **Session Isolation**: Each user session is separate
- **Data Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting and authentication
- **GDPR Compliance**: User data deletion capabilities

### Rate Limiting
```javascript
// Implement rate limiting
const rateLimits = {
    queriesPerMinute: 10,
    queriesPerHour: 100,
    queriesPerDay: 500
};
```

## 🎨 UI/UX Enhancements

### Responsive Design
- **Mobile-First**: Optimized for mobile cooking
- **Touch-Friendly**: Large buttons and inputs
- **Offline Support**: Cache recipes for offline viewing

### Accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for vision-impaired users

## 📱 Future Enhancements

### Phase 2 Features
1. **Voice Interface**: "Hey TchopIA, how do I make Ndolè?"
2. **Image Recognition**: Upload ingredient photos
3. **Video Tutorials**: Step-by-step cooking videos
4. **Social Features**: Share recipes with community

### Phase 3 Features
1. **AR Cooking Guide**: Augmented reality instructions
2. **IoT Integration**: Smart kitchen device control
3. **Nutritional Analysis**: Detailed health information
4. **Market Integration**: Ingredient ordering system

## 🤝 Contributing

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-org/tchopia.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Workflow Development
1. **Create Feature Branch**: `git checkout -b feature/new-workflow`
2. **Test Locally**: Use n8n desktop app for testing
3. **Export Workflow**: Save as JSON in `/n8n-workflows/`
4. **Submit PR**: Include workflow documentation

## 📞 Support

### Troubleshooting
- **Webhook Issues**: Check n8n logs and network connectivity
- **AI Responses**: Verify API keys and rate limits
- **Database Errors**: Check Google Sheets permissions

### Community
- **Discord**: Join our cooking AI community
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Contribute to this guide

---

**Built with ❤️ for Cameronian cuisine enthusiasts**