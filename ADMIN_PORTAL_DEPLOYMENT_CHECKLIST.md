# Admin Portal Deployment Checklist

## Pre-Deployment Verification

### Authentication & Authorization
- [x] Admin login page redirects non-admins to dashboard
- [x] AdminRoute component properly verifies admin role
- [x] Auth context correctly identifies admin users
- [x] Unauthenticated users redirected to `/admin/login`
- [x] Session management uses Supabase auth, not localStorage

### Route Protection
- [x] All `/admin/*` routes protected by AdminRoute wrapper
- [x] Non-admin users cannot access admin routes
- [x] Login page checks for existing auth to prevent flickering
- [x] Proper redirect flow: non-admin → `/dashboard`, not authenticated → `/admin/login`

### Database & Permissions
- [x] profiles table has `role` column (admin/trader)
- [x] RLS policies properly restrict access
- [x] Admin audit logs table available
- [x] All admin queries use proper Supabase clients

### Admin Features
- [x] Dashboard displays real-time stats
- [x] User Management available
- [x] Deposit Approval workflow
- [x] Ticket/Support Management
- [x] Risk Monitor available
- [x] Finance operations page

### Frontend Routes
- [x] `/admin` - Main dashboard (protected)
- [x] `/admin/login` - Admin login (public)
- [x] `/admin/users` - User management (protected)
- [x] `/admin/finance` - Deposit approval (protected)
- [x] `/admin/tickets` - Support tickets (protected)
- [x] `/admin/risk` - Risk monitoring (protected)

### UI/UX
- [x] Admin layout loads correctly
- [x] Navigation sidebar works on mobile
- [x] Admin logo/branding displays
- [x] Logout functionality works
- [x] Error states display properly

### Security
- [x] Admin login checks role after authentication
- [x] Non-admin users immediately signed out if trying to access admin
- [x] All admin routes require authentication
- [x] Sensitive operations logged to admin_logs table
- [x] Redirect to `/admin/login` for failed auth attempts

### Performance
- [x] Admin dashboard loads initial data server-side
- [x] Real-time updates use proper subscriptions
- [x] No unnecessary database queries
- [x] Client components properly optimized

## Deployment Steps

1. **Verify Admin User Exists**
   ```sql
   SELECT id, email, role FROM profiles WHERE role = 'admin' LIMIT 1;
   ```

2. **Run RLS Policies (if not already done)**
   - Execute `scripts/014_enable_rls_policies.sql`

3. **Deploy to Production**
   - Push to production branch
   - Run database migrations if needed
   - Verify admin login works at `https://yourdomain.com/admin/login`

4. **Post-Deployment Testing**
   - Test admin login with valid credentials
   - Verify non-admin user cannot access admin routes
   - Test logout functionality
   - Verify dashboard loads and displays data
   - Test each admin feature (users, finance, tickets, risk)

## Troubleshooting

### Admin Cannot Login
- **Issue**: Profile role not set to 'admin'
- **Fix**: Run `scripts/007_create_admin_user.sql` or manually update profile role

### Redirected to `/dashboard` instead of `/admin`
- **Issue**: User role is not 'admin'
- **Fix**: Verify profile.role in database is exactly 'admin'

### Login page flickering
- **Issue**: Auth check happening after render
- **Fix**: Ensure `isChecking` state properly shown during auth verification

### Admin features not loading data
- **Issue**: RLS policies blocking queries
- **Fix**: Verify RLS policies allow admin queries, run `scripts/014_enable_rls_policies.sql`

## Security Reminders

- Always use `/admin/login` endpoint, not regular `/login`
- Admins must authenticate with valid Supabase credentials
- All admin actions are logged to `admin_logs` table
- Monitor login attempts for suspicious activity
- Regularly rotate admin passwords
