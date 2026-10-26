import os
import time
import uuid
import datetime
from config import Config

class InMemoryDB:
    def __init__(self):
        self.users = []
        self.datasets = []
        self.customers = []
        self.analysis_results = []
        self.analysis_history = []
        print("[DB Manager] Initialized high-performance In-Memory database store.")

    def create_user(self, username, email, password_hash):
        user_id = str(uuid.uuid4())
        user_doc = {
            '_id': user_id,
            'username': username,
            'email': email.lower().strip(),
            'password_hash': password_hash,
            'created_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        self.users.append(user_doc)
        return user_doc

    def find_user_by_email(self, email):
        target = email.lower().strip()
        for u in self.users:
            if u['email'] == target:
                return u
        return None

    def find_user_by_id(self, user_id):
        for u in self.users:
            if u['_id'] == user_id:
                return u
        return None

    def save_dataset(self, metadata, user_id=None):
        doc = {
            '_id': str(uuid.uuid4()),
            'user_id': user_id,
            'dataset_name': metadata.get('dataset_name', 'Mall_Customers.csv'),
            'upload_date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'row_count': metadata.get('row_count', 0),
            'feature_list': metadata.get('feature_list', [])
        }
        self.datasets.append(doc)
        return doc

    def get_datasets(self, user_id=None):
        if user_id:
            return [d for d in self.datasets if d.get('user_id') == user_id or d.get('user_id') is None]
        return self.datasets

    def save_analysis(self, data, user_id=None):
        doc_id = str(uuid.uuid4())
        doc = {
            '_id': doc_id,
            'user_id': user_id,
            'dataset_name': data.get('dataset_name', 'Mall_Customers.csv'),
            'algorithm': data.get('algorithm', 'K-Means'),
            'parameters': data.get('parameters', {}),
            'n_clusters': data.get('n_clusters', 4),
            'silhouette_score': data.get('silhouette_score', 0.0),
            'cluster_profiles': data.get('cluster_profiles', []),
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'points_count': data.get('points_count', 0)
        }
        self.analysis_results.append(doc)
        self.analysis_history.append(doc)
        return doc

    def get_history(self, user_id=None):
        if user_id:
            filtered = [x for x in self.analysis_history if x.get('user_id') == user_id or x.get('user_id') is None]
        else:
            filtered = self.analysis_history
        return sorted(filtered, key=lambda x: x['timestamp'], reverse=True)

    def get_analysis_by_id(self, analysis_id):
        for item in self.analysis_history:
            if item['_id'] == analysis_id:
                return item
        return None

    def delete_analysis(self, analysis_id):
        self.analysis_history = [x for x in self.analysis_history if x['_id'] != analysis_id]
        self.analysis_results = [x for x in self.analysis_results if x['_id'] != analysis_id]
        return True

class MongoAtlasDB:
    def __init__(self, uri):
        from pymongo import MongoClient
        self.client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        self.client.admin.command('ping')
        self.db = self.client[Config.DB_NAME]
        self.uri = uri
        print("[DB Manager] Connected successfully to MongoDB Atlas Database!")

    def create_user(self, username, email, password_hash):
        doc = {
            'username': username,
            'email': email.lower().strip(),
            'password_hash': password_hash,
            'created_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        res = self.db.users.insert_one(doc)
        doc['_id'] = str(res.inserted_id)
        return doc

    def find_user_by_email(self, email):
        doc = self.db.users.find_one({'email': email.lower().strip()})
        if doc:
            doc['_id'] = str(doc['_id'])
        return doc

    def find_user_by_id(self, user_id):
        from bson import ObjectId
        try:
            doc = self.db.users.find_one({'_id': ObjectId(user_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
            return doc
        except Exception:
            return None

    def save_dataset(self, metadata, user_id=None):
        doc = {
            'user_id': user_id,
            'dataset_name': metadata.get('dataset_name', 'Mall_Customers.csv'),
            'upload_date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'row_count': metadata.get('row_count', 0),
            'feature_list': metadata.get('feature_list', [])
        }
        res = self.db.datasets.insert_one(doc)
        doc['_id'] = str(res.inserted_id)
        return doc

    def get_datasets(self, user_id=None):
        query = {'$or': [{'user_id': user_id}, {'user_id': None}]} if user_id else {}
        docs = list(self.db.datasets.find(query))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs

    def save_analysis(self, data, user_id=None):
        doc = {
            'user_id': user_id,
            'dataset_name': data.get('dataset_name', 'Mall_Customers.csv'),
            'algorithm': data.get('algorithm', 'K-Means'),
            'parameters': data.get('parameters', {}),
            'n_clusters': data.get('n_clusters', 4),
            'silhouette_score': data.get('silhouette_score', 0.0),
            'cluster_profiles': data.get('cluster_profiles', []),
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'points_count': data.get('points_count', 0)
        }
        res = self.db.analysis_history.insert_one(doc)
        doc['_id'] = str(res.inserted_id)
        return doc

    def get_history(self, user_id=None):
        query = {'$or': [{'user_id': user_id}, {'user_id': None}]} if user_id else {}
        docs = list(self.db.analysis_history.find(query).sort('timestamp', -1))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs

    def get_analysis_by_id(self, analysis_id):
        from bson import ObjectId
        try:
            doc = self.db.analysis_history.find_one({'_id': ObjectId(analysis_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
            return doc
        except Exception:
            return None

    def delete_analysis(self, analysis_id):
        from bson import ObjectId
        try:
            self.db.analysis_history.delete_one({'_id': ObjectId(analysis_id)})
            return True
        except Exception:
            return False

_db_instance = None

def get_db():
    global _db_instance
    if _db_instance is None:
        if Config.MONGO_URI:
            try:
                _db_instance = MongoAtlasDB(Config.MONGO_URI)
            except Exception as e:
                print(f"[DB Manager Warning] MongoDB Atlas connection failed ({str(e)}). Using In-Memory DB fallback.")
                _db_instance = InMemoryDB()
        else:
            print("[DB Manager Info] No MONGO_URI specified. Using In-Memory database store.")
            _db_instance = InMemoryDB()
    return _db_instance

def connect_custom_mongodb(uri: str):
    global _db_instance
    try:
        instance = MongoAtlasDB(uri)
        _db_instance = instance
        Config.MONGO_URI = uri
        return True, "Successfully connected to your MongoDB Atlas database!"
    except Exception as e:
        return False, f"Failed to connect to MongoDB Atlas: {str(e)}"
