# Prismo 🎓

> An intelligent educational platform powered by AI for interactive coding labs and personalized learning experiences.

Prismo is a full-stack web application that combines Angular 20 and Python Flask to deliver an adaptive learning platform with AI-powered code execution, review, and feedback capabilities.

---

## 🌟 Features

### 🎯 Core Learning Platform
- **Interactive Labs**: Widget-based learning modules with step-by-step progression
- **Real-time Code Execution**: Execute Python, JavaScript, and Java code directly in the browser
- **AI-Powered Code Review**: Integrated Claude AI and Google Gemini for intelligent code feedback
- **Progress Tracking**: Comprehensive session tracking with detailed analytics
- **Gamification**: Achievement system with skill trees and mastery tracking

### 🧩 Widget System
- **Code Editor**: Syntax-highlighted editor with multi-language support (CodeMirror)
- **MCQ Widgets**: Multiple choice questions with instant feedback
- **Fill-in-the-Blank**: Interactive completion exercises
- **Markdown Renderer**: Rich content display with KaTeX math support
- **Custom Widgets**: Extensible architecture for custom learning components

### 🤖 AI Integration
- **Claude via AWS Bedrock**: Advanced code review and grading
- **Google Gemini**: Alternative AI provider for diverse perspectives
- **Unified AI API**: Single interface for multiple AI providers
- **Code Execution Sandbox**: Safe execution environment for student code
- **Intelligent Test Generation**: Auto-generates test cases for functions without main methods

### 📊 Analytics & Insights
- **Learning Analytics**: Track time spent, completion rates, and progress
- **Skill Mastery**: Monitor skill development across topics
- **ACE Engine**: Adaptive learning recommendations based on performance
- **Widget Interactions**: Detailed interaction tracking for each component

---

## 🏗️ Architecture

