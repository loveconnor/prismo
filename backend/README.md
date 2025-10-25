# Prismo Backend

A Flask-based backend API for the Prismo educational platform with AWS integration.

## Features

- Flask web framework with CORS support
- AWS Cognito authentication
- DynamoDB database integration
- Environment-based configuration
- Modular blueprint structure
- API endpoints for labs, widgets, and collections
- Health check endpoints
- JWT token authentication

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Set up AWS services:**
   - Configure AWS Cognito User Pool
   - Set up DynamoDB tables
   - Configure environment variables
   
   See [SETUP.md](SETUP.md) for detailed AWS setup instructions.

3. **Run the development server:**
   ```bash
   python main.py
   ```

4. The API will be available at `http://localhost:5000`

## API Endpoints

### Core
- `GET /` - API status
- `GET /health` - Health check

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Labs
- `GET /api/labs` - Get all labs
- `POST /api/labs` - Create lab
- `GET /api/labs/<id>` - Get specific lab
- `PUT /api/labs/<id>` - Update lab
- `DELETE /api/labs/<id>` - Delete lab

### Widgets
- `GET /api/widgets` - Get all widgets
- `POST /api/widgets` - Create widget
- `GET /api/widgets/<id>` - Get specific widget

### Collections
- `GET /api/collections` - Get collections
- `POST /api/collections` - Create collection
- `GET /api/collections/<id>` - Get specific collection

## Configuration

The app uses environment-based configuration. See `config.py` for available settings.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py         # App factory
│   ├── routes.py           # Basic API routes
│   ├── auth_routes.py      # Authentication routes
│   ├── data_routes.py      # Data management routes
│   ├── auth_service.py     # Cognito authentication service
│   ├── aws_config.py       # AWS configuration
│   └── models.py           # DynamoDB models
├── config.py              # Configuration classes
├── main.py               # Application entry point
├── setup_tables.py       # DynamoDB table setup script
├── pyproject.toml        # Project dependencies
├── SETUP.md              # AWS setup guide
└── README.md             # This file
```
