import os

from dotenv import load_dotenv


# Load environment variables
load_dotenv()


class Config:
    """Base configuration class"""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    PORT = int(os.getenv("PORT", 5000))
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # OAuth Configuration
    OAUTH_CALLBACK_URL = os.getenv("OAUTH_CALLBACK_URL", "http://localhost:4200/auth/callback")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "174911154905-3d2k5au7monn142921u3f455lkgu5a2v.apps.googleusercontent.com")
    
    # AI Provider Configuration
    DEFAULT_AI_PROVIDER = os.getenv("DEFAULT_AI_PROVIDER", "gemini")  # "claude" or "gemini"
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    
    # Legacy Bedrock API Configuration (deprecated - use ANTHROPIC_API_KEY instead)
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
