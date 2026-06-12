from flask import Flask
from flask_cors import CORS

from api.tai_khoan_api import tai_khoan_bp
from api.chuc_nang_api import chuc_nang_bp
from api.dia_diem_api import dia_diem_bp
from api.danh_muc_api import danh_muc_bp
from api.nghe_si_api import nghe_si_bp
from api.van_hanh_api import van_hanh_bp
from api.nhan_su_api import nhan_su_bp
from api.su_kien_api import su_kien_bp
from api.dat_ve_api import dat_ve_bp

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = 'your-secret-key-here'

# Đăng ký tất cả Blueprint
app.register_blueprint(tai_khoan_bp)
app.register_blueprint(chuc_nang_bp)
app.register_blueprint(dia_diem_bp)
app.register_blueprint(danh_muc_bp)
app.register_blueprint(nghe_si_bp)
app.register_blueprint(van_hanh_bp)
app.register_blueprint(nhan_su_bp)
app.register_blueprint(su_kien_bp)
app.register_blueprint(dat_ve_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'OK', 'message': 'Server đang chạy bình thường'}, 200

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)