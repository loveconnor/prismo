# Prismo

A modern educational platform built with Angular and Flask, featuring interactive coding labs, widget-based learning modules, and gamification elements. Prismo provides an engaging environment for learning programming concepts with real-time code execution and feedback.

## 🚀 Features

- **Interactive Coding Labs** - Hands-on coding exercises with real-time feedback
- **Widget System** - Modular, reusable educational components
- **Module Generator** - AI-powered learning module creation
- **Code Execution Engine** - Support for Python, JavaScript, Java, and more
- **Gamification** - Achievement system to track learning progress
- **Analytics Dashboard** - Track learning metrics and progress
- **OAuth Integration** - Secure authentication with AWS Cognito
- **Server-Side Rendering** - Optimized performance with Angular SSR
- **Modern UI** - Built with Tailwind CSS and Angular CDK

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.14 or higher)
- **Angular CLI** (20.3.5)
- **AWS Account** (for Cognito and DynamoDB)
- **uv** (Python package manager)

## 🛠️ Installation

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create environment files in `src/environments/`:
   - `environment.ts` (development)
   - `environment.prod.ts` (production)

3. **Start development server:**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Access the application:**
   Navigate to `http://localhost:4200/`

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   uv sync
   ```

3. **Configure AWS services:**
   - Set up AWS Cognito User Pool
   - Configure DynamoDB tables
   - Set environment variables

   See `backend/OAUTH_SETUP.md` for detailed AWS configuration.

4. **Initialize database tables:**
   ```bash
   python setup_tables.py
   ```

5. **Start the backend server:**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
prismo/
├── src/                          # Angular frontend
│   ├── app/                      # Application modules
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/            # Dashboard views
│   │   ├── labs/                 # Coding labs
│   │   ├── widget-lab/           # Widget laboratory
│   │   └── components/           # Reusable components
│   ├── components/               # UI components
│   │   ├── ui/                   # Base UI components
│   │   ├── labs/                 # Lab-specific components
│   │   ├── widgets/              # Widget components
│   │   └── modules/              # Module components
│   ├── services/                 # Angular services
│   ├── guards/                   # Route guards
│   ├── interceptors/             # HTTP interceptors
│   └── types/                    # TypeScript type definitions
├── backend/                      # Flask backend
│   ├── app/                      # Application core
│   │   ├── routes.py             # API routes
│   │   ├── auth_routes.py        # Authentication endpoints
│   │   ├── learning_routes.py   # Learning module endpoints
│   │   ├── module_generator_routes.py  # AI module generation
│   │   ├── gamification_routes.py      # Achievement system
│   │   ├── analytics_routes.py  # Analytics endpoints
│   │   ├── models.py             # Data models
│   │   ├── orm.py                # DynamoDB ORM
│   │   └── ace_engine.py         # Code execution engine
│   ├── config.py                 # Configuration
│   └── main.py                   # Application entry point
├── public/                       # Static assets
└── angular.json                  # Angular configuration
```

## 🔧 Available Scripts

### Frontend

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests
- `npm run serve:ssr:prismo` - Serve SSR build

### Backend

- `python main.py` - Start Flask server
- `python setup_tables.py` - Initialize DynamoDB tables
- `python test_code_execution.py` - Test code execution engine
- `python test_java_execution.py` - Test Java support
- `python test_module_generator.py` - Test module generation

## 🔐 Environment Variables

### Frontend (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  cognitoUserPoolId: 'your-user-pool-id',
  cognitoClientId: 'your-client-id',
  awsRegion: 'us-east-1'
};
```

### Backend

Create a `.env` file in the `backend/` directory:

```env
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
DYNAMODB_TABLE_PREFIX=prismo
FLASK_ENV=development
```

## 🧪 Testing

### Frontend Tests

```bash
ng test
```

### Backend Tests

```bash
cd backend
python -m pytest
```

## 🏗️ Building for Production

### Frontend

```bash
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory.

### Backend

The Flask application can be deployed using various methods:
- AWS Elastic Beanstalk
- Docker containers
- Traditional WSGI servers (Gunicorn, uWSGI)

## 📚 Key Technologies

### Frontend
- **Angular 20** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **CodeMirror** - Code editor component
- **KaTeX** - Math rendering
- **Marked** - Markdown parsing
- **GSAP** - Animation library

### Backend
- **Flask** - Python web framework
- **AWS Cognito** - Authentication service
- **DynamoDB** - NoSQL database
- **boto3** - AWS SDK for Python
- **JWT** - Token-based authentication
- **Anthropic Claude API** - AI-powered features

## 🎮 Features Guide

### Labs
Interactive coding exercises with multiple programming language support. Each lab includes:
- Problem description with rendered markdown
- Code editor with syntax highlighting
- Test cases for validation
- Real-time feedback

### Widgets
Reusable learning components that can be embedded in various contexts:
- Interactive demonstrations
- Visual explanations
- Practice exercises
- Mini-projects

### Module Generator
AI-powered tool to create custom learning modules:
- Natural language input
- Automatic content generation
- Structured curriculum creation
- Customizable difficulty levels

### Analytics
Track learning progress with detailed metrics:
- Time spent on labs
- Completion rates
- Skill progression
- Achievement tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For questions or issues, please open an issue in the repository.

## 🔗 Additional Documentation

- [Backend Setup Guide](backend/README.md)
- [OAuth Configuration](backend/OAUTH_SETUP.md)
- [Java Support](TEST_JAVA_SUPPORT.md)
- [API Routes Documentation](backend/COMPLETE_API_ROUTES.md)

---

Built with ❤️ for education
