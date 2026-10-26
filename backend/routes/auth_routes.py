from flask import Blueprint, request, jsonify
from database.db import get_db, connect_custom_mongodb
from auth.security import hash_password, verify_password, generate_token, verify_token

auth_bp = Blueprint('auth', __name__)

def get_current_user_from_request():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload and 'sub' in payload:
            db = get_db()
            user = db.find_user_by_id(payload['sub'])
            return user
    return None

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required.'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

        db = get_db()
        existing = db.find_user_by_email(email)
        if existing:
            return jsonify({'error': 'An account with this email address already exists.'}), 400

        pwd_hash = hash_password(password)
        user_doc = db.create_user(username, email, pwd_hash)

        token = generate_token(user_doc['_id'], user_doc['email'])

        return jsonify({
            'message': 'Account created successfully!',
            'token': token,
            'user': {
                'id': user_doc['_id'],
                'username': user_doc['username'],
                'email': user_doc['email']
            }
        })
    except Exception as e:
        return jsonify({'error': f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'error': 'Email and password are required.'}), 400

        db = get_db()
        user = db.find_user_by_email(email)
        if not user or not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid email address or password.'}), 401

        token = generate_token(user['_id'], user['email'])

        return jsonify({
            'message': 'Logged in successfully!',
            'token': token,
            'user': {
                'id': user['_id'],
                'username': user['username'],
                'email': user['email']
            }
        })
    except Exception as e:
        return jsonify({'error': f"Login failed: {str(e)}"}), 500

@auth_bp.route('/me', methods=['GET'])
def get_me():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized / Token expired'}), 401
    return jsonify({
        'user': {
            'id': user['_id'],
            'username': user['username'],
            'email': user['email']
        }
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully.'})

@auth_bp.route('/db/connect', methods=['POST'])
def db_connect():
    try:
        data = request.get_json() or {}
        mongo_uri = data.get('mongo_uri', '').strip()

        if not mongo_uri:
            return jsonify({'error': 'MongoDB URI connection string is required.'}), 400

        success, msg = connect_custom_mongodb(mongo_uri)
        if success:
            return jsonify({
                'message': msg,
                'status': 'connected',
                'database': 'MongoDB Atlas'
            })
        else:
            return jsonify({'error': msg}), 400
    except Exception as e:
        return jsonify({'error': f"Connection test failed: {str(e)}"}), 500
