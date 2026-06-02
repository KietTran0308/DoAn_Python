from flask import Flask
from flask_cors import CORS

from api.chuc_nang_api import chuc_nang_bp
from api.su_kien_api import su_kien_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(chuc_nang_bp)
app.register_blueprint(su_kien_bp)

if __name__ == '__main__':
    # Chạy duy nhất một server ở port 8000
    app.run(debug=True, port=8000)