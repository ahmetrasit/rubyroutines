# Ruby Routines - Quick Start Guide

## For New Development Sessions

If starting a new Claude Code session, use this guide to quickly resume development.

---

## 📁 Project Structure

```
/docs
  /stages          # Stage 1-6 detailed guides with copy-paste prompts
  plan.md          # Complete development plan
  SETUP.md         # Local environment setup
  
/prisma
  README.md        # Database schema reference
  
README.md          # Project overview
QUICKSTART.md      # This file
```

---

## 🎯 Current Progress

Check completed stages in `/docs/plan.md`

**Stages:**
1. Foundation & Setup (2-3 days, 50K tokens)
2. Core CRUD (4-5 days, 120K tokens)
3. Goals & Smart Routines (3-4 days, 80K tokens)
4. Kiosk Mode (3-4 days, 70K tokens)
5. Co-Parent/Teacher + School (4-5 days, 100K tokens)
6. Analytics + Marketplace (5-6 days, 90K tokens)

---

## 🚀 Resume Development

### Step 1: Check Current Stage

```bash
# See what's implemented
git log --oneline

# Check current branch
git branch
```

### Step 2: Open Stage Guide

Open `/docs/stages/stage-[X].md` for your current stage.

### Step 3: Copy Session Prompt

Each stage file has a **SESSION PROMPT** section at the top.  
**Copy the entire prompt** and paste it into your new Claude Code session.

### Step 4: Continue Coding

The session prompt includes:
- ✅ Context (what's completed)
- ✅ Current objectives
- ✅ Tech stack requirements
- ✅ Coding rules
- ✅ Testing requirements

Claude will know exactly where you left off and what to build next.

---

## 📊 Token Budget

| Stage | Estimated | Actual | Remaining |
|-------|-----------|--------|-----------|
| Stage 1 | 50K | - | - |
| Stage 2 | 120K | - | - |
| Stage 3 | 80K | - | - |
| Stage 4 | 70K | - | - |
| Stage 5 | 100K | - | - |
| Stage 6 | 90K | - | - |
| **Total** | **510K** | **-** | **-** |

**Update this table** as you complete each stage.

---

## 🔑 Key Files for Reference

- **Data Model:** `/prisma/README.md` (see original conversation for full schema)
- **RLS Policies:** Will be in `/supabase/policies.sql` (Stage 1)
- **Tech Stack:** See `/docs/plan.md`
- **Environment Setup:** `/docs/SETUP.md`

---

## 💡 Token Optimization Tips

Use these in your prompts to save 80% tokens:

```
# Instead of asking for full file:
"Show only the changed function, not entire file"

# Instead of detailed explanation:
"Brief explanation (2-3 sentences max)"

# For similar implementations:
"Implement X similar to Y, show only differences"

# For continuation:
"Continue from above [paste last few lines]"
```

---

## 🐛 If You Get Lost

1. Read `/docs/plan.md` - Complete overview
2. Check current stage guide in `/docs/stages/`
3. Review git history: `git log --oneline`
4. Check what's working: Run dev server and test

---

## 📝 Making Changes

Always:
1. Create feature branch
2. Make changes
3. Test
4. Commit with clear message
5. Push to origin

```bash
git checkout -b feature/your-feature
# ... make changes ...
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

## ✅ Ready to Code

**Start here:** `/docs/stages/stage-1.md`

Copy the SESSION PROMPT from the stage guide and paste it into your Claude Code session.

Happy coding! 🚀