```
prismo/
├── src/                          # Angular 20 Frontend
│   ├── app/                      # Application components
│   │   ├── labs/                 # Lab pages and templates
│   │   ├── dashboard/            # User dashboard
│   │   ├── auth/                 # Authentication pages
│   │   └── widget-lab/           # Widget testing environment
│   ├── components/               # Reusable UI components
│   │   ├── widgets/              # Learning widgets
│   │   ├── ui/                   # UI primitives
│   │   └── labs/                 # Lab-specific components
│   ├── services/                 # Angular services
│   │   ├── auth.service.ts       # Authentication
│   │   ├── api.service.ts        # API communication
│   │   ├── module-session.service.ts  # Session tracking
│   │   └── user-progress.service.ts   # Progress management
│   └── environments/             # Environment configs
│
└── backend/                      # Python Flask Backend
    ├── app/                      # Application modules
    │   ├── auth_routes.py        # Supabase authentication
    │   ├── ai_routes.py          # AI integration (Claude/Gemini)
    │   ├── learning_routes.py    # Labs and modules
    │   ├── module_session_routes.py  # Session tracking
    │   ├── gamification_routes.py    # Achievements & skills
    │   ├── analytics_routes.py   # Analytics endpoints
    │   ├── orm_supabase.py       # Database ORM
    │   └── ace/                  # ACE adaptive engine
    ├── templates/                # HTML templates
    ├── supabase_schema.sql       # Database schema
    └── main.py                   # Application entry point
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.14+
- **Java JDK** (for Java code execution)
- **Supabase** account
- **AWS Account** (for Claude AI via Bedrock)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Navigate to http://localhost:4200
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies (using uv)
uv sync

# Or with pip
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and AWS credentials

# Run the development server
python main.py

# API available at http://localhost:5000
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema in the SQL editor:
   ```bash
   cat backend/supabase_schema.sql | # Copy to Supabase SQL editor
   ```
3. Fix the progress column constraint:
   ```bash
   cat backend/fix_progress_column.sql | # Run in Supabase SQL editor
   ```

---

## 🔑 Environment Configuration

### Frontend (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

### Backend (`backend/.env`)

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_JWT_SECRET=your_jwt_secret

# AWS Configuration (for Claude AI)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Application
FLASK_ENV=development
SECRET_KEY=your_flask_secret_key
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### Labs & Modules
- `GET /api/labs` - List all labs
- `GET /api/labs/<id>` - Get specific lab
- `POST /api/modules/generate` - Generate AI-powered module
- `GET /api/modules/<id>` - Get module details

### Module Sessions (Progress Tracking)
- `POST /api/module-sessions/start` - Start learning session
- `PUT /api/module-sessions/<id>/update` - Update progress
- `GET /api/module-sessions/user/<userId>` - Get user sessions

### AI Endpoints
- `POST /api/ai/review-code` - AI code review
- `POST /api/ai/execute-code` - Execute code in sandbox
- `POST /api/ai/grade-code` - Grade code submission
- `POST /api/ai/chat` - AI chat interaction

### Analytics
- `GET /api/analytics/user/<userId>` - User analytics
- `GET /api/analytics/skills/<userId>` - Skill progression
- `POST /api/gamification/achievements` - Track achievements

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Angular 20 (Standalone Components)
- **Styling**: Tailwind CSS 4
- **Code Editor**: CodeMirror 6
- **Markdown**: Marked with KaTeX math support
- **Icons**: Lucide Icons via ng-icons
- **HTTP**: Angular HttpClient with JWT interceptor

### Backend
- **Framework**: Flask 3.x (Python 3.14)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (JWT)
- **AI Integration**: 
  - AWS Bedrock (Claude)
  - Google Gemini API
- **Code Execution**: Subprocess sandboxing
- **ORM**: Custom Supabase ORM wrapper

### Infrastructure
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **AI Services**: AWS Bedrock, Google AI
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

---

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Admin Client Bypass**: Service operations bypass RLS with admin credentials
- **Code Execution Sandboxing**: Timeouts and resource limits
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive data in env files

---

## 📖 Key Concepts

### Widget System
Widgets are reusable learning components that can be composed into labs. Each widget has:
- **Type**: mcq, code-editor, fill-blank, markdown, etc.
- **Config**: JSON configuration for behavior
- **Interactions**: Tracked for analytics
- **State Management**: Local and server-side persistence

### Module Sessions
Track user progress through learning modules:
- **Status**: started, in_progress, completed, abandoned
- **Progress**: 0.0 to 1.0 (percentage complete)
- **Time Tracking**: Automatic time spent calculation
- **Step Progression**: Current step vs total steps

### ACE Engine
Adaptive Content Engine for personalized learning:
- **Skill Trees**: Hierarchical skill representation
- **Learner Profiles**: Stored in user preferences JSONB
- **Adaptive Recommendations**: Based on performance
- **Mastery Tracking**: Skill level progression

### Intelligent Test Case Generation
When students write code that contains only function/method definitions (no main method or entry point), the system automatically:
- **Detects Function-Only Code**: Identifies when code lacks a main execution entry point (Java's `main()`, Python's `if __name__ == "__main__"`, etc.)
- **AI-Generated Test Cases**: Uses Claude or Gemini to generate appropriate test cases based on:
  - Function signatures and parameters
  - Expected behavior from function names and context
  - Common edge cases and boundary conditions
- **Automatic Execution**: Wraps functions with test code to validate correctness
- **Supported Languages**: JavaScript, Python, Java, C++

**Example Flow:**
```python
# Student writes only a function
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# AI automatically generates and runs test cases:
# Test 1: factorial(5) → expects 120
# Test 2: factorial(0) → expects 1
# Test 3: factorial(1) → expects 1
# Test 4: factorial(10) → expects 3628800
```

This enables students to focus on writing functions without boilerplate code, while still receiving comprehensive feedback on correctness.

---

## 🧪 Development

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest
```

### Code Generation

```bash
# Generate Angular component
ng generate component components/my-component

# Generate Angular service
ng generate service services/my-service
```

### Building for Production

```bash
# Frontend
npm run build

# Backend
# Set FLASK_ENV=production in .env
python main.py
```

---

## 📝 Migration Notes

This project was recently migrated from:
- **AWS Cognito → Supabase Auth**
- **DynamoDB → PostgreSQL (Supabase)**

Key changes:
- ORM syntax: `filter_expression` → `filters`
- User ID field: `cognito_user_id` → `id`
- Progress storage: Decimal(0.0-1.0) instead of (0-100)
- ACE data: Stored in `users.preferences` JSONB

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

For issues and questions:
- Check the [backend README](backend/README.md) for API details
- Review [MIGRATION_GUIDE.md](backend/MIGRATION_GUIDE.md) for migration help
- See [OAUTH_SETUP.md](backend/OAUTH_SETUP.md) for OAuth configuration

---

## 🎯 Roadmap

- [ ] Mobile responsive design improvements
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] More AI providers integration
- [ ] C++ and Rust code execution support
- [ ] Community lab sharing marketplace
- [ ] Instructor dashboard and classroom management

---

**Built with ❤️ for better learning experiences**

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
