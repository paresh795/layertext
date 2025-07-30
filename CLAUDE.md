# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LayerText is a web-based tool that enables users to insert editable text between the background and foreground of images using AI background removal. Users upload images (JPG/PNG), which are processed through the FAL API to extract foreground elements, allowing customizable text to be positioned between background and foreground layers before exporting as PNG.

## Development Commands

**Package Manager**: Always use `pnpm` (not npm) for this project.

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint to check code quality

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: Next.js 15 with App Router
- **UI**: ShadCN components with Tailwind CSS
- **Authentication**: Clerk (email/password + social logins)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for uploads and exports  
- **Payments**: Stripe ($8 for 400 credits)
- **AI Integration**: FAL API for background removal
- **Image Processing**: Canvas-based rendering for text overlay and PNG export

### Key Architecture Patterns

**Credit System Flow**:
1. Credits stored in Supabase `profiles.credits`
2. 1 credit deducted per successful FAL API call
3. Credit validation before API triggers
4. Atomic credit deduction + result storage

**Image Processing Pipeline**:
1. User uploads JPG/PNG → Supabase Storage
2. Image sent to FAL API → foreground extracted
3. Background + foreground layered with draggable text editor
4. Canvas rendering for final PNG export

**Data Flow**:
- User authentication via Clerk
- Image uploads/exports stored in Supabase Storage
- Credit tracking and payment processing via Stripe webhooks
- Real-time text editing with position/style controls

## Database Schema

Key tables:
- `credits` - User credit balances and tracking
- `uploads` - Image upload records and FAL processing status
- `exports` - Final exported images with text customization metadata
- `payments` - Stripe payment tracking with idempotency

## Configuration

- **Path aliases**: `@/*` maps to project root
- **ShadCN**: Configured with New York style, neutral base color
- **TypeScript**: Strict mode enabled with Next.js plugin
- **Tailwind**: v4 with CSS variables for theming

## Security & Credit Protection

- Credits only deducted after successful API responses
- Stripe webhook validation with idempotent credit grants
- Supabase RLS enabled for data protection
- File format validation (PNG/JPG only)
- Rate limiting considerations for abuse prevention

## File Organization

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (ShadCN)
- `/lib` - Utility functions and configurations
- `/docs` - Comprehensive project documentation including PRD and architecture
- `/public` - Static assets

## Documentation

Extensive documentation available in `/docs`:
- Product Requirements Document (PRD)
- System architecture and data flow
- Database schema definitions
- Credit system and payment flow
- API integration patterns

## Development Notes

- **Always use pnpm** for package management (not npm)
- Turbopack enabled for faster development builds
- Component library follows ShadCN patterns
- Canvas-based image manipulation for text overlay
- Client-side rendering for real-time text editing

## Proof of Concept Reference

If you need guidance on API integration or how the core functionality should work, refer to `text_b.js`available in `/docs` - this is the working proof of concept that demonstrates:
- FAL API integration for background removal
- Canvas-based rendering for layering text between background/foreground
- Image composition and PNG export functionality
- Text positioning and styling implementation

Use this POC as a reference for understanding the expected behavior and API usage patterns when implementing the Next.js version.