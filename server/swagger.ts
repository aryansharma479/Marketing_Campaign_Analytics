import type { Express } from "express";

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Campaign Analytics Dashboard API",
    description: "RESTful API for marketing campaign analytics, metrics, and AI-powered forecasting",
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "support@campaigniq.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User authentication endpoints" },
    { name: "Campaigns", description: "Campaign management endpoints" },
    { name: "Metrics", description: "Campaign metrics and analytics" },
    { name: "Forecasts", description: "AI-powered predictions" },
    { name: "Dashboard", description: "Dashboard data aggregation" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "analyst", "viewer"] },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 50 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          role: { type: "string", enum: ["admin", "analyst", "viewer"] },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Campaign: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["active", "paused", "completed", "draft"] },
          channel: { type: "string", enum: ["email", "social", "ppc", "display", "affiliate"] },
          budget: { type: "string" },
          spent: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time", nullable: true },
          targetAudience: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CampaignCreate: {
        type: "object",
        required: ["name", "channel", "budget", "startDate"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string" },
          status: { type: "string", enum: ["active", "paused", "completed", "draft"] },
          channel: { type: "string", enum: ["email", "social", "ppc", "display", "affiliate"] },
          budget: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time", nullable: true },
          targetAudience: { type: "string" },
        },
      },
      CampaignMetric: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          campaignId: { type: "string", format: "uuid" },
          date: { type: "string", format: "date-time" },
          impressions: { type: "integer" },
          clicks: { type: "integer" },
          conversions: { type: "integer" },
          revenue: { type: "string" },
          cost: { type: "string" },
        },
      },
      Forecast: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          campaignId: { type: "string", format: "uuid", nullable: true },
          forecastType: { type: "string", enum: ["conversion_rate", "roi", "revenue"] },
          forecastDate: { type: "string", format: "date-time" },
          predictedValue: { type: "string" },
          confidenceLower: { type: "string" },
          confidenceUpper: { type: "string" },
          confidenceLevel: { type: "string" },
          modelVersion: { type: "string" },
        },
      },
      PaginatedResponse: {
        type: "object",
        properties: {
          items: { type: "array", items: {} },
          total: { type: "integer" },
          page: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      KPIs: {
        type: "object",
        properties: {
          conversionRate: { type: "number" },
          conversionRateTrend: { type: "number" },
          ctr: { type: "number" },
          ctrTrend: { type: "number" },
          roi: { type: "number" },
          roiTrend: { type: "number" },
          totalImpressions: { type: "integer" },
          impressionsTrend: { type: "number" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          correlationId: { type: "string" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          409: {
            description: "Email or username already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with credentials",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token using refresh token cookie",
        responses: {
          200: {
            description: "Token refreshed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout and revoke tokens",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user info",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/campaigns": {
      get: {
        tags: ["Campaigns"],
        summary: "Get paginated list of campaigns",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "channel", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Paginated campaigns list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/PaginatedResponse" },
                    {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Campaign" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Campaigns"],
        summary: "Create a new campaign",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CampaignCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Campaign created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Campaign" },
              },
            },
          },
        },
      },
    },
    "/campaigns/{id}": {
      get: {
        tags: ["Campaigns"],
        summary: "Get campaign by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Campaign details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Campaign" },
              },
            },
          },
          404: {
            description: "Campaign not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Campaigns"],
        summary: "Update campaign",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CampaignCreate" },
            },
          },
        },
        responses: {
          200: {
            description: "Campaign updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Campaign" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Campaigns"],
        summary: "Delete campaign",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          204: { description: "Campaign deleted" },
          404: {
            description: "Campaign not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/campaigns/{id}/metrics": {
      get: {
        tags: ["Metrics"],
        summary: "Get metrics for a campaign",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Campaign metrics",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CampaignMetric" },
                },
              },
            },
          },
        },
      },
    },
    "/metrics": {
      get: {
        tags: ["Metrics"],
        summary: "Get all metrics",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "All metrics",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CampaignMetric" },
                },
              },
            },
          },
        },
      },
    },
    "/forecasts": {
      get: {
        tags: ["Forecasts"],
        summary: "Get forecasts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "campaignId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "forecastType", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Forecasts list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Forecast" },
                },
              },
            },
          },
        },
      },
    },
    "/forecasts/predict": {
      post: {
        tags: ["Forecasts"],
        summary: "Generate new predictions",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  campaignId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Generated predictions",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Forecast" },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard data with KPIs, campaigns, metrics, and forecasts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "channel", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Dashboard data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    kpis: { $ref: "#/components/schemas/KPIs" },
                    campaigns: { $ref: "#/components/schemas/PaginatedResponse" },
                    metrics: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CampaignMetric" },
                    },
                    forecasts: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Forecast" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/analytics": {
      get: {
        tags: ["Dashboard"],
        summary: "Get detailed analytics data",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Analytics data with extended KPIs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    kpis: {
                      type: "object",
                      properties: {
                        conversionRate: { type: "number" },
                        ctr: { type: "number" },
                        roi: { type: "number" },
                        totalRevenue: { type: "number" },
                        totalCost: { type: "number" },
                        profitMargin: { type: "number" },
                      },
                    },
                    campaigns: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Campaign" },
                    },
                    metrics: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CampaignMetric" },
                    },
                    forecasts: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Forecast" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.get("/api/docs/openapi.json", (_req, res) => {
    res.json(swaggerDocument);
  });

  const swaggerUI = `
<!DOCTYPE html>
<html>
<head>
  <title>Campaign Analytics API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>
  `;

  app.get("/api/docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(swaggerUI);
  });
}

export { swaggerDocument };
