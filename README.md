# KaamMitra - Hyperlocal Job Finder

KaamMitra is a web platform that connects daily wage workers with nearby employers through an intelligent, location-based matching system. The platform focuses on secure, verified interactions and streamlined job discovery with enhanced user experience features.

![KaamMitra](https://github.com/Eshan-alt/KaamMitra/blob/main/generated-icon.png)

## Purpose

KaamMitra addresses the challenge of connecting skilled daily wage workers (like construction workers, plumbers, housemaids, and electricians) with employers who need their services. The platform eliminates middlemen and creates direct connections, ensuring fair wages for workers and reliable service for employers.

## Key Features

- **Location-Based Job Matching**: Connects workers with nearby job opportunities
- **Dual Dashboards**: Separate interfaces for workers and employers
- **Verification System**: Government ID verification for both workers and employers
- **Trust Scoring**: Rating system to track worker reliability and quality
- **Email Verification**: Secure authentication using email verification codes
- **WhatsApp Integration**: No app download required - communicate via WhatsApp
- **Job Management**: Post, search, apply, and manage job listings
- **Profile Management**: Detailed worker profiles with skills and experience
- **Responsive Design**: Works on all devices (mobile, tablet, desktop)

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with express-session
- **Email**: Nodemailer for verification emails
- **Storage**: File uploads with Multer
- **CSS Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query

## Getting Started

For detailed instructions on setting up the project locally, see the [Local Deployment Guide](LOCAL_DEPLOYMENT.md).

### Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies: `npm install`
4. Set up the database: `npm run db:push`
5. Start the development server: `npm run dev`

## Project Structure

```
├── client/                # Frontend code
│   ├── src/               # React application source
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main application component
├── server/                # Backend code
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── email-service.ts   # Email verification service
│   ├── index.ts           # Express server entry point
│   ├── routes.js          # API route definitions
│   ├── seed.js            # Database seeding
│   ├── storage.js         # Data access layer
│   └── vite.js            # Vite integration
├── shared/                # Shared code between client and server
│   └── schema.js          # Database schema definitions
├── uploads/               # Upload directory for verification documents
├── .env.example           # Example environment variables
├── LOCAL_DEPLOYMENT.md    # Local deployment instructions
└── package.json           # Project dependencies and scripts
```

## Development Guidelines

### Code Conversion

The codebase has been converted from TypeScript to JavaScript using ES module syntax. When working with the code:

1. Use ES module syntax (`import`/`export`) in all JavaScript files
2. Add `.js` extension when importing local files
3. Be mindful of the module type in package.json (`"type": "module"`)

### Database Access

The application uses Drizzle ORM with PostgreSQL. Key database components:

1. Schema definitions in `shared/schema.js`
2. Database connection in `server/db.ts`
3. Data access layer in `server/storage.js`

### Authentication Flow

1. User registration: `/api/register`
2. Email verification: `/api/verify-email`
3. Login: `/api/login`
4. Session persistence with PostgreSQL session store
5. Protected routes requiring authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please open an issue on GitHub.