import os

from dotenv import load_dotenv


# Load environment variables
load_dotenv()


class Config:
    """Base configuration class"""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    PORT = int(os.getenv("PORT", 5000))
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # AWS Configuration
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_JEflDBGQ0")
    COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "63rmk63l7a9iis438elt3lofpr")
    COGNITO_CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")
    COGNITO_DOMAIN = os.getenv("COGNITO_DOMAIN", f"prismo-{COGNITO_USER_POOL_ID.split('_')[1]}")
    DYNAMODB_TABLE_PREFIX = os.getenv("DYNAMODB_TABLE_PREFIX", "prismo")
    
    # OAuth Configuration
    OAUTH_CALLBACK_URL = os.getenv("OAUTH_CALLBACK_URL", "http://localhost:4200/auth/callback")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "174911154905-3d2k5au7monn142921u3f455lkgu5a2v.apps.googleusercontent.com")
    
    # Bedrock API Configuration
    Bedrock_API_URL = os.getenv("Bedrock_API_URL", "https://Bedrockllmapi.vercel.app/generate-content")
    Bedrock_API_KEY = os.getenv("Bedrock_API_KEY")


class DevelopmentConfig(Config):
    """Development configuration"""

    DEBUG = True
    FLASK_ENV = "development"


class ProductionConfig(Config):
    """Production configuration"""

    DEBUG = False
    FLASK_ENV = "production"


# Configuration dictionary
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
