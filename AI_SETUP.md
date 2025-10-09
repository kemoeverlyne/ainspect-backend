# AI Assistant Setup Guide

## OpenAI Integration

The AI Assistant chat now uses **OpenAI GPT-4o** with professional training examples to provide intelligent, structured responses for home inspection guidance.

### Setup Instructions

1. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure Environment Variable**
   ```bash
   # Add to your .env file in the backend directory
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

3. **Restart Backend Service**
   - Stop the backend server
   - Start it again to load the new environment variable

### How It Works

- **Professional Training**: The AI uses detailed examples of bathroom, kitchen, and electrical inspection templates as training data
- **Standards Compliance**: All responses follow ASHI and state-specific inspection standards
- **Photo Analysis**: Upload images for intelligent defect identification and guidance
- **Interactive Responses**: AI generates follow-up questions and specific recommendations

### Features

✅ **Intelligent Responses**: Uses GPT-4o for dynamic, contextual inspection guidance  
✅ **Photo Analysis**: Upload images for visual defect identification  
✅ **Standards-Based**: Follows ASHI, NY, TX, CA, FL inspection standards  
✅ **Professional Format**: Structured checklists, safety warnings, documentation tips  
✅ **Fallback Mode**: Graceful degradation if OpenAI is unavailable  

### Example Prompts

- "Kitchen inspection checklist"
- "Bathroom plumbing safety concerns"  
- "Electrical panel assessment"
- "What to look for in foundation cracks"
- Upload photo: "Analyze this inspection image"

### Cost Management

- GPT-4o responses: ~$0.01-0.02 per chat
- Vision analysis: ~$0.02-0.05 per image upload
- Monitor usage in OpenAI dashboard

The AI Assistant will provide comprehensive, professional inspection guidance that matches the quality and depth of manual responses while being intelligent and adaptable to specific user questions!
