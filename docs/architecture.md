
# 📐 LayerText – System Architecture

This document outlines the technical architecture of the LayerText app, describing how the system functions across frontend, backend, API integration, authentication, and credit tracking.

---

## 1. Overview

**LayerText** is a web-based tool that lets users insert editable text between the background and foreground of an image using AI background removal.

---

## 2. Stack Summary

- **Frontend**: Next.js 14 + ShadCN UI
- **Auth**: Clerk (email/password + social logins)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for image uploads and exports
- **Payments**: Stripe (1 plan: $8 → 400 credits)
- **API Integration**: FAL (for background removal)
- **Rendering**: Canvas rendering in-browser (text overlay + PNG export)

---

## 3. Core Data Flow

### A. Upload → Edit → Export Flow

1. **User uploads PNG or JPG**
2. Image sent to FAL API → foreground extracted
3. Background + foreground layered with editable draggable text
4. User customizes text (size, color, position, shadow)
5. On export:
   - Image rendered to canvas and saved as PNG
   - PNG uploaded to Supabase
   - Credit deducted

---

## 4. Credit System Architecture

- Credits stored in `profiles.credits` (Supabase)
- 1 API trigger (FAL) = 1 credit
- Credit deducted only on successful API result
- Middleware ensures:
  - User has credits before triggering API
  - Deduction + result write to same Supabase row (atomic)

---

## 5. Stripe ↔ Supabase Sync

- Stripe Checkout Session → webhook (payment success)
- Webhook function:
  - Validates session
  - Applies 400 credits
  - Logs to `credit_logs` table
  - Idempotency enforced via `credit_grant_id`

---

## 6. Key Protections

### Credit Abuse

- Only deduct after API returns result
- Tie API usage + credit usage in same DB write
- Optional: rate-limit per IP/user (middleware)

### Stripe Failures

- Use verified webhook endpoint
- Log every payment/credit transaction
- Retry-safe logic (idempotent credit application)

---

## 7. File Format Enforcement

- Accept only `.png` or `.jpg`
- Always export in `.png` (supports transparency)
- Validate MIME types client & server-side

---

## 8. Future-Proofing Notes

- Supabase RLS enabled to prevent data leakage
- Clerk used for all frontend pages (gated access to editor/dashboard)
- No mobile UX supported in V1
- All past exports retrievable via `/account`



---

## Database Schema


# Database Schema – LayerText

This schema supports user management, credit tracking, image processing, and export history.

---

## `users` (managed by Clerk)

Authentication and user metadata is handled via Clerk. No direct table unless extended.

---

## `credits`

Tracks how many credits each user has and supports credit-based billing.

| Column Name   | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | UUID     | Primary key                              |
| user_id       | TEXT     | Clerk User ID                            |
| credits       | INTEGER  | Remaining credits                        |
| updated_at    | TIMESTAMP| Last update timestamp                    |

---

## `uploads`

Tracks each image upload and FAL background removal process.

| Column Name   | Type     | Description                                          |
|---------------|----------|------------------------------------------------------|
| id            | UUID     | Primary key                                          |
| user_id       | TEXT     | Foreign key to user (Clerk ID)                       |
| image_url     | TEXT     | Original uploaded image URL                          |
| fal_output_url| TEXT     | Foreground-only image (PNG from FAL API)             |
| created_at    | TIMESTAMP| Time of upload and processing                        |
| status        | TEXT     | Status of processing (e.g., 'pending', 'complete')   |
| credit_used   | BOOLEAN  | Whether credit has been consumed                     |

---

## `exports`

Stores exported finalized images (with text overlays).

| Column Name   | Type     | Description                                |
|---------------|----------|--------------------------------------------|
| id            | UUID     | Primary key                                |
| user_id       | TEXT     | Foreign key to user                        |
| export_url    | TEXT     | Final exported image (merged PNG)          |
| text_content  | TEXT     | Text inserted by the user                  |
| font_size     | INTEGER  | Font size used                             |
| font_color    | TEXT     | Hex color code                             |
| shadow        | TEXT     | Shadow style info                          |
| position_x    | FLOAT    | Horizontal % position                      |
| position_y    | FLOAT    | Vertical % position                        |
| created_at    | TIMESTAMP| Export timestamp                           |

---

## `payments`

Tracks Stripe payments and used for validating webhook syncs.

| Column Name         | Type     | Description                                 |
|---------------------|----------|---------------------------------------------|
| id                  | UUID     | Primary key                                 |
| user_id             | TEXT     | Foreign key to user                         |
| stripe_payment_id   | TEXT     | Stripe PaymentIntent ID                     |
| amount              | INTEGER  | Amount in cents                             |
| credits_granted     | INTEGER  | Number of credits issued                    |
| status              | TEXT     | 'success', 'failed', etc.                   |
| created_at          | TIMESTAMP| Timestamp of payment attempt                |
| credit_grant_id     | TEXT     | Idempotency field to avoid duplication      |

