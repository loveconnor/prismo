from config import config
from flask import Flask
from flask_cors import CORS


def create_app(config_name="default"):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Enable CORS for all routes
    CORS(app)

    # Register blueprints
    from app.auth_routes import auth_bp
    from app.data_routes import data_bp
    from app.health_routes import health_bp
    from app.routes import api_bp, main_bp
    from app.admin_routes import admin_bp
    from app.analytics_routes import analytics_bp
    from app.learning_routes import learning_bp
    from app.gamification_routes import gamification_bp
    from app.advanced_routes import advanced_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(health_bp, url_prefix="/health")
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(gamification_bp)
    app.register_blueprint(advanced_bp)

    return app
