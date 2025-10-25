# Google OAuth Setup for Prismo Backend

## Overview

The Prismo backend now supports Google OAuth authentication, allowing users to sign in with their Google accounts.

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/oauth/google/callback
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/oauth/google/callback` (development)
   - `https://yourdomain.com/oauth/google/callback` (production)

## API Endpoints

### OAuth Status
```
GET /oauth/status
```
Returns OAuth configuration status and available endpoints.

### Google Login Initiation
```
GET /oauth/google/login
```
Returns Google OAuth URL and state parameter for login initiation.

### Google OAuth Callback
```
GET /oauth/google/callback?code=...&state=...
```
Handles Google OAuth callback and creates/logs in user.

### Google User Info
```
GET /oauth/google/userinfo
Authorization: Bearer <access_token>
```
Returns user information from Google access token.

### Revoke Token
```
POST /oauth/google/revoke
Authorization: Bearer <access_token>
```
Revokes Google access token.

### Refresh Token
```
POST /oauth/google/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```
Refreshes Google access token.

## Usage Flow

### 1. Initiate Login
```bash
curl http://localhost:5000/oauth/google/login
```

Response:
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random_state_string"
}
```

### 2. User Authentication
1. User visits the `auth_url` in their browser
2. User completes Google authentication
3. Google redirects to callback URL with authorization code

### 3. Handle Callback
The callback endpoint automatically:
- Exchanges code for access token
- Gets user info from Google
- Creates new user or logs in existing user
- Returns user data and access token

### 4. Use Access Token
Use the returned access token for authenticated requests:
```bash
curl -H "Authorization: Bearer <access_token>" \
     http://localhost:5000/oauth/google/userinfo
```

## User Data Structure

When a user signs in with Google, the following data is stored:

```json
{
  "id": "generated_uuid",
  "cognito_user_id": "google_user_id",
  "email": "user@example.com",
  "username": "user",
  "profile": {
    "name": "User Name",
    "picture": "https://...",
    "provider": "google"
  },
  "preferences": {
    "theme": "light",
    "notifications": true
  },
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Security Features

- **State Parameter**: Prevents CSRF attacks
- **Email Verification**: Only verified Google emails are accepted
- **Token Validation**: Access tokens are validated with Google
- **Secure Sessions**: Flask sessions are used for state management

## Testing

Run the OAuth test script:

```bash
cd backend
uv run test_oauth.py
```

This will test:
- OAuth configuration status
- Google login initiation
- Endpoint availability

## Production Considerations

1. **HTTPS**: Use HTTPS in production
2. **Domain**: Update redirect URIs for production domain
3. **Secrets**: Store client secret securely
4. **Rate Limiting**: Implement rate limiting for OAuth endpoints
5. **Logging**: Add comprehensive logging for OAuth flows
6. **Error Handling**: Implement proper error handling and user feedback

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure redirect URI matches Google Console configuration
2. **Client Secret Missing**: Set `GOOGLE_CLIENT_SECRET` in environment variables
3. **State Mismatch**: Ensure state parameter is properly handled
4. **Email Not Verified**: Only verified Google emails are accepted

### Debug Mode

Enable Flask debug mode to see detailed error messages:

```python
app.config['DEBUG'] = True
```

## Integration with Existing Auth

The OAuth system integrates with the existing authentication system:

- Users created via OAuth are stored in the same `users` table
- OAuth users can access all the same features as regular users
- The system supports both OAuth and traditional authentication

## Next Steps

1. Set up Google Cloud Console project
2. Add client secret to environment variables
3. Test OAuth flow with the test script
4. Integrate OAuth login into your frontend
5. Implement proper session management
6. Add OAuth logout functionality
