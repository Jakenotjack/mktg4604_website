# Testing Guide

This guide will help you test the Storyboard Generator application step by step.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] OpenAI API key added to `backend/.env`
- [ ] Backend server can start without errors

## Phase 1: Backend Component Tests

### Test 1: OpenAI Client Connection

**Purpose:** Verify OpenAI API key is valid and client can connect

```bash
cd backend
node testOpenAI.js
```

**Expected Output:**
```
=== Testing OpenAI Client ===

✅ OpenAI client initialized successfully
API Key: sk-proj-...

Testing API connection with simple completion...
✅ API call successful!
Response: Hello, OpenAI!

=== All tests passed! ===
```

**If it fails:**
- Check API key is correct in `.env`
- Verify API key has credits
- Check internet connection

---

### Test 2: Scene Planning with GPT

**Purpose:** Verify GPT can generate structured scene descriptions

```bash
cd backend
node testScenePlanning.js
```

**Expected Output:**
```
=== Testing Scene Planning ===

📝 Planning 6 scenes for story (... chars)...
✅ Generated 6 scenes
🎨 Style: Children's watercolor storybook, soft pastel colors...

=== Generated Plan ===
Global Style: ...

Main Characters:
  - Luna: ...

Scenes:
Scene 1: Luna Discovers the Key
  Caption: ...
  Aspect Ratio: square
  DALL-E Prompt: ...

...

✅ Scene planning test passed!
```

**If it fails:**
- Check GPT model availability
- Review error message for details
- Verify JSON parsing is working

---

### Test 3: Full Server Startup

**Purpose:** Verify Express server starts correctly

```bash
cd backend
node server.js
```

**Expected Output:**
```
============================================================
🚀 Storyboard Generator API Server
📍 Server running on http://localhost:3001
🔑 API Key configured: ✅ Yes
============================================================
```

**Keep this terminal open** - the server needs to run for the next tests.

**If it fails:**
- Check port 3001 is not in use
- Verify all dependencies installed
- Check `.env` file exists

---

## Phase 2: API Endpoint Tests

### Test 4: Health Check

**Purpose:** Verify server is responding

Open a **new terminal** and run:

```bash
curl http://localhost:3001/
```

**Expected Output:**
```json
{
  "status": "ok",
  "message": "Storyboard Generator API",
  "endpoints": {
    "storyboard": "POST /api/storyboard"
  }
}
```

---

### Test 5: Simple Storyboard Generation

**Purpose:** Test complete storyboard generation flow

```bash
curl -X POST http://localhost:3001/api/storyboard \
  -H "Content-Type: application/json" \
  -d '{
    "story": "A brave knight named Sir Roland discovers a sleeping dragon in a cave. He befriends the dragon instead of fighting it. Together they protect the kingdom from invaders. The kingdom celebrates their unlikely friendship.",
    "numScenes": 4,
    "style": "epic fantasy digital painting"
  }'
```

**Expected:** Long JSON response with:
- `success: true`
- `global_style` field
- Array of 4 scenes
- Each scene has `image_url` (unless generation failed)
- Metadata with timing

**This will take 1-2 minutes** as DALL-E generates 4 images.

Watch the backend terminal for progress logs:
```
====================================================================
📖 New storyboard request received
   Story length: 218 characters
   Number of scenes: 4
   Style: epic fantasy digital painting
====================================================================

🤖 Step 1: Planning scenes with GPT...
📝 Planning 4 scenes for story (218 chars)...
✅ Generated 4 scenes
🎨 Style: Epic fantasy digital painting...

🎨 Step 2: Generating images with DALL-E 3...
🖼️  Generating 4 images in parallel...
🎨 Generating image for Scene 1: ...
...
✅ Image generated successfully
...

====================================================================
✅ Storyboard complete in 45.2s
   4/4 images generated successfully
====================================================================
```

---

### Test 6: Error Handling - Invalid Input

**Purpose:** Test API validates input correctly

```bash
# Test 1: Missing story
curl -X POST http://localhost:3001/api/storyboard \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 error with "Missing or invalid 'story' field"

# Test 2: Story too short
curl -X POST http://localhost:3001/api/storyboard \
  -H "Content-Type: application/json" \
  -d '{"story": "Hi"}'

# Expected: 400 error with "Story is too short"

# Test 3: Invalid numScenes
curl -X POST http://localhost:3001/api/storyboard \
  -H "Content-Type: application/json" \
  -d '{"story": "A long story...", "numScenes": 20}'

# Expected: 400 error with "numScenes must be between 1 and 12"
```

---

## Phase 3: Frontend Tests

### Test 7: Frontend Opens

**Purpose:** Verify HTML/CSS/JS loads correctly

