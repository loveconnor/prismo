from config import config
from flask import Flask
from flask_cors import CORS


def create_app(config_name="default"):
    import os

    template_folder = (os.path.join(os.path.dirname(__file__), "..", "templates"),)
    static_folder = (os.path.join(os.path.dirname(__file__), "..", "static"),)
    print(template_folder, static_folder)

    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "..", "templates"),
        static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
        static_url_path="/static"
    )

    # Load configuration
    app.config.from_object(config[config_name])

    # Enable CORS for all routes with specific configuration
    CORS(app, 
         origins=["http://localhost:4200", "http://127.0.0.1:4200", "https://localhost:4200"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)

    # Register blueprints
    from app.admin_routes import admin_bp
    from app.advanced_routes import advanced_bp
    from app.analytics_routes import analytics_bp
    from app.auth_routes import auth_bp
    from app.claude_routes import claude_bp
    from app.data_routes import data_bp
    from app.frontend_routes import frontend_bp
    from app.gamification_routes import gamification_bp
    from app.health_routes import health_bp
    from app.learning_routes import learning_bp
    from app.oauth_routes import oauth_bp
    from app.routes import api_bp, main_bp

    # Register frontend routes first (for SPA routing)
    app.register_blueprint(frontend_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp)
    app.register_blueprint(claude_bp, url_prefix="/api")
    app.register_blueprint(data_bp)
    app.register_blueprint(health_bp, url_prefix="/health")
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(gamification_bp)
    app.register_blueprint(advanced_bp)
    app.register_blueprint(oauth_bp)

    return app
