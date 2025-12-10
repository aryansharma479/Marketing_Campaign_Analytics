# Campaign Analytics Dashboard

## Overview
A comprehensive marketing analytics dashboard for visualizing campaign KPIs and integrating a predictive Model API to forecast conversion rates and ROI. Built with React, Express, PostgreSQL, and Drizzle ORM.

## Recent Changes
- **2024-12-10**: Full implementation complete
  - JWT authentication with RS256-compatible structure (access tokens 15min, refresh tokens 7 days)
  - PostgreSQL database with Drizzle ORM
  - Full CRUD operations for campaigns with pagination, sorting, and filtering
  - Interactive charts using Recharts (line, bar, area, donut)
  - KPI cards for conversion rate, CTR, ROI, and impressions
  - Predictive forecast card with AI-powered insights
  - In-memory caching for performance optimization
  - Circuit breaker pattern for external API resilience
  - Swagger/OpenAPI documentation at /api/docs
  - Comprehensive unit and integration tests with Jest
  - Dockerfile and GitLab CI/CD pipeline configuration
  - ESLint configuration for code quality
  - Data aligned with Kaggle Marketing Campaign Performance Dataset structure

## Project Architecture

### Frontend (`client/src/`)
- **Pages**: Login, Register, Dashboard, Campaigns, Analytics, Settings
- **Components**: KPI cards, charts, campaign table, forecast card, filters panel
- **State Management**: React Query for server state, Context for auth/theme
- **Routing**: Wouter for client-side navigation
- **Styling**: Tailwind CSS with Carbon Design System tokens

### Backend (`server/`)
- **Authentication**: JWT with httpOnly cookie refresh tokens
- **API**: RESTful endpoints for campaigns, metrics, forecasts
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized with correlation IDs
- **Caching**: In-memory cache with TTL support
- **Circuit Breaker**: Resilience pattern for external API calls
- **Documentation**: Swagger UI at /api/docs

### Database Schema (`shared/schema.ts`)
- `users`: User accounts with role-based access (admin, analyst, viewer)
- `campaigns`: Marketing campaigns with status, channel, budget
- `campaign_metrics`: Daily aggregated performance data
- `forecasts`: Predictive model outputs
- `kpi_summaries`: Pre-aggregated KPI data
- `refresh_tokens`: JWT refresh token storage
- `token_blacklist`: Revoked access tokens

### Testing (`tests/`)
- Unit tests for cache, circuit breaker, and validation logic
- Integration tests for API structure validation
- Jest test runner with ESM support
- Coverage target: 50%+

### DevOps
- **Dockerfile**: Multi-stage build for production
- **GitLab CI/CD**: Automated testing, linting, building, and deployment
- **ESLint**: Code quality and consistency checks
- **Security**: npm audit for vulnerability scanning

## Key Files
- `shared/schema.ts` - Database schema and Zod validation schemas
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Database access layer
- `server/jwt.ts` - JWT token generation and verification
- `server/cache.ts` - In-memory caching implementation
- `server/circuit-breaker.ts` - Circuit breaker for API resilience
- `server/swagger.ts` - OpenAPI documentation
- `client/src/App.tsx` - Main React application with routing

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens
- `GET /api/auth/me` - Get current user info

### Campaigns
- `GET /api/campaigns` - List campaigns (paginated)
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/metrics` - Get campaign metrics

### Analytics
- `GET /api/metrics` - Get all metrics
- `GET /api/forecasts` - Get forecasts
- `POST /api/forecasts/predict` - Generate predictions
- `GET /api/dashboard` - Get dashboard data
- `GET /api/analytics` - Get analytics data
- `GET /api/health` - Health check endpoint

### Documentation
- `GET /api/docs` - Swagger UI
- `GET /api/docs/openapi.json` - OpenAPI specification

## Demo Accounts
- **Admin**: admin@campaigniq.com / password123
- **Analyst**: analyst@campaigniq.com / password123
- **Viewer**: viewer@campaigniq.com / password123

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with demo data
- `npm run lint` - Run ESLint checks
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:coverage` - Run tests with coverage
- `npm run audit:check` - Run security audit

## User Preferences
- Modern dashboard design
- Dark/Light theme support
- Enterprise-grade security with JWT
- PostgreSQL for data persistence
- Comprehensive API documentation

## Data Model (Kaggle-Aligned)
Based on Kaggle Marketing Campaign Performance Dataset:
- Company, Campaign_Type, Target_Audience
- Duration, Channels_Used
- Conversion_Rate, Acquisition_Cost, ROI
- Location, Language
- Clicks, Impressions, Engagement_Score
- Customer_Segment, Date
