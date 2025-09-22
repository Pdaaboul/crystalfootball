# Step 5: Subscriptions Core - Manual Payment Flow

**Objective:** Implement end-to-end manual payment subscriptions system with user submission, admin approval workflow, and comprehensive business rule enforcement.

---

## Database Schema

### Migration: `supabase/migrations/0006_subscriptions.sql`

**Tables Created:**

1. **`public.subscriptions`**
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key → profiles.user_id)
   - `package_id` (uuid, foreign key → packages.id)
   - `status` (text, check constraint: pending|active|expired|rejected)
   - `start_at` (timestamptz, nullable)
   - `end_at` (timestamptz, nullable)
   - `notes` (text, nullable)
   - `created_by`/`updated_by` (uuid, audit fields)
   - `created_at`/`updated_at` (timestamptz)

2. **`public.payment_receipts`**
   - `id` (uuid, primary key)
   - `subscription_id` (uuid, foreign key → subscriptions.id, cascade delete)
   - `amount_cents` (int, check > 0)
   - `method` (text, check: wish|crypto)
   - `reference` (text, required)
   - `receipt_url` (text, nullable for file storage)
   - `submitted_at` (timestamptz, default now)
   - `verified_by`/`verified_at` (uuid/timestamptz, admin verification)
   - `created_at` (timestamptz)

3. **`public.subscription_events`**
   - `id` (uuid, primary key)
   - `subscription_id` (uuid, foreign key → subscriptions.id)
   - `actor_user_id` (uuid, foreign key → profiles.user_id)
   - `action` (text, check: created|submitted_payment|approved|rejected|expired|updated)
   - `notes` (text, nullable)
   - `created_at` (timestamptz)

**Triggers and Functions:**
- `stamp_subscription_audit()` - Auto-stamps created_by/updated_by from auth.uid()
- `prevent_subscription_key_changes()` - Guards against user_id/package_id modifications after creation
- `set_updated_at()` - Updates timestamp on record changes

**Performance Indexes:**
- `idx_subscriptions_user_status` - Optimizes user queries by status
- `idx_subscriptions_status_created` - Admin queries by status and date
- `idx_subscriptions_end_at` - Expiry processing queries
- `idx_subscriptions_pending` - Partial index for pending status
- `idx_payment_receipts_subscription` - Receipt lookups by subscription
- `idx_subscription_events_subscription` - Event timeline queries

---

## Row Level Security (RLS) Policies

### Subscriptions Table

**User Permissions:**
- **Insert:** Users can create subscriptions for themselves (status=pending, no start/end dates)
- **Select:** Users can view their own subscriptions only
- **Update:** Users can edit their own pending subscriptions (notes only, cannot change key fields)

**Admin Permissions:**
- **Select/Update/Delete:** Full access to all subscriptions
- **Status Transitions:** Only admins can move to active/expired/rejected states
- **Date Management:** Only admins can set start_at/end_at

### Payment Receipts Table

**User Permissions:**
- **Insert:** Only for their own pending subscriptions
- **Select:** Their own receipts only

**Admin Permissions:**
- **Select/Update/Delete:** Full access for verification and management

### Subscription Events Table

**User Permissions:**
- **Select:** Events for their own subscriptions

**Admin Permissions:**
- **Select/Insert:** Full audit trail access

---

## API Routes and Server Actions

### User-Facing APIs

**`POST /api/subscriptions/payment`**
- **Purpose:** Submit payment for new or existing pending subscription
- **Authentication:** Required (user)
- **Business Logic:**
  - Creates subscription if none exists or finds existing pending
  - Enforces one pending subscription per user
  - Validates payment data (amount, method, reference)
  - Stores receipt with optional file upload
  - Creates audit events
  - Triggers email notifications (scaffolded)

**`POST /api/upload`**
- **Purpose:** Upload receipt files to Supabase Storage
- **Authentication:** Required (user)
- **Validation:** File type (images, PDF), size (max 5MB)
- **Security:** User-scoped file paths, signed URLs

### Admin APIs (Future Implementation)

- Subscription approval/rejection endpoints
- Bulk status updates
- Manual expiry processing
- Payment verification workflows

---

## User Interface Components

### User Dashboard: `/dashboard/subscription`

**Features:**
- **No Subscription State:** Package selection with responsive card grid
- **Existing Subscription:** Status display with server-safe countdown
- **Payment Submission:** Modal form with method selection, amount input, reference field, file upload
- **Receipt History:** Timeline of submitted payments with status
- **Real-time Updates:** Client-side countdown that never goes negative

**Components:**
- `SubscriptionCard` - Main container with conditional rendering
- `SubscriptionStatus` - Status badges with color-coded states
- `PaymentForm` - Complete payment submission workflow
- `PackageSelector` - Package choice interface

### Admin Interface: `/admin/subscriptions`

