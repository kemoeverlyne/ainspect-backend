# AInspect Backend API

A comprehensive Node.js/Express backend API for the AInspect home inspection management system.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **AI Integration**: OpenAI and Anthropic AI for inspection analysis
- **File Management**: Google Cloud Storage integration
- **Email Services**: SendGrid integration
- **Payment Processing**: Stripe integration
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for job queues and caching
- **Documentation**: Swagger/OpenAPI documentation
- **Monitoring**: Sentry error tracking
- **Security**: Rate limiting, CSRF protection, CORS

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for job queues)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ainspect-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ainspect

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=your-session-secret-key

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key

# App Configuration
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GENERAL_RATE_LIMIT=1000
API_RATE_LIMIT=100
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **API Endpoints**: `http://localhost:5000/api`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type check
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run db:push      # Push database schema changes
```

## Project Structure

```
ainspect-backend/
├── server/                 # Main server code
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── ai/               # AI-related functionality
│   ├── events/           # Event handlers
│   ├── tests/            # Test files
│   └── utils/            # Utility functions
├── shared/               # Shared types and schemas
├── dist/                 # Built application
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── drizzle.config.ts     # Database configuration
└── Dockerfile           # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Inspections
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Create inspection
- `GET /api/inspections/:id` - Get inspection details
- `PUT /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Delete inspection

### AI Analysis
- `POST /api/ai/analyze` - Analyze inspection data
- `POST /api/ai/generate-report` - Generate inspection report
- `POST /api/ai/defect-analysis` - Analyze defects

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### File Management
- `POST /api/upload` - Upload files
- `GET /api/files/:id` - Get file
- `DELETE /api/files/:id` - Delete file

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:

- `users` - User accounts
- `companies` - Company information
- `inspections` - Inspection records
- `reports` - Generated reports
- `files` - File metadata
- `narratives` - AI-generated narratives

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CSRF Protection**: Cross-site request forgery protection
- **CORS**: Configurable cross-origin resource sharing
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Request validation with Joi/Zod

## Development

### Adding New Routes

1. Create route handler in `server/routes/`
2. Register route in `server/routes.ts`
3. Add tests in `server/tests/`
4. Update API documentation

### Database Changes

1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update types and interfaces as needed

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- inspections.test.ts
```

## Deployment

### Docker

```bash
# Build image
docker build -t ainspect-backend .

# Run container
docker run -p 5000:5000 --env-file .env ainspect-backend
```

### Environment Variables for Production

Ensure all required environment variables are set:
- Database connection string
- API keys for external services
- Session secrets
- CORS origins
- Rate limiting configuration

## Monitoring

- **Error Tracking**: Sentry integration
- **Logging**: Winston logger with structured logging
- **Health Checks**: Built-in health check endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

