#!/bin/bash

# Demo script to test the updated n8n workflow
echo "🧪 Testing TchopIA Recipe Generator Workflow"
echo "============================================"

# Test data
WEBHOOK_URL="http://localhost:5678/webhook/24ccdc71-4b9c-43dc-b203-8d7569b24910"

echo "📝 Sending test request..."
echo ""

# Test payload with new field structure
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": "tomate, oignon, poisson fumé, huile de palme, épinards",
    "dish_name": "Ndolé traditionnel",
    "servings": 4,
    "request_id": "test_'$(date +%s)'"
  }' | jq '.'

echo ""
echo "✅ Test completed!"
echo ""
echo "🔍 Expected workflow sequence:"
echo "1. Webhook receives request with new field names"
echo "2. Extract Input processes both old and new field formats"  
echo "3. Request logged to Google Sheets"
echo "4. Enhanced AI prompt builds structured recipe request"
echo "5. ChefIA generates authentic Cameroonian recipe"
echo "6. Recipe formatted with proper structure"
echo "7. Response saved to sheets with metadata"
echo "8. Structured JSON response returned to frontend"