from flask import Blueprint, jsonify
from bus.su_kien_bus import SuKienBUS
from db_connection import DatabaseConnection

su_kien_bp = Blueprint('su_kien_bp', __name__)

@su_kien_bp.route('/api/su-kien', methods=['GET'])
def get_su_kien():
    conn = DatabaseConnection.get_connection()
    try:
        bus = SuKienBUS(conn)
        return jsonify(bus.lay_danh_sach_hien_thi()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@su_kien_bp.route('/api/su-kien/<int:ma_sk>', methods=['GET'])
def get_chi_tiet_su_kien(ma_sk):
    conn = DatabaseConnection.get_connection()
    try:
        bus = SuKienBUS(conn)
        result = bus.lay_thong_tin_su_kien_day_du(ma_sk)
        if not result:
            return jsonify({"error": "Không tìm thấy sự kiện"}), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()