# Pilot Testing Setup Guide

This guide explains how to set up and manage pilot testing for your application using the email whitelist approach.

## Overview

The pilot testing system allows you to control access to your application by maintaining a whitelist of approved email addresses. Only users with emails in the whitelist can successfully log in and access the application.

## How It Works

1. **Frontend**: When a user tries to log in, the system checks if their email is in the `pilotUsers` Firestore collection
2. **Backend**: API endpoints are protected and also verify pilot access before allowing requests
3. **User Experience**: Non-whitelisted users see a friendly "Pilot Access Required" message with instructions

## Database Structure

The system uses a Firestore collection called `pilotUsers` with the following structure:

```typescript
interface PilotUser {
  id: string;                    // Auto-generated document ID
  email: string;                 // User's email (lowercase)
  displayName?: string;          // Optional display name
  addedAt: Date;                // When the user was added
  addedBy: string;              // Who added this user (admin identifier)
  isActive: boolean;            // Whether the user has access
  notes?: string;               // Optional notes about the user
}
```

## Setting Up Pilot Users

### Method 1: Using the Script (Recommended)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Make sure your environment variables are set in `.env.local`:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   ```

3. Run the script to add a pilot user:
   ```bash
   node scripts/add-pilot-user.js "user@example.com" "User Name" "Beta tester from company X"
   ```

### Method 2: Using the Admin Interface

If you have access to the admin interface component (`PilotUserManager`), you can add users through the UI.

### Method 3: Direct Firestore Access

You can also add users directly through the Firebase Console:

1. Go to your Firebase project console
2. Navigate to Firestore Database
3. Create a new collection called `pilotUsers`
4. Add documents with the structure shown above

## Managing Pilot Users

### Adding Users

```bash
# Basic usage
node scripts/add-pilot-user.js "john@example.com"

# With display name
node scripts/add-pilot-user.js "john@example.com" "John Doe"

# With display name and notes
node scripts/add-pilot-user.js "john@example.com" "John Doe" "Beta tester from company X"
```

### Deactivating Users

You can deactivate users without removing them by setting `isActive: false` in the Firestore document. This allows you to temporarily revoke access.

### Removing Users

You can remove users entirely by deleting their document from the `pilotUsers` collection.

## User Experience

### For Whitelisted Users

1. User goes to `/login`
2. Signs in with Google (or email/password)
3. System checks their email against the pilot whitelist
4. If found and active, user is redirected to the main application

### For Non-Whitelisted Users

1. User goes to `/login`
2. Signs in with Google (or email/password)
3. System checks their email against the pilot whitelist
4. If not found or inactive, user sees the "Pilot Access Required" screen
5. User can request access via email or try signing in with a different account

## Backend Protection

The backend API endpoints are also protected:

- `/documents` (POST) - Upload documents
- `/documents/{document_name}` (DELETE) - Delete documents  
- `/sources` (POST) - Query sources

These endpoints use the `get_current_pilot_user` dependency which verifies both authentication and pilot access.

## Security Considerations

1. **Email Validation**: Emails are stored in lowercase to ensure consistent matching
2. **Active Status**: Users can be deactivated without removal for easy re-activation
3. **Backend Verification**: Both frontend and backend verify pilot access
4. **Error Handling**: Graceful fallbacks if pilot access check fails

## Monitoring and Analytics

You can track pilot user activity by:

1. Checking the `addedAt` timestamp to see when users were added
2. Using the `addedBy` field to track who added each user
3. Using the `notes` field to categorize users (e.g., "Beta tester", "Internal team", etc.)

## Transitioning to Full Release

When you're ready to open the application to all users:

1. **Option 1**: Remove pilot access checks entirely
2. **Option 2**: Set a flag to bypass pilot checks for all users
3. **Option 3**: Keep the system in place but add all users to the whitelist

## Troubleshooting

### User Can't Access Despite Being Added

1. Check that the email in Firestore matches exactly (case-insensitive)
2. Verify that `isActive` is set to `true`
3. Check browser console for any errors during pilot access check

### Backend API Returns 403 Forbidden

1. Verify the user's email is in the `pilotUsers` collection
2. Check that `isActive` is `true`
3. Ensure the Firebase Admin SDK has proper Firestore permissions

### Script Fails to Add Users

1. Verify your Firebase configuration in `.env.local`
2. Check that you have write permissions to Firestore
3. Ensure the `pilotUsers` collection exists (it will be created automatically)

## Files Modified/Created

### New Files
- `frontend/src/components/PilotAccessDenied.tsx` - Access denied screen
- `frontend/src/components/PilotUserManager.tsx` - Admin interface (optional)
- `frontend/scripts/add-pilot-user.js` - Script to add pilot users
- `PILOT_TESTING_SETUP.md` - This documentation

### Modified Files
- `frontend/src/types/editor.ts` - Added pilot user types
- `frontend/src/utils/firestore.ts` - Added pilot user management functions
- `frontend/src/contexts/AuthContext.tsx` - Added pilot access checking
- `frontend/src/app/login/page.tsx` - Added pilot access restrictions
- `backend/app/auth.py` - Added backend pilot access verification
- `backend/app/router.py` - Updated endpoints to use pilot user dependency

## Next Steps

1. Add your first pilot users using the script
2. Test the login flow with both whitelisted and non-whitelisted emails
3. Monitor the system and add more users as needed
4. Consider setting up monitoring/analytics for pilot user activity

For questions or issues, check the troubleshooting section above or review the implementation in the modified files.
