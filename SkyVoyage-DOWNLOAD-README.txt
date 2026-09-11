SkyVoyage — downloadable project
=================================

This ZIP contains the updated SkyVoyage website project, including the refreshed UI,
frontend, API server, shared API contracts, and database package.

To run locally:
1. Install Node.js 20+ and pnpm.
2. Run: pnpm install
3. Configure the required environment variables for Clerk, Duffel, Stripe, and the database.
4. Start the existing web and API development commands from the package scripts/workflows.

Secrets are intentionally not included in this download.
The production site also needs the backend API and configured provider credentials;
the built frontend alone is not an offline static copy of the booking service.
