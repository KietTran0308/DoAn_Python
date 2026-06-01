from flask import Flask
from flask_cors import CORS

# Import phân hệ API bạn vừa tạo
from api.chuc_nang_api import chuc_nang_bp
# Sau này có api khác thì cứ import tiếp ở đây:
# from api.su_kien_api import su_kien_bp
# from api.ve_api import ve_bp

app = Flask(__name__)
# Cho phép frontend gọi API thoải mái
CORS(app)

# Đăng ký các phân hệ (Blueprint) vào server chính
app.register_blueprint(chuc_nang_bp)
# app.register_blueprint(su_kien_bp)
# app.register_blueprint(ve_bp)

if __name__ == '__main__':
    # Chạy duy nhất một server ở port 8000
    app.run(debug=True, port=8000)