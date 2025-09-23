# Step 6: Betslips CMS + P/L Engine Implementation (Enhanced with Multi-leg Support)

**Date**: September 23, 2025 (Enhanced: Same day)  
**Objective**: Implement comprehensive betslips management system with AI-backed predictions, P&L tracking, VIP subscriber access control, and multi-leg betslip support (accumulators/parlays)

## Overview

Step 6 delivers a complete betslips Content Management System with:

- **Admin CMS**: Create, edit, settle, and manage AI-backed betslips (single and multi-leg)
- **Multi-leg Support**: Full accumulator/parlay functionality with individual leg tracking
- **P&L Engine**: Automatic profit/loss calculations with combined odds for multi-leg betslips
- **VIP Feed**: Subscriber-only access to predictions with tier-based filtering and leg visualization
- **Performance Analytics**: Charts and statistics for tracking success rates and ROI
- **Leaderboard Highlights**: Public marketing section for showcasing top performers
- **Settlement Workflow**: Individual leg settlement with automatic betslip outcome calculation

## Database Schema

### Migrations: `supabase/migrations/0008_betslips.sql` + `0009_multileg_betslips.sql`

#### Core Tables

**1. `public.betslips`** (Enhanced)
```sql
- id: uuid (primary key, auto-generated)
- title: text (betslip display name)
- league: text (competition/league name)  
- event_datetime: timestamptz (match date and time)
- home_team: text, away_team: text (team names, for single betslips)
- market_type: text (betting market, e.g., "Match Winner")
- selection: text (specific bet, e.g., "Over 2.5 Goals")
- odds_decimal: numeric(6,2) (decimal odds for single betslips, min 1.01)
- betslip_type: text (single|multi, default 'single')
- combined_odds: numeric(8,2) (calculated combined odds for multi-leg)
- confidence_pct: int (AI confidence 0-100%)
- stake_units: numeric(8,2) (recommended stake, default 1.0)
- status: text (posted|settled|void, auto-calculated for multi-leg)
- outcome: text (pending|won|lost|void, auto-calculated for multi-leg)
- notes: text (analysis and reasoning)
- is_vip: boolean (subscriber-only access, default true)
- min_tier: text (monthly|half_season|full_season access level)
- posted_at: timestamptz (publication time)
- settled_at: timestamptz (outcome decision time)
- created_by/updated_by: uuid (audit fields)
- created_at/updated_at: timestamptz (timestamps)
```

**2. `public.betslip_legs`** (New - Multi-leg Support)
```sql
- id: uuid (primary key, auto-generated)
- betslip_id: uuid (foreign key to betslips, cascade delete)
- leg_order: int (position in accumulator, unique per betslip)
- title: text (leg name, e.g., "FC Barcelona vs Bayern Munich")
- description: text (leg details, e.g., "Score prediction 2-1")
- odds_decimal: numeric(6,2) (individual leg odds, min 1.01)
- status: text (pending|won|lost, individual leg outcome)
- notes: text (optional leg-specific analysis)
- settled_at: timestamptz (when leg was settled)
- created_at/updated_at: timestamptz (timestamps)
- unique(betslip_id, leg_order) (ensures proper ordering)
```

**3. `public.betslip_tags`**
```sql
- id: uuid (primary key)
- betslip_id: uuid (foreign key, cascade delete)
- tag: text (category label)
- unique(betslip_id, tag) (prevents duplicates)
```

**4. `public.leaderboard_highlights`**
```sql
- id: uuid (primary key)
- display_name: text (user display name)
- location: text (optional location)
- headline: text (marketing headline)
- description: text (success description)
- won_amount_usd: numeric(12,2) (winnings amount)
- period_label: text (time period, e.g., "This Month")
- link_url: text (optional external link)
- sort_index: int (display order)
- is_active: boolean (public visibility)
- created_at/updated_at: timestamptz
```

