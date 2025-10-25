# Prismo Backend Setup Guide

## AWS Setup

### 1. AWS Cognito Setup

1. **Create User Pool:**
   - Go to AWS Cognito Console
   - Create a new User Pool
   - Configure sign-in options (email)
   - Set password requirements
   - Note down the User Pool ID

2. **Create App Client:**
   - In your User Pool, create an App Client
   - Enable "Generate client secret" if needed
   - Note down the Client ID

### 2. DynamoDB Setup

1. **Create Tables:**
   ```bash
   python setup_tables.py
   ```

2. **Tables Created:**
   - `prismo-users` - User profiles
   - `prismo-labs` - Educational labs
   - `prismo-widgets` - Interactive widgets
   - `prismo-collections` - User collections

### 3. Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Configuration
FLASK_ENV=development
PORT=5000
SECRET_KEY=your-secret-key-here

# AWS Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-cognito-user-pool-id
COGNITO_CLIENT_ID=your-cognito-client-id
DYNAMODB_TABLE_PREFIX=prismo

# AWS Credentials (set these in your environment or AWS credentials file)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 4. AWS Credentials

Set up AWS credentials using one of these methods:

**Option 1: AWS CLI**
```bash
aws configure
```

**Option 2: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Option 3: IAM Role (for EC2/Lambda)**

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/confirm` - Confirm registration
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Forgot password
- `POST /auth/confirm-forgot-password` - Confirm password reset
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/verify` - Verify token

### Data Management
- `GET /api/labs` - Get labs
- `POST /api/labs` - Create lab
- `GET /api/labs/<id>` - Get specific lab
- `PUT /api/labs/<id>` - Update lab
- `DELETE /api/labs/<id>` - Delete lab

- `GET /api/widgets` - Get widgets
- `POST /api/widgets` - Create widget
- `GET /api/widgets/<id>` - Get specific widget

- `GET /api/collections` - Get collections
- `POST /api/collections` - Create collection
- `GET /api/collections/<id>` - Get specific collection

## Running the Backend

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Set up DynamoDB tables:**
   ```bash
   python setup_tables.py
   ```

4. **Run the server:**
   ```bash
   python main.py
   ```

## Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Create a lab (with authentication):
```bash
curl -X POST http://localhost:5000/api/labs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Math Basics",
    "lab_type": "math",
    "description": "Basic math problems",
    "content": {"problems": []},
    "is_public": true
  }'
```