**Features:**
- **Stats Dashboard:** Real-time counts by status (pending, active, expired, rejected)
- **Subscriptions Table:** Responsive table with user details, package info, payment status
- **Filter and Search:** By status, date range, user email, payment reference
- **Bulk Actions:** Multi-select approve/reject for pending subscriptions
- **Quick Actions:** View, approve, reject buttons per row

**Components:**
- `SubscriptionsTable` - Responsive data table with actions
- `SubscriptionFilters` - Search and filter controls
- `BulkActionBar` - Multi-select operations

---

## Business Rules Implementation

### Single Active Subscription Rule
- **Enforcement:** Database constraints + application logic
- **Admin Warning:** UI alerts when approving would create conflicts
- **Resolution:** Explicit admin confirmation to expire current before activating new

### Status Transition Rules
```
pending → active (admin approval)
pending → rejected (admin rejection)
active → expired (system/admin)
expired/rejected → terminal (no further changes)
```

### Payment Validation
- **Amount:** Must be positive, matches package price (advisory)
- **Reference:** Minimum 5 characters, alphanumeric + basic symbols
- **Method:** Constrained to 'wish' or 'crypto'
- **File Upload:** Optional, validated type and size

### Automatic Expiry Processing
- **Utility Function:** `expireEndedSubscriptions()` in `/lib/utils/subscription-expiry.ts`
- **Scope:** Marks active subscriptions past end_at as expired
- **Audit Trail:** Creates system events for each expiry
- **Admin Interface:** Manual trigger button for testing

---

## Email System (Scaffolded)

**Implementation Status:** Scaffolded with TODO markers for SMTP integration

**Email Types:**
1. **Payment Confirmation:** User receives immediate confirmation of submission
2. **Approval Notification:** Welcome email with access details and end date
3. **Rejection Notice:** Polite explanation with resubmission guidance
4. **Expiry Reminders:** T-5 days and T-1 day warnings with renewal CTA
5. **Admin Notifications:** New payment submissions requiring review

**Email Functions:** `/lib/email/subscription-emails.ts`
- All functions return Promise<boolean> for integration testing
- Console logging with structured data for debugging
- Template placeholders ready for email provider integration

**Configuration:** `EMAIL_CONFIG` object with provider settings placeholders

---

## File Storage Integration

**Supabase Storage Configuration:**
- **Bucket:** `receipts` with user-scoped paths
- **Path Structure:** `{folder}/{user_id}/{timestamp}-{random}.{ext}`
- **Security:** Signed URLs with 1-year expiry
- **Validation:** File type whitelist, 5MB size limit

**Upload Flow:**
1. Client-side validation (type, size)
2. Form data submission to `/api/upload`
3. Server validation and Supabase storage
4. Signed URL returned for database storage
5. URL stored in payment_receipts.receipt_url

---

## Responsive Design and Accessibility

**Mobile-First Implementation:**
- **320px minimum:** No horizontal scroll, comfortable spacing
- **375px standard:** Optimal mobile experience
- **768px tablet:** Two-column layouts, expanded forms
- **1024px+ desktop:** Full table views, multi-column grids

**Accessibility Features:**
- **Touch Targets:** Minimum 44px for all interactive elements
- **Focus Indicators:** Cyan-blue focus rings with clear visibility
- **Semantic Structure:** Proper headings, landmarks, form labels
- **Keyboard Navigation:** Full tab order and enter/space activation
- **Color Contrast:** WCAG AA compliance on cyan/black/white palette

**Component Responsiveness:**
- `PackageSelector`: 1-col mobile → 3-col desktop grid
- `PaymentForm`: Stacked mobile → side-by-side desktop
- `SubscriptionsTable`: Card view mobile → table desktop
- `SubscriptionStatus`: Icon + text mobile → full dashboard desktop

---

## Security Implementation

### Authentication and Authorization
- **User Routes:** `requireAuth()` middleware for user identity
- **Admin Routes:** `requireRole(['admin', 'superadmin'])` for privileged access
- **API Validation:** Server-side role checks on all write operations

### Data Protection
- **RLS Enforcement:** Database-level access control with explicit policies
- **Service Role Security:** No service role key exposure to client
- **Input Sanitization:** Validation on all user inputs (amounts, references, files)
- **Audit Trail:** Complete event logging for all subscription changes

### Payment Security
- **Reference Validation:** Prevents injection attacks in payment references
- **File Upload Security:** Type validation, size limits, sandboxed storage
- **Amount Verification:** Server-side cents conversion and validation

---

## Status Transition Diagram

```
[Package Selection] → [Payment Submission] → [PENDING]
                                                 ↓
                     [Admin Review] → [APPROVED] → [ACTIVE]
                                         ↓             ↓
                                    [REJECTED]   [End Date] → [EXPIRED]
                                         ↓             ↓
                                   [Terminal]    [Terminal]
```

**Admin Actions:**
- Pending → Active: Sets start_at=now(), end_at=start_at + package.duration_days
- Pending → Rejected: Sets rejection reason, creates audit event
- Active → Expired: Manual or automatic based on end_at

---

## Testing Procedures