```bash
# Option 1: Direct file open
open frontend/index.html

# Option 2: Local server (recommended)
cd frontend
python3 -m http.server 8000
# Then open http://localhost:8000 in browser
```

**Expected:**
- Page loads with purple gradient background
- Header: "📖 Storyboard Generator"
- Text area with sample story pre-filled
- Number of scenes input (default: 6)
- Style input (empty)
- Blue "Generate Storyboard" button

**Check browser console** (F12) for errors.

---

### Test 8: UI Interactions

**Purpose:** Test frontend works without backend

1. **Clear the text area** → Button should become disabled
2. **Type short text** (< 10 chars) → Button stays disabled
3. **Type longer text** → Button becomes enabled
4. **Click Generate** → Shows loading spinner
5. **After ~2 seconds** → Should show error "Cannot connect to the server" (if backend not running)

This is expected! It means frontend validation and error handling works.

---

### Test 9: End-to-End Integration

**Purpose:** Full user flow from story to storyboard

**Prerequisites:**
- Backend server running (http://localhost:3001)
- Frontend open in browser

**Steps:**

1. **Use the sample story** (already filled in) or paste your own
2. **Set scenes to 4** (faster for testing)
3. **Add style:** "children's storybook watercolor"
4. **Click "Generate Storyboard"** (or press Ctrl+Enter)

**Expected Flow:**

1. **Loading screen appears** (~3 seconds)
   - Shows spinner
   - Message: "Creating your storyboard..."
   - "This may take 1-2 minutes"

2. **Backend processes** (watch terminal logs)
   - Scene planning completes (~5 seconds)
   - Image generation starts
   - Images generate in parallel (~30-60 seconds)

3. **Results display**
   - Header: "✨ Your Storyboard"
   - Global style shown
   - Metadata: timing and success count
   - Grid of 4 scene cards
   - Each card shows:
     - Scene number badge
     - Title
     - Caption
     - Generated image
     - Expandable prompt details

4. **Verify Images**
   - All images should load
   - Click to expand prompts
   - Check images match story

**If any images fail:**
- Check backend logs for specific errors
- Verify DALL-E content policy wasn't violated
- Check API rate limits

---

### Test 10: Different Scenarios

Test various inputs:

**Test Case 1: Short Story, Few Scenes**
```
Story: "A cat finds a magic hat and becomes invisible."
Scenes: 3
Style: "cartoon comic book"
```

**Test Case 2: Long Story, Many Scenes**
```
Story: [Paste a longer story, 500+ words]
Scenes: 10
Style: "realistic oil painting"
```

**Test Case 3: No Style Specified**
```
Story: "A robot learns to paint beautiful landscapes."
Scenes: 6
Style: [leave empty]
```

**Expected:** AI chooses appropriate style automatically

---

## Verification Checklist

After all tests, verify:

- [x] ✅ Backend starts without errors
- [x] ✅ OpenAI client connects successfully
- [x] ✅ GPT generates valid scene plans
- [x] ✅ DALL-E generates images
- [x] ✅ API endpoint returns correct JSON
- [x] ✅ Error cases handled gracefully
- [x] ✅ Frontend loads and displays correctly
- [x] ✅ Frontend shows loading states
- [x] ✅ Frontend displays errors appropriately
- [x] ✅ End-to-end flow works (story → images)
- [x] ✅ Images match story content
- [x] ✅ Multiple scenarios work

## Common Issues and Solutions

### Issue: "Command not found: node"
**Solution:** Install Node.js from https://nodejs.org

### Issue: "Cannot find module 'openai'"
**Solution:** Run `npm install` in backend directory

### Issue: Rate limit errors
**Solution:** 
- Wait a few minutes
- Reduce number of scenes
- Check OpenAI dashboard for limits

### Issue: Images look wrong
**Solution:**
- Check scene prompts (click "View DALL-E Prompt")
- Try different style hints
- GPT might need better story structure

### Issue: Server crashes
**Solution:**
- Check logs for stack trace
- Verify API key is valid
- Check for OOM (out of memory) issues

## Performance Expectations

**Scene Planning (GPT):** 3-10 seconds
**Image Generation (DALL-E):** 
- 1 scene: ~10-15 seconds
- 6 scenes: ~30-60 seconds (parallel)
- 12 scenes: ~60-120 seconds (parallel)

**Total Time for 6-scene storyboard:** ~45-75 seconds

## Next Steps

After successful testing:

1. ✅ Application is ready to use!
2. Try different stories and styles
3. Share with others (they'll need their own API key)
4. Consider enhancements from README

## Need Help?

Check the logs:
- **Backend logs:** In the terminal running `node server.js`
- **Frontend logs:** Browser console (F12)

Both provide detailed debugging information.

