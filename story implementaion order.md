 Revised Development Order

  Phase 1: Foundation (Stories 3.2, 3.4)

  1. Story 3.2: Clerk Authentication - Get       
  user auth working first
  2. Story 3.4: Supabase for user/credit         
  state - Database foundation

  Phase 2: Core Image Flow (Stories 1.1,         
  1.2, 1.3)

  3. Story 1.1: Image Upload - Basic file        
  upload functionality
  4. Story 1.2: Background Removal via FAL       
  API - Core AI integration
  5. Story 1.3: PNG Export - Complete the        
  basic image pipeline

  Phase 3: Credit System (Story 3.1)

  6. Story 3.1: Credit System - Credit
  tracking and deduction logic

  Phase 4: Text Editing (Stories 2.1, 2.2,       
  2.3, 2.4)

  7. Story 2.1: Text Layer Editor - Basic        
  text overlay
  8. Story 2.2: Live Text Input + Editing -      
  Real-time editing
  9. Story 2.3: Text Customization - Styling     
   controls
  10. Story 2.4: Drag-and-Drop Text 
  Placement - Advanced positioning

  Phase 5: Payment Integration (Story 3.3)       

  11. Story 3.3: Stripe Payments -
  Monetization

  Phase 6: User Experience (Story 4.1)

  12. Story 4.1: Past Export History - Final     
   UX enhancement

  Why Credit System Before Stripe?

  - Testing: We can manually grant credits       
  via database for development/testing
  - Core Logic: Credit deduction logic needs     
   to work before payment top-ups
  - Validation: Ensures the entire user flow     
   works before adding payment complexity        
  - Development: Can test with mock credits      
  without Stripe webhooks

  You're spot on - we'd be blocked testing       
  the complete flow if Stripe came too
  early. This revised order lets us validate     
   everything works before adding payment        
  complexity.
