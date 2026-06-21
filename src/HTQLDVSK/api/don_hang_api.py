from flask import Blueprint, jsonify
from bus.don_hang_bus import DonHangBUS
from db_connection import DatabaseConnection # Đảm bảo file cấu hình db_connection của bạn đúng đường dẫn

don_hang_bp = Blueprint('don_hang_bp', __name__)

@don_hang_bp.route('/api/don-hang', methods=['GET'])
def get_don_hang():
    conn = DatabaseConnection.get_connection()
    try:
        bus = DonHangBUS(conn)
        # Trả về danh sách đơn hàng đã được xử lý
        return jsonify(bus.lay_danh_sach_don_hang()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@don_hang_bp.route('/api/khuyen-mai', methods=['GET'])
def get_khuyen_mai():
    conn = DatabaseConnection.get_connection()
    try:
        bus = DonHangBUS(conn)
        return jsonify(bus.lay_danh_sach_khuyen_mai()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()