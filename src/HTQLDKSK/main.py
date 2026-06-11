from flask import Flask
from flask_cors import CORS
from api.tai_khoan_api import tai_khoan_api

# Khởi tạo ứng dụng Flask
app = Flask(__name__)

# Cho phép CORS để frontend có thể gọi API
CORS(app)

# Cấu hình cho session
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SESSION_TYPE'] = 'filesystem'

# Đăng ký các Blueprint (API routes)
app.register_blueprint(tai_khoan_api)

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    API kiểm tra trạng thái server
    """
    return {'status': 'OK', 'message': 'Server đang chạy bình thường'}, 200


if __name__ == '__main__':
    # Chạy ứng dụng Flask trên localhost:5000
    # debug=True để tự động reload khi có thay đổi code
    app.run(debug=True, host='localhost', port=5000)