**5. `public.pnl_snapshots`** (Scaffolded for future caching)
```sql
- id: uuid (primary key)
- period_start/period_end: timestamptz (time range)
- total_betslips/won_count/lost_count/void_count: int
- total_units_staked/total_units_won/net_profit_units: numeric(12,2)
- roi_percentage: numeric(6,2)
- created_at: timestamptz
- unique(period_start, period_end)
```

#### Constraints and Validation

- **Odds Validation**: `odds_decimal > 1.01` (applies to both betslips and individual legs)
- **Confidence Range**: `confidence_pct >= 0 AND confidence_pct <= 100`
- **Positive Stakes**: `stake_units > 0`
- **Status Enum**: `status IN ('posted','settled','void')`
- **Outcome Enum**: `outcome IN ('pending','won','lost','void')`
- **Tier Validation**: `min_tier IN ('monthly','half_season','full_season')`
- **Betslip Type**: `betslip_type IN ('single','multi')`
- **Leg Status**: `status IN ('pending','won','lost')` for individual legs
- **Leg Ordering**: `unique(betslip_id, leg_order)` ensures proper sequence

#### Triggers and Functions

**Multi-leg Support Functions:**
- **`calculate_combined_odds(betslip_id)`**: Automatically computes combined odds by multiplying all leg odds for multi-leg betslips
- **`calculate_betslip_outcome(betslip_id)`**: Determines overall betslip outcome based on leg statuses:
  - Any leg lost → betslip lost
  - All legs won → betslip won  
  - At least one pending → betslip pending
- **`update_betslip_from_legs()`**: Trigger function that automatically updates parent betslip when legs change

**Standard Functions:**
- **`stamp_betslip_audit()`**: Auto-sets `created_by`/`updated_by` from `auth.uid()`
- **`set_updated_at()`**: Updates timestamp on record changes for betslips and leaderboard_highlights
- **`trg_update_betslip_from_legs`**: Trigger that calls `update_betslip_from_legs()` on leg changes
- **`trg_betslip_legs_updated_at`**: Maintains updated_at timestamps on leg modifications

**Performance Indexes:** Optimized for posted_at, status, outcome, event_datetime, and leg queries

## Row Level Security (RLS) Policies

### Betslips Access Control

**Anonymous Users**: No access (completely blocked)

**Authenticated Users with Active Subscriptions**:
- **SELECT**: Can view betslips where `user_has_active_subscription(auth.uid()) = true`
- **Tier Filtering**: Only betslips where their subscription tier >= `min_tier`
- **No Write Access**: Cannot create, update, or delete betslips

**Admin/Superadmin Users**:
- **Full CRUD Access**: Complete read/write permissions on all betslips
- **Settlement Authority**: Can change status and outcome fields
- **Audit Compliance**: All changes logged with user identification

### Betslip Legs Access Control

**Anonymous Users**: No access (completely blocked)

**Authenticated Users with Active Subscriptions**:
- **SELECT**: Can view legs for betslips they have access to (inherits parent betslip visibility)
- **No Write Access**: Cannot create, update, or delete legs

**Admin/Superadmin Users**:
- **Full CRUD Access**: Complete read/write permissions on all betslip legs
- **Leg Settlement**: Can update individual leg status (pending/won/lost)
- **Automatic Propagation**: Leg changes trigger parent betslip recalculation

### Related Tables

**Betslip Tags**: Inherit parent betslip visibility rules
**Betslip Legs**: Inherit parent betslip visibility rules with leg-specific CRUD for admins
**Leaderboard Highlights**: Public read access (anon + authenticated), admin-only writes
**P&L Snapshots**: Admin/superadmin access only (sensitive performance data)

## API Routes and Endpoints

### Admin Betslips Management

**`GET /api/admin/betslips`**
- Paginated betslips list with filtering and search
- Query parameters: status, outcome, league, tag, date_from, date_to, search
- Returns: betslips array with tags, pagination metadata

