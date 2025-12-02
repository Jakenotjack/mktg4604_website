# 📖 Storyboard Generator

An AI-powered web application that transforms stories into visual storyboards using OpenAI's GPT and DALL-E 3.

## Features

- 🤖 **AI Scene Planning**: Uses GPT-4o-mini to break down stories into visual scenes
- 🎨 **AI Image Generation**: Creates images for each scene using DALL-E 3
- 🎭 **Customizable**: Control number of scenes and art style
- 💅 **Beautiful UI**: Modern, responsive web interface
- ⚡ **Fast Processing**: Parallel image generation for speed
- 🛡️ **Error Handling**: Graceful handling of failures with detailed feedback

## Project Structure

```
project/
├── backend/               # Node.js + Express API server
│   ├── server.js         # Main server and API endpoint
│   ├── openaiClient.js   # OpenAI client initialization
│   ├── planScenes.js     # GPT scene planning logic
│   ├── generateImage.js  # DALL-E 3 image generation
│   ├── package.json      # Dependencies
│   ├── .env              # Environment variables (API key)
│   └── env.template      # Template for .env file
│
└── frontend/             # Web interface
    ├── index.html        # Main HTML page
    ├── style.css         # Styles
    └── app.js            # Frontend logic
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp env.template .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
```

### Step 3: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Storyboard Generator API Server
📍 Server running on http://localhost:3001
🔑 API Key configured: ✅ Yes
```

### Step 4: Open the Frontend

Open `frontend/index.html` in your web browser, or use a simple HTTP server:

```bash
# Option 1: Direct file
open frontend/index.html

# Option 2: Python HTTP server
cd frontend
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Usage

1. **Enter your story** in the text area (or use the sample story provided)
2. **Set number of scenes** (1-12, default: 6)
3. **Add style hint** (optional, e.g., "watercolor storybook", "comic book style")
4. **Click "Generate Storyboard"** or press Ctrl+Enter
5. **Wait 1-2 minutes** for AI to plan scenes and generate images
6. **View your storyboard** with images, titles, and captions

## API Documentation

### POST /api/storyboard

Generates a storyboard from a story.

**Request Body:**
```json
{
  "story": "Once upon a time...",
  "numScenes": 6,
  "style": "watercolor storybook"
}
```

**Response:**
```json
{
  "success": true,
  "global_style": "Children's watercolor storybook, soft pastel colors",
  "main_characters": [
    {
      "name": "Luna",
      "description": "Young girl with long brown hair, wearing a blue dress"
    }
  ],
  "scenes": [
    {
      "id": 1,
      "title": "Luna Discovers the Key",
      "short_caption": "Luna finds a glowing key in her grandmother's attic",
      "dalle_prompt": "Detailed visual description...",
      "aspect_ratio": "square",
      "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "error": null
    }
  ],
  "metadata": {
    "duration_seconds": 45.2,
    "total_scenes": 6,
    "successful_images": 6,
    "failed_images": 0
  }
}
```

## Testing

### Test Backend Components

```bash
cd backend

# Test OpenAI client connection
node testOpenAI.js

# Test scene planning
node testScenePlanning.js
```

### Test Full API Endpoint

With the server running:

```bash
curl -X POST http://localhost:3001/api/storyboard \
  -H "Content-Type: application/json" \
  -d '{
    "story": "A brave knight saves a village from a dragon.",
    "numScenes": 4,
    "style": "epic fantasy painting"
  }'
```

## Cost Estimation

Approximate OpenAI API costs per storyboard:

- **GPT-4o-mini** (scene planning): ~$0.001 - $0.01 per request
- **DALL-E 3** (image generation): ~$0.04 per image (standard quality)

Example: 6-scene storyboard ≈ $0.25 USD

## Troubleshooting

### Server won't start

**Problem:** `ERROR: OPENAI_API_KEY is not set`

**Solution:** Make sure you've created `.env` file with a valid API key

### Frontend can't connect

**Problem:** `Cannot connect to the server`

**Solution:** 
1. Check backend is running on http://localhost:3001
2. Check for CORS issues in browser console
3. Make sure both frontend and backend use the same ports

### Images fail to generate

**Problem:** Some scenes show "Image generation failed"

**Solution:**
1. Check API key has sufficient credits
2. Check rate limits aren't exceeded
3. Review DALL-E prompt for content policy violations
4. Check backend logs for detailed error messages

### Rate limiting

**Problem:** `rate limit exceeded`

**Solution:** 
- Wait a few minutes before retrying
- Reduce number of scenes
- Check your OpenAI rate limits in dashboard

## Technologies Used

- **Backend:** Node.js, Express, OpenAI SDK
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **AI Models:** GPT-4o-mini, DALL-E 3

## Future Enhancements

- [ ] Download storyboard as PDF
- [ ] Save/load storyboards
- [ ] Edit individual scene prompts
- [ ] Regenerate specific scenes
- [ ] Multiple style presets
- [ ] Support for longer stories with pagination
- [ ] User authentication and history

## License

MIT

## Credits

Built with ❤️ using OpenAI's GPT and DALL-E 3 APIs

# mktg4604_website
