# AI Recommendations Setup

## How to Enable Real AI Recommendations

To use real AI recommendations powered by Google Gemini, follow these steps:

### 1. Get a Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Add API Key to Your Project
Create a `.env` file in the `frontend` directory and add:

```
REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Restart the Development Server
After adding the API key, restart your development server:

```bash
cd frontend
npm run dev
```

## Current Status
- **Without API Key**: The app uses smart mock recommendations that are personalized based on your profile
- **With API Key**: The app uses real AI-generated recommendations from Google Gemini

## Mock Recommendations Features
Even without an API key, you get:
- ✅ Personalized recommendations based on your profile
- ✅ Different categories (nutrition, exercise, sleep, mental health)
- ✅ Priority levels (high, medium, low)
- ✅ Realistic 2-second loading simulation
- ✅ Professional-looking interface

## Need Help?
If you want to use real AI recommendations, just provide your Gemini API key and I'll help you set it up!