**`POST /api/admin/betslips`**
- Create new betslip with validation
- Required fields: title, league, event_datetime, teams, market_type, selection, odds, confidence
- Auto-generates audit fields and validates business rules

**`GET|PUT|DELETE /api/admin/betslips/[id]`**
- Individual betslip operations
- PUT supports partial updates with tag management
- DELETE cascades to remove associated tags

### Multi-leg Betslip Management

**`GET /api/admin/betslips/[id]/legs`**
- Retrieve all legs for a specific betslip
- Returns legs array ordered by leg_order
- Includes individual leg status and settlement data

**`POST /api/admin/betslips/[id]/legs`**
- Add new leg to existing betslip
- Auto-converts single betslips to multi-leg when second leg is added
- Validates leg data and assigns next leg_order

**`GET|PUT|DELETE /api/admin/betslips/[id]/legs/[legId]`**
- Individual leg operations
- PUT supports status updates (pending/won/lost) with automatic betslip recalculation
- DELETE prevents removal of last remaining leg
- Auto-converts multi-leg to single when reduced to one leg

### Settlement Operations

**`POST /api/admin/betslips/[id]/settle`**
- Mark individual betslip as won/lost/void
- Updates status to 'settled', sets settled_at timestamp
- Calculates and logs P&L for audit trail
- TODO markers for email/WhatsApp notifications

**`POST /api/admin/betslips/bulk-settle`**
- Process multiple betslips with same outcome
- Request: `{ betslip_ids: string[], outcome: 'won'|'lost'|'void', notes?: string }`
- Response: success/failure counts with error details
- Atomic processing with individual error handling

### Leaderboard Management

**`GET|POST /api/admin/leaderboard`**
- Admin CRUD for leaderboard highlights
- Auto-increment sort_index for new entries
- Validation for non-negative amounts

**`GET|PUT|DELETE /api/admin/leaderboard/[id]`**
- Individual highlight operations
- Supports reordering via sort_index updates

**`GET /api/leaderboard-highlights`** (Public)
- Returns active highlights ordered by sort_index
- ISR cached for 5 minutes (300 seconds)
- Anonymous access permitted for marketing page

## User Interface Implementation

### VIP Feed (`/dashboard/vip`)

**Subscription Protection**:
- Server-side verification via `requireActiveSubscriber()`
- Redirects to `/packages` if no active subscription
- Tier-based content filtering using `filterBetslipsByTier()`

**Feed Features**:
- Time-based grouping: Today, Tomorrow, This Week, Upcoming, Recent Results
- Outcome filtering: All, Pending, Won, Lost, Void
- Real-time P&L calculations and statistics
- Responsive card layout with detailed betslip information
- Subscription expiry warnings with renewal prompts

**Betslip Cards**:
- **Single Betslips**: Traditional match details with event timing, teams, selection, and odds
- **Multi-leg Betslips**: Accumulator display with:
  - Betslip type indicator (Single/Multi with leg count)
  - Collapsible leg list showing individual selections, odds, and status
  - Combined odds calculation and combined selection display
  - Individual leg status highlighting (won/lost/pending)
  - Overall betslip outcome based on leg results
- Selection information with odds and confidence bars
- Tag categorization with tier restrictions
- Expandable analysis notes
- P&L display for settled outcomes using effective odds (combined for multi-leg)

### Performance Stats (`/dashboard/stats`)

**Analytics Dashboard**:
- Overall performance metrics (win rate, ROI, total P&L)
- Weekly/monthly trend charts using Recharts
- League-by-league performance breakdowns
- Interactive charts with custom tooltips
- Performance insights and key metrics

**Chart Types**:
- Line charts for P&L trends and win rates
- Bar charts for ROI and monthly performance
- Pie charts for betslip distribution by league
- Horizontal bar charts for league ROI comparison

### Admin Interfaces

