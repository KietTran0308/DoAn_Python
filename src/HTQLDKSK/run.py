from flask import Flask
from flask_cors import CORS

from api.chuc_nang_api import chuc_nang_bp
from api.su_kien_api import su_kien_bp
from api.dia_diem_api import dia_diem_bp
from api.danh_muc_api import danh_muc_bp
from api.nghe_si_api import nghe_si_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(chuc_nang_bp)
app.register_blueprint(su_kien_bp)
app.register_blueprint(dia_diem_bp)
app.register_blueprint(danh_muc_bp)
app.register_blueprint(nghe_si_bp)

if __name__ == '__main__':
    app.run(debug=True, port=8000)