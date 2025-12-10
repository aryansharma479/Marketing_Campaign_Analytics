# Campaign Analytics Dashboard - Design Guidelines

## Design Approach

**Selected System:** Carbon Design System (IBM) - Optimized for data-heavy enterprise applications with excellent support for charts, tables, and complex interfaces.

**Rationale:** This dashboard requires efficient data visualization, clear information hierarchy, and professional enterprise aesthetics. Carbon's structured approach to data-dense interfaces makes it ideal for analytics platforms.

## Typography System

**Font Families:**
- Primary: 'IBM Plex Sans' (via Google Fonts CDN)
- Monospace: 'IBM Plex Mono' for numerical data and metrics

**Type Scale:**
- Dashboard Title: text-3xl, font-semibold
- Section Headers: text-xl, font-semibold  
- Card Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Metric Values: text-4xl, font-bold (monospace)
- Metric Labels: text-sm, font-medium
- Helper Text: text-xs, font-normal

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8
- Grid gaps: gap-4 or gap-6
- Button padding: px-6 py-2

**Container Structure:**
- Dashboard wrapper: max-w-screen-2xl mx-auto px-6
- Content sections: w-full with internal grid structures
- Sidebar (if included): fixed width of w-64

## Core Components

### Navigation
**Top Navigation Bar:**
- Fixed header with h-16
- Includes logo, main navigation links, user profile dropdown
- Search bar (w-96) for campaign filtering
- Notification bell icon with badge counter

**Side Navigation (Optional):**
- Collapsible sidebar for campaign categories
- Active state with border-l-4 indicator
- Icons from Heroicons (CDN)

### Dashboard Layout

**Grid Structure:**
- Desktop: 3-column grid (grid-cols-3) for KPI cards
- Tablet: 2-column grid (md:grid-cols-2)
- Mobile: Single column (grid-cols-1)

**KPI Summary Cards:**
- Rounded corners: rounded-lg
- Shadow: shadow-md with hover:shadow-lg
- Layout: Flex column with metric value prominent at top
- Include trend indicator (arrow icon) with percentage change
- Minimum height: min-h-32

### Chart Components

**Main Chart Container:**
- Full-width responsive container
- Height: h-96 on desktop, h-72 on tablet, h-64 on mobile
- Border and shadow for definition
- Padding: p-6 for internal spacing

**Chart Types Required:**
1. Line charts for conversion rate trends
2. Bar charts for CTR comparisons
3. Donut/Pie chart for ROI distribution
4. Area chart for campaign performance over time

**Chart Library:** Chart.js via CDN with custom responsive configuration

### Data Tables

**Campaign List Table:**
- Sticky header row
- Alternating row treatment for readability
- Sortable column headers with sort icons
- Pagination controls at bottom (showing "1-10 of 243 campaigns")
- Row hover state for interactivity
- Actions column with icon buttons (view, edit, delete)

### Form Components

**Filters Panel:**
- Collapsible section at top of dashboard
- Form inputs: Date range picker, campaign status dropdown, search input
- Apply/Reset buttons (primary + secondary)
- Grid layout for filter fields (grid-cols-4 on desktop)

**Authentication Forms:**
- Centered card layout with max-w-md
- Form spacing: space-y-4
- Input fields with labels above
- Password field with show/hide toggle icon
- Submit button full width
- "Forgot password" and "Sign up" links

### Predictive Model Display

**Forecast Card:**
- Distinct visual treatment (subtle border treatment)
- "Powered by AI" badge
- Confidence interval display
- Visual indicator (progress bar or gauge)
- Metric projections with timeframe labels

### Icons
**Icon Library:** Heroicons (via CDN) for all interface icons
- Navigation icons: size-5
- Action buttons: size-4
- Metric indicators: size-6
- Use outline style for default, solid for active states

## Component States

**Interactive Elements:**
- Buttons: Transform scale-95 on active, shadow transitions
- Cards: Subtle elevation change on hover
- Links: Underline on hover
- Form inputs: Border width change on focus

## Responsive Breakpoints

**Desktop (lg: 1024px+):**
- Full 3-column KPI grid
- Side-by-side chart layouts
- Expanded navigation with labels

**Tablet (md: 768px-1023px):**
- 2-column KPI grid
- Stacked charts
- Condensed navigation

**Mobile (< 768px):**
- Single column layout
- Hamburger menu navigation
- Simplified chart views
- Bottom navigation bar for key actions

## Accessibility Implementation

- All interactive elements minimum touch target: 44x44px
- Keyboard navigation with visible focus states (ring-2 ring-offset-2)
- ARIA labels for all icon-only buttons
- Proper heading hierarchy (h1 > h2 > h3)
- Form labels associated with inputs
- Skip to main content link
- Color contrast ratios meet WCAG 2.1 AA standards

## Dashboard Sections (Order)

1. **Header:** Logo, navigation, user profile
2. **Page Title & Actions:** Dashboard title with "Export" and "Refresh" buttons
3. **Date Range Selector:** Prominent date picker for time-based filtering
4. **KPI Overview:** 3-card grid showing Conversion Rate, CTR, ROI
5. **Primary Visualization:** Large conversion rate trend chart
6. **Secondary Charts:** 2-column grid with CTR and ROI charts
7. **Predictive Insights:** AI forecast card with projections
8. **Campaign Performance Table:** Sortable, paginated list
9. **Footer:** Links, copyright, version info

## Images

No hero images required for this dashboard application. All visual content is data-driven through charts and metrics. Icons serve all decorative purposes.