# 🧪 COMPREHENSIVE ENDPOINT TESTING

## 🎯 Testing All API Endpoints with All User Roles

### 📋 Test Categories

1. **Authentication Endpoints** (Public)
2. **User Management** (Admin, HR)
3. **Organization Structure** (Admin, HR)
4. **OKR Management** (All roles with different permissions)
5. **Review Cycles** (Admin, HR, Manager)
6. **Feedback System** (All roles)
7. **Time Tracking** (All roles)
8. **Analytics** (Role-based access)
9. **AI Services** (Admin configuration)
10. **Notifications** (All roles)

### 🔧 Test Setup Commands

```bash
# First, ensure backend is running
curl -s http://localhost:5000/api/health
# Expected: {"status": "ok", "timestamp": "..."}
```

## 🧪 ENDPOINT TESTS BY CATEGORY

### 1. Authentication Endpoints (Public Access)

```bash
# Test user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'

# Test user login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
# Save the token from response for further tests

# Test token refresh
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 2. User Management (Admin/HR only)

```bash
# Set your access token
TOKEN="YOUR_ACCESS_TOKEN_HERE"

# Get all users (Admin/HR)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users

# Get user by ID
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users/USER_ID

# Create new user (Admin/HR)
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@test.com",
    "firstName": "Test",
    "lastName": "Employee",
    "role": "employee",
    "department": "Engineering"
  }'

# Update user (Admin/HR)
curl -X PUT http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'

# Bulk import users (Admin/HR)
curl -X POST http://localhost:5000/api/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "bulk1@test.com",
        "firstName": "Bulk",
        "lastName": "User1",
        "role": "employee"
      }
    ]
  }'
```

### 3. OKR Management (All roles with permissions)

```bash
# Get OKRs (All roles can view)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/okrs

# Get OKRs summary for dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/okrs?summary=true"

# Create OKR (Admin/HR/Manager)
curl -X POST http://localhost:5000/api/okrs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase User Engagement",
    "description": "Improve user engagement metrics",
    "type": "individual",
    "keyResults": [
      {
        "title": "Increase DAU by 20%",
        "targetValue": 20,
        "unit": "percentage"
      }
    ]
  }'

# Update OKR progress (Owner or Manager)
curl -X PUT http://localhost:5000/api/okrs/OKR_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyResults": [
      {
        "title": "Increase DAU by 20%",
        "currentValue": 15,
        "score": 7
      }
    ]
  }'

# Delete OKR (Admin/HR only)
curl -X DELETE http://localhost:5000/api/okrs/OKR_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Time Tracking (All roles)

```bash
# Get time entries
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/time-entries

# Get time summary for dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/time-entries/summary

# Create time entry
curl -X POST http://localhost:5000/api/time-entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "okrId": "OKR_ID",
    "date": "2024-01-15",
    "hoursSpent": 4,
    "description": "Working on user engagement features",
    "category": "direct_work"
  }'

# Update time entry
curl -X PUT http://localhost:5000/api/time-entries/ENTRY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hoursSpent": 5,
    "description": "Updated work description"
  }'
```

### 5. Review Cycles (Admin/HR/Manager)

```bash
# Get review cycles
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/review-cycles

# Create review cycle (Admin/HR)
curl -X POST http://localhost:5000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2024 Review",
    "type": "quarterly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'

# Get my reviews (All roles)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/review-cycles/my-reviews

# Submit review
curl -X POST http://localhost:5000/api/review-cycles/CYCLE_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revieweeId": "USER_ID",
    "reviewType": "self",
    "responses": [
      {
        "questionText": "How did you perform this quarter?",
        "response": "I achieved my goals successfully",
        "rating": 8
      }
    ],
    "overallRating": 8
  }'
```

### 6. Feedback System (All roles)

```bash
# Get feedback
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/feedback

# Get feedback summary for dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/feedback?summary=true"

# Give feedback
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "USER_ID",
    "content": "Great work on the project!",
    "rating": 9,
    "type": "public",
    "category": "skills",
    "tags": ["collaboration", "technical-skills"]
  }'

# Moderate feedback (Admin/HR)
curl -X PUT http://localhost:5000/api/feedback/FEEDBACK_ID/moderate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "hide",
    "reason": "Inappropriate content"
  }'
```

### 7. Analytics (Role-based access)

```bash
# Get analytics dashboard (All roles - filtered by permission)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/dashboard

# Export analytics (Admin/HR/Manager)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export?format=csv&type=okr_progress"

# Get team analytics (Manager/HR/Admin)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/team

# Get feedback analytics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/feedback
```

### 8. AI Services (Admin configuration)

```bash
# Get AI settings (Admin only)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/ai/settings

# Update AI settings (Admin only)
curl -X PUT http://localhost:5000/api/ai/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-...",
    "geminiApiKey": "AIza...",
    "enableAiSuggestions": true
  }'

# Get AI review suggestions (All roles)
curl -X POST http://localhost:5000/api/ai/suggest-review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revieweeId": "USER_ID",
    "reviewType": "peer"
  }'

# Get AI sentiment analysis
curl -X POST http://localhost:5000/api/ai/analyze-sentiment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a great performance review"
  }'
```

### 9. Notifications (All roles)

```bash
# Get user notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications

# Mark notification as read
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN"

# Get notification preferences
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/preferences

# Update notification preferences
curl -X PUT http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "weeklyReminders": true,
    "deadlineAlerts": true
  }'
```

## 🎯 EXPECTED RESULTS

### ✅ Success Responses

- **200**: Successful GET/PUT requests
- **201**: Successful POST requests (creation)
- **204**: Successful DELETE requests

### ❌ Expected Error Responses

- **400**: Bad request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found (resource doesn't exist)
- **500**: Internal server error

## 🏆 TESTING CHECKLIST

- [ ] Health endpoint responds
- [ ] Authentication flow works (register/login/refresh)
- [ ] User management (Admin/HR permissions)
- [ ] OKR CRUD operations (role-based permissions)
- [ ] Time tracking (all users can log time)
- [ ] Review cycles (creation and submission)
- [ ] Feedback system (public/private feedback)
- [ ] Analytics (role-based data access)
- [ ] AI services (configuration and usage)
- [ ] Notifications (preferences and delivery)
- [ ] Proper error handling for all scenarios
- [ ] RBAC enforcement (users can't access unauthorized endpoints)

## 🔧 AUTOMATED TEST SCRIPT

```bash
#!/bin/bash
# Save this as test_all_endpoints.sh

BASE_URL="http://localhost:5000/api"
TOKEN=""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4

    echo "Testing: $method $endpoint"
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                   -H "Authorization: Bearer $TOKEN" \
                   -H "Content-Type: application/json" \
                   -d "$data")
    else
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                   -H "Authorization: Bearer $TOKEN")
    fi

    status_code="${response: -3}"
    body="${response%???}"

    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS: $status_code"
    else
        echo "❌ FAIL: Expected $expected_status, got $status_code"
        echo "Response: $body"
    fi
    echo "---"
}

# First test health endpoint
test_endpoint "GET" "/health" "" "200"

# Test authentication
echo "Testing authentication..."
# Add more tests here...
```

This comprehensive testing approach will help identify exactly which endpoints are failing and with which user roles.
