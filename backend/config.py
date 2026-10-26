import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv('MONGO_URI', None)
    PORT = int(os.getenv('PORT', 5000))
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-2026')
    DB_NAME = 'customer_segmentation_db'
