# Waitlist Setup Instructions

This document provides instructions for setting up the waitlist functionality that temporarily replaces the login system.

## Environment Variables Setup

Create a `.env.local` file in the frontend directory with the following environment variables:

```bash
# Existing Firebase configuration for main app (keep these as they are)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Waitlist Firebase configuration (separate backend)
NEXT_PUBLIC_FIREBASE_WAITLIST_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_WAITLIST_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_WAITLIST_PROJECT_ID=useful-waitlist
NEXT_PUBLIC_FIREBASE_WAITLIST_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_WAITLIST_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_WAITLIST_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_WAITLIST_MEASUREMENT_ID=your_measurement_id
```

## What's Changed

The following components have been updated to use the waitlist functionality instead of login:

1. **HeroSection**: "Start Writing" button now opens waitlist signup
2. **FeaturesSection**: "Get Started" button now opens waitlist signup
3. **HeaderHome**: Login button replaced with "Join Waitlist" button

## Files Added

- `src/lib/firebase_waitlist.ts` - Separate Firebase configuration for waitlist
- `src/lib/waitlistService.ts` - Service for adding users to waitlist
- `src/lib/utils.ts` - Utility functions for styling
- `src/components/ui/` - UI components (Button, Input, Label, Dialog)
- `src/components/WaitlistSignup.tsx` - Main waitlist signup modal
- `src/components/WaitlistButton.tsx` - Reusable waitlist button wrapper
- `src/components/WaitlistLoginButton.tsx` - Header-specific waitlist button

## Existing Functionality Preserved

- All existing login functionality remains intact
- The original Firebase configuration is unchanged
- All existing auth components are preserved
- The `/login` page still works as before

## How to Revert

To switch back to the login functionality:

1. Replace `WaitlistButton` with `Link href="/login"` in HeroSection and FeaturesSection
2. Replace `WaitlistLoginButton` with `LoginButton` in HeaderHome
3. Remove the waitlist-specific imports

## Important Notes

- The waitlist uses the Firebase project ID "useful-waitlist"
- All signups go to the "waitlist" collection in Firestore
- Users are automatically redirected after successful signup
- The system is designed as a temporary overlay and can be easily removed

## Testing

After setting up the environment variables, the application should build and run without errors. Test the waitlist functionality by clicking any of the updated buttons throughout the landing page.