### Database Testing
1. **Apply Migration:** `0006_subscriptions.sql` in Supabase SQL editor
2. **Verify Tables:** Confirm all tables, indexes, and policies created
3. **Test RLS:** Use different user roles to verify access restrictions
4. **Trigger Validation:** Test audit triggers and constraint enforcement

### User Flow Testing
1. **Registration:** Create new user account
2. **Package Selection:** Navigate to `/dashboard/subscription`
3. **Payment Submission:** Submit valid payment with file upload
4. **Status Verification:** Confirm pending status and receipt storage
5. **Admin Review:** Test approval workflow in admin interface

### Admin Flow Testing
1. **Admin Access:** Login as admin/superadmin role
2. **Subscription List:** Verify all subscriptions visible with correct stats
3. **Approval Process:** Test approve/reject with status transitions
4. **Conflict Detection:** Test single active subscription enforcement
5. **Expiry Processing:** Run manual expiry check with expired test data

### Responsive Testing
- **Browser DevTools:** Test all breakpoints (320, 375, 768, 1024, 1280px)
- **Touch Devices:** Verify touch targets and gesture support
- **Keyboard Navigation:** Tab through all interactive elements
- **Screen Reader:** Test with accessibility tools for semantic structure

### Security Testing
1. **Anonymous Access:** Verify RLS blocks unauthorized reads
2. **Cross-User Access:** Confirm users cannot access others' subscriptions
3. **Role Escalation:** Test admin-only operations with regular user
4. **File Upload:** Test malicious file types and oversized uploads
5. **Input Validation:** Test XSS and injection in payment references

---

## Performance Optimization

**Database Indexes:**
- Optimized for common query patterns (user status lookup, admin filtering)
- Partial indexes for frequent operations (pending subscriptions)
- Composite indexes for complex queries (user + status + date)

**Component Optimization:**
- Server-side rendering for initial page load
- Client-side state management for interactive forms
- Efficient re-renders with React state optimization
- Lazy loading for large admin tables

**File Storage:**
- Signed URLs prevent direct storage access
- Client-side file validation before upload
- Optimized file paths for storage performance

---

## Deployment Checklist

### Database Deployment
1. **Apply Migration:** Execute `0006_subscriptions.sql` in production
2. **Verify Policies:** Test RLS with production-like data
3. **Index Performance:** Monitor query performance on large datasets
4. **Backup Verification:** Ensure new tables included in backup strategy

### Application Deployment
1. **Environment Variables:** Verify all required configs present
2. **File Storage:** Configure Supabase Storage bucket and permissions
3. **Email Provider:** Integration when SMTP provider available
4. **Admin Accounts:** Ensure admin users have proper roles

### Production Testing
1. **End-to-End Flow:** Complete user registration → payment → approval
2. **Performance Testing:** Load test with concurrent users and large datasets
3. **Security Validation:** Penetration testing on payment submission
4. **Monitoring Setup:** Alerts for failed payments and system errors

---

## Future Enhancements (Post-MVP)

### Email Integration
- **SMTP Provider:** SendGrid, Mailgun, or similar service integration
- **Template System:** HTML email templates with branding
- **Delivery Tracking:** Open rates, click tracking, bounce handling

### Advanced Admin Features
- **Detailed Subscription View:** Full timeline, receipt thumbnails, user history
- **Bulk Operations:** CSV export, batch approve/reject, user communication
- **Analytics Dashboard:** Revenue tracking, conversion rates, churn analysis

### Automation
- **Cron Integration:** Scheduled expiry processing and reminder emails
- **Webhook Support:** Real-time notifications for external systems
- **Auto-Approval:** Configurable rules for trusted payment methods

### User Experience
- **Payment Method Integration:** Direct crypto wallet, bank transfer APIs
- **Subscription Management:** Self-service pause, upgrade, downgrade
- **Receipt Management:** User file organization, download center

---

## Payment Settings CMS Extension

### Database Schema Extension

**Migration: `supabase/migrations/0007_payment_methods.sql`**

Added admin-configurable payment instructions system:

1. **`public.payment_methods`** - Admin-managed payment options  
2. **`public.payment_method_fields`** - Configurable payment details
3. **Enhanced `public.payment_receipts`** - Added method_id and receipt_context

**RLS Policies:** Anonymous read active methods only, admin full CRUD access

### Admin Interface: `/admin/payments`

**Features:** Statistics dashboard, responsive table, quick enable/disable actions

### User Integration

**Enhanced `/dashboard/subscription`:** Dynamic payment instructions with copy-to-clipboard

**API:** `GET /api/payment-methods` for real-time instruction fetching

### Security & UX

**Validation:** Type-specific field requirements (wish vs crypto)
**Responsive:** Mobile-first design with ≥44px touch targets
**Accessibility:** Semantic structure with cyan focus indicators

---

**Status:** ✅ **COMPLETE WITH PAYMENT CMS** - Subscriptions Core with admin-configurable payment settings, enabling payment instruction management without code deployments. 