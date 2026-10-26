import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database.db import get_db
from routes.api import api_bp
from routes.auth_routes import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    get_db()

    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    @app.route('/')
    def index():
        return jsonify({
            'app': 'Customer Segmentation SaaS Platform API',
            'status': 'online',
            'database': 'MongoDB Atlas' if Config.MONGO_URI else 'In-Memory Store',
            'version': '2.1.0'
        })

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    return app

if __name__ == '__main__':
    app = create_app()
    port = Config.PORT
    print(f"Customer Segmentation Backend API running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