**Betslips Management (`/admin/betslips`)**:
- Statistics dashboard with real-time counts
- Advanced filtering by status, outcome, league, tags, dates
- Responsive table (desktop) / cards (mobile) layout
- **Multi-leg Support**: Type column, leg count display, combined odds
- Bulk selection and settlement operations
- **Adaptive Actions**: 
  - Single betslips: Direct Won/Lost/Void buttons
  - Multi-leg betslips: "Manage Legs" link for granular control

**Betslip Form (`/admin/betslips/new|[id]/edit`)**:
- Comprehensive form with validation
- **Betslip Type Selection**: Single or Multi-leg creation
- **Leg Management**: Add/remove/reorder legs for multi-leg betslips
- Team and match details input (for single) or leg details (for multi)
- Market type and selection configuration
- **Automatic Odds**: Combined odds calculation for multi-leg
- Tier-based access control settings
- Tag editor with add/remove functionality
- Rich text notes for analysis

**Multi-leg Settlement Features**:
- **Leg-level Control**: Individual leg status updates (pending/won/lost)
- **Automatic Propagation**: Parent betslip outcome calculated from leg results
- **Status Highlighting**: Clear visual indication of won/lost legs
- **Outcome Logic**: 
  - Any leg lost → betslip lost
  - All legs won → betslip won
  - Mixed/pending → betslip pending

**Standard Settlement Features**:
- Individual settlement with outcome selection (single betslips)
- Bulk settlement modal for multiple betslips
- Real-time validation preventing double settlements
- Audit logging with admin identification
- P&L calculation using effective odds (combined for multi-leg)

## P&L Engine Implementation

### Core Calculation Functions (`src/lib/betslips/pnl.ts`)

**`unitWin(stake_units, odds_decimal)`**
- Returns total units for winning bet: `stake * odds`
- Validates positive stakes and minimum odds (1.01)

**`unitLoss(stake_units)`**
- Returns negative stake units for losing bet
- Input validation for positive stake amounts

**`getEffectiveOdds(betslip)`**
- Returns appropriate odds for P&L calculations
- Single betslips: Uses `odds_decimal`
- Multi-leg betslips: Uses `combined_odds` (calculated from leg odds)

**`outcomePnl(betslip)`**
- Calculates P&L for individual betslip using effective odds
- Won: `(stake * effective_odds) - stake` profit
- Lost: `-stake` loss
- Void: `0` profit (stake returned)
- Pending: `0` profit (no settlement)
- Handles both single and multi-leg betslips seamlessly

**`aggregatePnl(betslips)`**
- Summarizes performance across multiple betslips
- Calculates win rate, ROI, average odds, average confidence
- Uses effective odds for accurate multi-leg P&L
- Returns comprehensive period summary

### Multi-leg Helper Functions

**`calculateCombinedOdds(legs)`**
- Multiplies individual leg odds to get combined odds
- Returns combined decimal odds for accumulator

**`shouldSettleMultiLeg(legs)`**
- Determines overall betslip outcome from leg statuses
- Returns 'won', 'lost', or 'pending' based on leg results

**`getLegStatusSummary(legs)`**
- Provides summary counts: won, lost, pending legs
- Used for UI display and quick status assessment

### Time-Based Aggregation

**`aggregateByWeek(betslips, weeks=12)`**
- Groups betslips by week (Monday-Sunday)
- Returns chronological array of weekly summaries
- Includes period labels and date ranges

**`aggregateByMonth(betslips, months=6)`**
- Groups betslips by calendar month
- Returns monthly performance summaries
- Month names and year for display

### Utility Functions

**Formatting**: `formatUnits()`, `formatPercentage()` for consistent display
**Kelly Criterion**: `kellyStake()` for optimal stake calculations
**Breakeven Analysis**: `breakEvenWinRate()` for profitability thresholds

## Subscription Guard System (`src/lib/betslips/guards.ts`)

### Access Control Functions

