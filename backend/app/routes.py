from flask import Blueprint, jsonify


# Main routes blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    return jsonify({
        'message': 'Prismo Backend API',
        'status': 'running',
        'version': '1.0.0'
    })

@main_bp.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'prismo-backend',
        'timestamp': '2024-01-01T00:00:00Z'
    })

# API routes blueprint
api_bp = Blueprint('api', __name__)

@api_bp.route('/labs')
def get_labs():
    """Get all available labs"""
    return jsonify({
        'labs': [
            {'id': 1, 'name': 'Math Lab', 'type': 'math'},
            {'id': 2, 'name': 'Writing Lab', 'type': 'writing'},
            {'id': 3, 'name': 'Code Lab', 'type': 'coding'}
        ]
    })

@api_bp.route('/labs/<int:lab_id>')
def get_lab(lab_id):
    """Get specific lab by ID"""
    return jsonify({
        'id': lab_id,
        'name': f'Lab {lab_id}',
        'type': 'math',
        'description': f'This is lab {lab_id}'
    })

@api_bp.route('/widgets')
def get_widgets():
    """Get all available widgets"""
    return jsonify({
        'widgets': [
            {'id': 1, 'name': 'Timer', 'type': 'utility'},
            {'id': 2, 'name': 'Multiple Choice', 'type': 'quiz'},
            {'id': 3, 'name': 'Hint Panel', 'type': 'support'}
        ]
    })
