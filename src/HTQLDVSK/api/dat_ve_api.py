from flask import Blueprint, jsonify, request
from bus.giao_dich_bus import GiaoDichBUS
from db_connection import DatabaseConnection

dat_ve_bp = Blueprint('dat_ve_bp', __name__)

@dat_ve_bp.route('/api/dat-ve', methods=['POST'])
def dat_ve():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json

        ma_tk = data.get('ma_tk')
        ma_sk = data.get('ma_sk')
        danh_sach_ghe = data.get('danh_sach_ghe')  # [{'ma_kv', 'ma_ghe', 'gia_tien'}]
        ma_gg_id = data.get('ma_gg_id', None)
        tien_giam = data.get('tien_giam', 0)

        if not ma_tk or not ma_sk or not danh_sach_ghe:
            return jsonify({"error": "Thiếu thông tin đặt vé"}), 400

        bus = GiaoDichBUS(conn)
        ma_dh = bus.xu_ly_dat_ve(ma_tk, ma_sk, danh_sach_ghe, ma_gg_id, tien_giam)

        if not ma_dh:
            return jsonify({"error": "Đặt vé thất bại"}), 500

        return jsonify({"message": "Đặt vé thành công!", "ma_don_hang": ma_dh}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()