**`requireActiveSubscriber(supabaseClient, userId)`**
- Server-side subscription verification
- Redirects to `/packages` if no active subscription
- Returns subscription tier and expiry information

**`canAccessBetslip(userTier, requiredTier)`**
- Tier hierarchy validation: monthly < half_season < full_season
- Boolean return for access permission

**`filterBetslipsByTier(betslips, userTier)`**
- Filters betslip arrays based on user's subscription level
- Removes inaccessible content before rendering

### Time-Based Utilities

**`groupBetslipsByTime(betslips)`**
- Organizes betslips into user-friendly time groups
- Handles upcoming vs. past events with smart categorization
- Returns grouped object for UI rendering

**Subscription Management**:
- `getDaysUntilExpiry()`, `formatExpiryMessage()`, `isExpiringSoon()`
- Provides user-friendly subscription status information

## Responsive Design Implementation

### Mobile-First Approach (320px-1280px)

**Breakpoint Strategy**:
- **320px**: Single column, stacked layouts, touch-friendly controls
- **375px**: Standard mobile with optimized spacing
- **768px**: Tablet layouts with two-column arrangements
- **1024px**: Desktop layouts with full table views
- **1280px**: Large desktop with optimized spacing

**Component Responsiveness**:

**Admin Table**: Desktop table view transforms to mobile card layout
**VIP Feed**: Responsive card grid adapts from 1-column to 2-column
**Forms**: Single column mobile to side-by-side desktop layouts
**Charts**: Responsive containers with appropriate sizing
**Filters**: Stacked mobile to inline desktop arrangements

### Accessibility Features

**Focus Management**: Cyan blue focus rings on all interactive elements
**Keyboard Navigation**: Full tab order and enter/space activation
**Touch Targets**: Minimum 44px height/width for mobile usability
**Screen Reader**: Proper ARIA labels and semantic structure
**Color Contrast**: WCAG AA compliance with cyan/black/white palette

## Security Implementation

### Data Protection

**RLS Enforcement**: Database-level access control with explicit policies
**Service Role Security**: No service role key exposure to client-side code
**Input Validation**: Comprehensive validation on all user inputs
**Audit Trail**: Complete event logging for all betslip operations

### Business Rule Enforcement

**Outcome Validation**: Prevents invalid status transitions for betslips and legs
**Settlement Protection**: Guards against double-settlement at both betslip and leg levels
**Multi-leg Integrity**: Ensures leg count consistency with betslip type
**Automatic Calculations**: Server-side triggers prevent manual manipulation of combined odds
**Tier Compliance**: Enforces subscription-based access restrictions
**Admin Authorization**: Server-side role verification for all operations
**Leg Access Control**: RLS policies ensure legs inherit parent betslip visibility

## Testing Procedures

### Database Testing

1. **Apply Migration**: Execute `0008_betslips.sql` in Supabase
2. **Verify RLS**: Test policies with different user roles and subscription states
3. **Constraint Validation**: Test all check constraints and triggers
4. **Index Performance**: Verify query performance with sample data

### Subscription Access Testing

1. **No Subscription**: Verify redirect to packages page
2. **Expired Subscription**: Confirm access denial
3. **Active Subscription**: Test tier-based content filtering
4. **Tier Hierarchy**: Validate monthly < half_season < full_season access

### Admin Functionality Testing

1. **CRUD Operations**: Create, read, update, delete betslips and legs
2. **Multi-leg Creation**: Test single-to-multi conversion and leg management
3. **Settlement Workflow**: 
   - Individual leg settlement (pending/won/lost)
   - Automatic betslip outcome calculation
   - Bulk settlement operations for single betslips
4. **Validation Rules**: Test all form validations and business rules
5. **Type Conversions**: Test single↔multi betslip type transitions
6. **Combined Odds**: Verify automatic calculation accuracy
7. **Audit Logging**: Verify comprehensive logging of admin actions and leg changes

