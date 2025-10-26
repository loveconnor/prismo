# Prismo Backend - Complete API Routes Documentation

## **ROUTE OVERVIEW**
---

## **AUTHENTICATION ROUTES (`/auth`)**

### **User Management**
- `POST /auth/register` - Register new user
- `POST /auth/confirm` - Confirm user registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/confirm-forgot-password` - Confirm password reset
- `GET /auth/profile` - Get user profile (requires auth)
- `PUT /auth/profile` - Update user profile (requires auth)
- `POST /auth/verify` - Verify access token

---

## **DATA ROUTES (`/api`)**

### **Labs**
- `GET /api/labs` - Get all labs (public + user's if authenticated)
- `POST /api/labs` - Create new lab (requires auth)
- `GET /api/labs/<lab_id>` - Get specific lab
- `PUT /api/labs/<lab_id>` - Update lab (requires auth)
- `DELETE /api/labs/<lab_id>` - Delete lab (requires auth)

### **Widgets**
- `GET /api/widgets` - Get all widgets (public + user's if authenticated)
- `POST /api/widgets` - Create new widget (requires auth)
- `GET /api/widgets/<widget_id>` - Get specific widget

### **Collections**
- `GET /api/collections` - Get user's collections (requires auth)
- `POST /api/collections` - Create new collection (requires auth)
- `GET /api/collections/<collection_id>` - Get specific collection (requires auth)

---

## **HEALTH ROUTES (`/health`)**

- `GET /health/` - Overall health check for all services
- `GET /health/dynamodb` - DynamoDB health check
- `GET /health/cognito` - Cognito health check
- `GET /health/s3` - S3 health check
- `GET /health/detailed` - Detailed health check with recommendations

---

## **ADMIN ROUTES (`/admin`)**

### **Core Models**
- `GET /admin/users` - Get all users with pagination
- `GET /admin/users/<user_id>` - Get specific user
- `PUT /admin/users/<user_id>` - Update user
- `DELETE /admin/users/<user_id>` - Delete user

- `GET /admin/labs` - Get all labs with filtering
- `GET /admin/labs/<lab_id>` - Get specific lab
- `PUT /admin/labs/<lab_id>` - Update lab
- `DELETE /admin/labs/<lab_id>` - Delete lab

- `GET /admin/widgets` - Get all widgets
- `GET /admin/widgets/<widget_id>` - Get specific widget

- `GET /admin/collections` - Get all collections

### **Analytics**
- `GET /admin/analytics/widget-selection` - Get widget selection analytics
- `GET /admin/analytics/feedback-generated` - Get feedback generation analytics
- `GET /admin/analytics/api-usage` - Get API usage analytics

### **Learning System**
- `GET /admin/attempts` - Get all attempts
- `GET /admin/mastery` - Get mastery records
- `GET /admin/feedback` - Get feedback records


### **System Management**
- `GET /admin/error-logs` - Get error logs
- `GET /admin/system-config` - Get system configuration
- `POST /admin/system-config` - Create system configuration
- `PUT /admin/system-config/<config_key>` - Update system configuration

### **Bulk Operations**
- `POST /admin/bulk/create` - Bulk create records
- `POST /admin/bulk/delete` - Bulk delete records

### **Statistics**
- `GET /admin/stats` - Get system statistics
- `GET /admin/health` - Get system health status

---

## **ANALYTICS ROUTES (`/analytics`)**

### **Widget Analytics**
- `GET /analytics/widget-selection` - Get widget selection analytics
- `POST /analytics/widget-selection` - Track widget selection

### **Feedback Analytics**
- `GET /analytics/feedback-generated` - Get feedback generation analytics
- `POST /analytics/feedback-generated` - Track feedback generation

### **Learning Sessions**
- `GET /analytics/learning-sessions` - Get learning sessions
- `POST /analytics/learning-sessions` - Create learning session

### **Skill Progress**
- `GET /analytics/skill-progress` - Get skill progress
- `POST /analytics/skill-progress` - Update skill progress

### **API Usage**
- `GET /analytics/api-usage` - Get API usage analytics
- `POST /analytics/api-usage` - Track API usage

### **Dashboard & Insights**
- `GET /analytics/dashboard` - Get dashboard analytics for user
- `GET /analytics/insights` - Get learning insights and recommendations

---

## **LEARNING ROUTES (`/learning`)**

### **Modules**
- `GET /learning/modules` - Get learning modules
- `POST /learning/modules` - Create learning module
- `GET /learning/modules/<module_id>` - Get specific module
- `PUT /learning/modules/<module_id>` - Update module

### **Attempts**
- `GET /learning/attempts` - Get learning attempts
- `POST /learning/attempts` - Create learning attempt
- `GET /learning/attempts/<attempt_id>` - Get specific attempt
- `PUT /learning/attempts/<attempt_id>` - Update attempt

### **Mastery**
- `GET /learning/mastery` - Get mastery records
- `POST /learning/mastery` - Create mastery record
- `PUT /learning/mastery/<mastery_id>` - Update mastery record

### **Feedback**
- `GET /learning/feedback` - Get feedback records
- `POST /learning/feedback` - Create feedback record

### **Learning Paths**
- `GET /learning/paths` - Get learning paths
- `POST /learning/paths` - Create learning path

### **Skill Tags**
- `GET /learning/skill-tags` - Get skill tags
- `POST /learning/skill-tags` - Create skill tag

### **Difficulty Levels**
- `GET /learning/difficulty-levels` - Get difficulty levels
- `POST /learning/difficulty-levels` - Create difficulty level

---

## **GAMIFICATION ROUTES (`/gamification`)**

### **Notifications**
- `GET /gamification/notifications` - Get user notifications
- `POST /gamification/notifications` - Create notification
- `PUT /gamification/notifications/<notification_id>` - Update notification
- `DELETE /gamification/notifications/<notification_id>` - Delete notification

### **Streaks**
- `GET /gamification/streaks` - Get user streaks
- `POST /gamification/streaks` - Create or update streak
- `PUT /gamification/streaks/<streak_id>` - Update streak

### **Badges**
- `GET /gamification/badges` - Get user badges
- `POST /gamification/badges` - Create badge
- `GET /gamification/badges/<badge_id>` - Get specific badge

### **User Preferences**
- `GET /gamification/preferences` - Get user preferences
- `POST /gamification/preferences` - Create user preferences
- `PUT /gamification/preferences` - Update user preferences

### **Accessibility Settings**
- `GET /gamification/accessibility` - Get accessibility settings
- `POST /gamification/accessibility` - Create accessibility settings
- `PUT /gamification/accessibility` - Update accessibility settings

### **Version History**
- `GET /gamification/version-history` - Get version history
- `POST /gamification/version-history` - Create version history entry

### **Coach Chat**
- `GET /gamification/coach-chat` - Get coach chat messages
- `POST /gamification/coach-chat` - Create coach chat message

### **Walkthrough Sessions**
- `GET /gamification/walkthrough-sessions` - Get walkthrough sessions
- `POST /gamification/walkthrough-sessions` - Create walkthrough session

### **Micro Assessments**
- `GET /gamification/micro-assessments` - Get micro assessments
- `POST /gamification/micro-assessments` - Create micro assessment

---

## **ADVANCED ROUTES (`/advanced`)**

### **Sandbox Sessions**
- `GET /advanced/sandbox-sessions` - Get sandbox sessions
- `POST /advanced/sandbox-sessions` - Create sandbox session
- `PUT /advanced/sandbox-sessions/<session_id>` - Update sandbox session

### **Review Sessions**
- `GET /advanced/review-sessions` - Get review sessions
- `POST /advanced/review-sessions` - Create review session
- `PUT /advanced/review-sessions/<session_id>` - Update review session

### **Lab Templates**
- `GET /advanced/lab-templates` - Get lab templates
- `POST /advanced/lab-templates` - Create lab template

### **Widget Registry**
- `GET /advanced/widget-registry` - Get widget registry
- `POST /advanced/widget-registry` - Create widget registry entry

### **Lab Steps**
- `GET /advanced/lab-steps` - Get lab steps
- `POST /advanced/lab-steps` - Create lab step

### **Hints**
- `GET /advanced/hints` - Get hints
- `POST /advanced/hints` - Create hint

### **Educator Content**
- `GET /advanced/educator-content` - Get educator content
- `POST /advanced/educator-content` - Create educator content

### **System Configuration**
- `GET /advanced/system-config` - Get system configuration
- `POST /advanced/system-config` - Create system configuration
- `PUT /advanced/system-config/<config_key>` - Update system configuration

### **Error Logs**
- `GET /advanced/error-logs` - Get error logs
- `POST /advanced/error-logs` - Create error log

---

## **AUTHENTICATION REQUIREMENTS**

### **Routes requiring authentication** (need `Authorization: Bearer <token>` header):
- All `/admin/*` routes
- All `/analytics/*` routes
- All `/learning/*` routes
- All `/gamification/*` routes
- All `/advanced/*` routes
- All `/auth/profile` routes
- All `/api/labs` POST, PUT, DELETE operations
- All `/api/widgets` POST operations
- All `/api/collections` routes

### **Public routes** (no authentication required):
- All `/health` routes
- All `/api/claude/*` routes (AI services)
- `/auth/register`, `/auth/confirm`, `/auth/login`, `/auth/refresh`
- `/auth/forgot-password`, `/auth/confirm-forgot-password`
- `/auth/verify`
- `GET /api/labs` (public labs only)
- `GET /api/labs/<lab_id>` (public labs only)
- `GET /api/widgets` (public widgets only)
- `GET /api/widgets/<widget_id>` (public widgets only)

---

## **CLAUDE AI ROUTES (`/api/claude`)**

### **Chat with Claude**
- `POST /api/claude/chat` - Send message to Claude AI
  - Request: `{ "message": "string", "system_prompt": "string", "max_tokens": number }`
  - Response: `{ "success": boolean, "response": "string", "error": string }`

### **Code Review**
- `POST /api/claude/review-code` - Get AI code review
  - Request: `{ "code": "string", "language": "string", "context": "string" }`
  - Response: `{ "success": boolean, "comments": [...], "overallFeedback": "string", "error": string }`

### **Code Execution**
- `POST /api/claude/execute-code` - Execute JavaScript or Python code
  - Request: `{ "code": "string", "language": "javascript|python", "testCases": [...] }`
  - Response: `{ "success": boolean, "output": "string", "error": string, "executionTime": number, "testResults": [...] }`

### **Health Check**
- `GET /api/claude/health` - Check Claude AI service availability
  - Response: `{ "status": "healthy|unhealthy", "service": "string", "available": boolean }`

---

## **AUTHENTICATION REQUIREMENTS**

## **QUERY PARAMETERS**

### **Common Parameters**
- `limit` - Number of results to return (default: 50)
- `last_key` - Pagination key for next page
- `user_id` - Filter by user ID
- `created_at` - Filter by creation date
- `updated_at` - Filter by update date

### **Filtering Parameters**
- `status` - Filter by status
- `type` - Filter by type
- `category` - Filter by category
- `difficulty` - Filter by difficulty level
- `is_public` - Filter by public/private status

### **Sorting Parameters**
- `sort_by` - Field to sort by
- `sort_order` - Sort order (asc/desc)

---

## **USAGE EXAMPLES**

### **Create a Lab**
```bash
curl -X POST http://localhost:5000/api/labs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Basics",
    "lab_type": "coding",
    "description": "Learn Python fundamentals",
    "content": {"steps": []},
    "is_public": true,
    "tags": ["python", "beginner"],
    "difficulty": 1,
    "estimated_time": 30
  }'
```

### **Get User Analytics**
```bash
curl -X GET "http://localhost:5000/analytics/dashboard" \
  -H "Authorization: Bearer <token>"
```

### **Track Widget Selection**
```bash
curl -X POST http://localhost:5000/analytics/widget-selection \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "module_id": "module-123",
    "widget_id": "widget-456",
    "selected_option": "hint_level_2"
  }'
```

### **Create Badge**
```bash
curl -X POST http://localhost:5000/gamification/badges \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "badge_type": "python_master",
    "title": "Python Master",
    "description": "Completed all Python labs",
    "icon": "python-icon",
    "color": "#3776ab",
    "rarity": "rare"
  }'
```



