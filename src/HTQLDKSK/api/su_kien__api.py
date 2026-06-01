# app.py (File chạy chính)
from flask import Flask, jsonify
from bus.su_kien_bus import SuKienBUS

app = Flask(__name__)


# Tạo đường dẫn API
@app.route('/api/events', methods=['GET'])
def get_events():
    # Gọi tầng BUS
    danh_sach_sk = SuKienBUS.lay_danh_sach_hien_thi()

    # Ép kiểu dữ liệu Python thành chuỗi JSON trả về cho Web
    return jsonify(danh_sach_sk)