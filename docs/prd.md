# 📝 Product Requirements Document (PRD)

## 📄 Product Overview

**App Name**: LayerText (placeholder)  
**Purpose**:  
LayerText enables content creators to upload an image, automatically split it into background and foreground using AI, and insert stylized text *between* the two. Users can customize this text’s size, color, position, and shadow and then export the final image.  

**Goals**:
- Simple editor to create rich visuals without design software
- Monetize with a credit-based system
- Validate MVP with paid users

---

## 🎯 Target Users

**Primary Audience**:  
Independent content creators who want fast, easy, design-light image customization.

**Segments**:
- Social media creators
- Meme makers
- Indie marketers
- Digital sellers (Etsy/Gumroad)
- Lightweight use cases for designers

**User Goals**:
- Insert text inside images quickly
- Stylize the result easily
- Export for content distribution

---

## 🧩 Core Features

1. **Image Upload** (JPG/PNG)
2. **Background Removal** via FAL API
3. **Text Layer Editor**
4. **Live Text Input + Editing**
5. **Text Customization**
6. **Drag-and-Drop Text Placement**
7. **PNG Export**
8. **Credit System** ($8 for 400 credits, 1 credit per upload)
9. **Clerk Authentication**
10. **Stripe Payments**
11. **Supabase for user/credit state**
12. **Past Export History Page**

---

## 🧱 Technical Stack

- **Next.js** (App Router)
- **ShadCN** (Tailwind UI)
- **Clerk** (Auth)
- **Supabase** (Database)
- **Stripe** (Billing)
- **FAL API** (`fal-ai/bria/background/remove`)
- **Client Rendering**: HTML/CSS/JS layer with image/text composition

---

## 🧭 User Flow

1. **Landing Page** → “Start Creating”
2. **Login via Clerk**
3. **Upload Image** → 1 credit deducted
4. **Editor Loads**:
   - Text input field for live text updates
   - Controls: size, color, shadow, drag-to-move
5. **Export as PNG**
6. **Dashboard**:
   - Credit count
   - Purchase more via Stripe
   - View export history

---

## 💳 Credit System

- $8 = 400 credits  
- 1 credit = 1 image upload processed via API  
- Credits deducted **after successful API return**  
- Stored in Supabase and synced via Stripe webhook  
- Admin system ensures idempotent `credit_grant_id`

---

## 🧪 Proof of Concept Summary

Working prototype validates:
- FAL API integration
- Foreground/background separation
- Text rendered between layers
- Live control of text attributes
- PNG output confirmed

PoC Code: `text_b.js` (Node + HTML/CSS/JS)

---

## 🚫 Out of Scope

- No mobile editing
- No video support
- No free trial or freemium tier
- No advanced effects or multi-text
- No custom fonts
- No undo/redo
- No team/collaboration
- No AI layout suggestions

---

## 🎯 Success Metrics

- 100 paid users in first 30 days
- >40% of users consume >1 credit per session
- Avg. 3+ exports/user within 7 days
- Stripe conversion >5%
- Export failure rate <1%

---

## ⚠️ Risks & Constraints

### 3. Credit Abuse  
Mitigations:
- Deduct credit only after success
- Store result link with credit used
- Optional rate-limiting

### 4. Stripe ↔ Supabase Sync  
Mitigations:
- Verified Stripe webhooks
- Supabase event logging
- Idempotent `credit_grant_id` tracking

### Other Risks:
- FAL API downtime
- Image size limits
- Client-side performance for large files
- Canvas-based export quality

---

## ❓ Open Questions & Final Decisions

| Question                                                                 | Answer |
|--------------------------------------------------------------------------|--------|
| Upload formats?                                                         | JPG, PNG |
| Export format?                                                          | Always PNG |
| Mobile support?                                                         | No |
| Watermarking?                                                           | Yes |
| Past exports/history?                                                  | Yes |
| Localization?                                                           | Maybe future |