### User Experience Testing

1. **VIP Feed**: 
   - Filter functionality and card interactions
   - Multi-leg betslip display with collapsible legs
   - Leg status highlighting (won/lost/pending)
   - Combined odds and accumulator information
   - Responsive layout across all breakpoints
2. **Stats Dashboard**: Chart rendering using effective odds, data accuracy, responsive behavior
3. **Multi-leg P&L**: Verify combined odds are used in profit calculations
4. **Navigation**: Cross-page navigation and breadcrumb functionality
5. **Performance**: Loading times and chart rendering performance with leg data

### Responsive Testing

**Device Testing**: 320px, 375px, 768px, 1024px, 1280px breakpoints
**Touch Interface**: Touch targets and gesture support
**Keyboard Navigation**: Tab order and focus management
**Screen Reader**: Accessibility compliance testing

## Performance Optimization

### Database Optimization

**Indexes**: Optimized for common query patterns (date, status, outcome filtering)
**RLS Efficiency**: Minimal policy overhead with proper index usage
**Query Optimization**: Efficient joins and filtering for user dashboard

### Frontend Optimization

**Lazy Loading**: Charts and components load as needed
**Memoization**: React components optimized for minimal re-renders
**ISR Caching**: Public leaderboard cached with 5-minute revalidation
**Bundle Splitting**: Administrative and user code separated for optimal loading

## Integration Points

### Email System (Scaffolded)

TODO markers placed for:
- Settlement notifications to subscribers
- Performance reports
- Outcome alerts and updates

### WhatsApp Integration (Scaffolded)

TODO markers for:
- Instant betslip notifications
- Settlement alerts
- Performance summaries

### Analytics (Ready)

Foundation prepared for:
- Conversion tracking
- User engagement metrics
- Performance analytics

## Security Considerations

### Environment Variables

All existing variables maintained:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

### Access Control

- Anonymous users cannot access betslips data
- Subscription verification required for all VIP content
- Admin operations require explicit role verification
- Audit trail for all sensitive operations

## Future Enhancement Hooks

### Immediate (Next Steps)

- Email SMTP integration for settlement notifications
- WhatsApp Business API for instant alerts
- Real-time notifications via WebSockets
- Advanced analytics and reporting

### Medium-term

- Automated settlement via sports data APIs
- Advanced P&L analytics with forecasting
- User-specific performance tracking
- Social features and community engagement

### Long-term

- Machine learning model performance tracking
- Predictive analytics for betslip success
- Advanced risk management tools
- Multi-currency and international support

## Deployment Checklist

### Database Deployment

1. **Apply Migration**: Execute `0008_betslips.sql` in production
2. **Verify Policies**: Test RLS with production user data
3. **Index Performance**: Monitor query performance on large datasets
4. **Backup Strategy**: Ensure new tables included in backup plan

### Application Deployment

1. **Environment Variables**: Verify all configs present and correct
2. **Admin Accounts**: Ensure proper admin/superadmin role assignments
3. **Subscription Integration**: Test subscription verification flows
4. **Performance Monitoring**: Set up alerts for settlement operations

### Production Testing

1. **End-to-End Flow**: Complete admin creation → user access → settlement cycle
2. **Load Testing**: Verify performance with concurrent users and large datasets
3. **Security Validation**: Penetration testing on subscription and settlement systems
4. **Monitoring Setup**: Alerts for failed settlements and system errors

---

**Status**: ✅ **COMPLETE** - Betslips CMS + P/L Engine fully implemented with multi-leg accumulator support, comprehensive admin management, VIP subscriber access, performance analytics, responsive design, and production-ready security measures.

The system provides a complete foundation for AI-backed betslips distribution with sophisticated P&L tracking, multi-leg betslip management, automatic combined odds calculation, leg-level settlement control, tier-based access control, and professional admin interfaces for content management and settlement operations. 