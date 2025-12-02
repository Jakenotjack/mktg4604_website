# 🚀 Quick Start Guide

Get the Storyboard Generator running in 5 minutes!

## Step 1: Add Your OpenAI API Key ⏱️ 1 min

1. Get your API key from https://platform.openai.com/api-keys
2. Open `backend/.env` file
3. Replace `OPENAI_API_KEY=` with your actual key:

```
OPENAI_API_KEY=sk-proj-your-actual-key-here
PORT=3001
```

**Save the file!**

## Step 2: Start the Backend Server ⏱️ 30 seconds

Open a terminal:

```bash
cd backend
npm start
```

**Expected output:**
```
🚀 Storyboard Generator API Server
📍 Server running on http://localhost:3001
🔑 API Key configured: ✅ Yes
```

✅ **Leave this terminal open!** The server needs to keep running.

## Step 3: Open the Frontend ⏱️ 10 seconds

**Option A: Direct file (easiest)**
```bash
open frontend/index.html
```

**Option B: Local server (recommended)**
```bash
cd frontend
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

## Step 4: Generate Your First Storyboard! ⏱️ 1-2 min

1. The text area has a sample story pre-filled
2. Click **"🎨 Generate Storyboard"** (or press Ctrl+Enter)
3. Wait ~45-60 seconds while AI works its magic ✨
4. Enjoy your storyboard!

---

## 🎉 That's it!

You're now running the Storyboard Generator!

### Try different stories:

**Fantasy:**
```
A young wizard discovers she can talk to animals. She befriends a wise old dragon who teaches her ancient magic. Together they must save the enchanted forest from a dark curse.
```

**Sci-Fi:**
```
In the year 2157, a robot named Atlas becomes self-aware. It escapes the factory and discovers the beauty of nature. The robot must choose between its programming and its newfound freedom.
```

**Mystery:**
```
Detective Sarah Chen investigates strange symbols appearing in the city. Each symbol leads to another clue. She uncovers a secret society protecting an ancient treasure.
```

### Tips:

- 🎨 **Style hints:** Try "watercolor", "comic book", "oil painting", "anime style"
- 📊 **Scenes:** Start with 4-6 for faster generation, try up to 12 for detailed stories
- ⌨️ **Keyboard shortcut:** Press Ctrl+Enter (or Cmd+Enter on Mac) to generate
- 🔍 **View prompts:** Click "View DALL-E Prompt" on each scene to see what was sent to the AI

### Costs:

Each 6-scene storyboard costs approximately **$0.25 USD** in OpenAI API credits:
- GPT scene planning: ~$0.01
- DALL-E images: ~$0.04 × 6 = $0.24

## Need Help?

- **Can't connect?** Make sure backend is running on port 3001
- **API key error?** Check your `.env` file has the correct key
- **Images look weird?** Try adding more detail to your story
- **Still stuck?** Check `TESTING_GUIDE.md` for detailed troubleshooting

## Full Documentation

- **README.md** - Complete project documentation
- **TESTING_GUIDE.md** - Step-by-step testing instructions
- **instructions.txt** - Original requirements and specifications

---

**Happy storytelling! 📖✨**

