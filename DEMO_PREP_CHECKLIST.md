# 🎬 Demo Preparation Checklist

## ⚡ Quick Setup (5 minutes before demo)

### 1. Seed Demo Data ✅ VERIFIED WORKING

```bash
cd backend
node seed-demo-data.js
```

✅ **Successfully creates:**

- 6 users with different roles (Admin, HR, Manager, 3 Employees)
- 6 departments and 5 teams with proper relationships
- 2 sample OKRs with cascading hierarchy (Company → Department)
- 3 pieces of feedback with sentiment analysis
- 1 active review cycle (Q1 2024 Performance Review)
- Time tracking entries for analytics demonstration

✅ **All login credentials confirmed working:**

- Authentication system tested and operational
- Role-based access control functioning
- Manager-employee relationships established

### 2. Start Backend

```bash
cd backend
npm start
```

Verify:

- ✅ MongoDB connected
- ✅ Server running on port 5000
- ✅ No errors in console

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Verify:

- ✅ Next.js running on localhost:3000
- ✅ No build errors
- ✅ Login page loads

### 4. Test Login

Navigate to `http://localhost:3000` and login with:

```
Admin: admin@demotech.com / Demo123!
```

## 🎯 Demo Login Accounts

| Role     | Email                     | Password | Use For             |
| -------- | ------------------------- | -------- | ------------------- |
| Admin    | admin@demotech.com        | Demo123! | Full platform demo  |
| HR       | hr@demotech.com           | Demo123! | HR features         |
| Manager  | john.manager@demotech.com | Demo123! | Manager dashboard   |
| Employee | jane.dev@demotech.com     | Demo123! | Employee experience |

## 📋 Pre-Demo Browser Setup

1. **Open multiple browser windows/tabs:**

   - Window 1: Admin view
   - Window 2: Manager view
   - Window 3: Employee view

2. **Bookmark key URLs:**

   - `http://localhost:3000` - Login
   - `http://localhost:3000/dashboard` - Dashboard
   - `http://localhost:3000/okrs` - OKRs
   - `http://localhost:3000/reviews` - Reviews
   - `http://localhost:3000/feedback` - Feedback
   - `http://localhost:3000/time-tracking` - Time Tracking

3. **Clear browser cache** to ensure fresh load

## 🔧 Troubleshooting Quick Fixes

### If getting 429 Too Many Requests:

```bash
# Rate limiting is disabled in development by default
# If still getting 429 errors, restart backend:
cd backend
npm start
```

### If MongoDB connection fails:

```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI" --eval "db.runCommand('ping')"
```

### If frontend won't start:

```bash
cd frontend
rm -rf .next
npm run dev
```

### If authentication fails:

```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()
```

## 🎪 Demo Flow Timing

| Phase         | Duration    | Key Points                |
| ------------- | ----------- | ------------------------- |
| Setup Check   | 2 min       | Login, navigation         |
| User Mgmt     | 8 min       | Add users, org structure  |
| OKRs          | 10 min      | Create, cascade, update   |
| Time Tracking | 6 min       | Log time, analytics       |
| Reviews       | 12 min      | Create cycle, participate |
| Feedback      | 8 min       | Give, moderate, analyze   |
| AI Features   | 10 min      | Suggestions, analysis     |
| Analytics     | 8 min       | Dashboards, exports       |
| Notifications | 5 min       | Center, preferences       |
| **Total**     | **~60 min** | **Full platform demo**    |

## 🎯 Key Talking Points

1. **AI Integration**: Highlight OpenAI/Gemini fallback
2. **Role-Based Security**: Show different user experiences
3. **Real-Time Features**: Notifications, progress updates
4. **Modern Tech Stack**: Next.js, Express, MongoDB
5. **Enterprise Ready**: Security, scalability, performance

## 📱 Mobile Demo (Optional)

Test on mobile device:

1. Connect phone to same WiFi
2. Access via local IP: `http://[your-ip]:3000`
3. Show responsive design
4. Test touch interactions

## 🚀 Ready to Demo!

✅ Backend running  
✅ Frontend running  
✅ Demo data loaded  
✅ Test login working  
✅ Key features verified  
✅ Multiple browser windows ready

**You're all set for an impressive demo! 🎉**
