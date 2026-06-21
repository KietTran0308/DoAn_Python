from flask import Blueprint, jsonify, request
from bus.don_hang_bus import DonHangBUS
from db_connection import DatabaseConnection

don_hang_bp = Blueprint('don_hang_bp', __name__)


@don_hang_bp.route('/api/don-hang', methods=['GET'])
def get_don_hang():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(DonHangBUS(conn).lay_danh_sach_don_hang()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@don_hang_bp.route('/api/don-hang/<int:ma_dh>/chi-tiet', methods=['GET'])
def get_chi_tiet_don_hang(ma_dh):
    conn = DatabaseConnection.get_connection()
    try:
        data = DonHangBUS(conn).lay_chi_tiet_don_hang(ma_dh)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@don_hang_bp.route('/api/don-hang/<int:ma_dh>/trang-thai', methods=['PATCH'])
def cap_nhat_trang_thai(ma_dh):
    conn = DatabaseConnection.get_connection()
    try:
        trang_thai_moi = request.json.get('trang_thai')
        if trang_thai_moi is None:
            return jsonify({"error": "Thiếu trang_thai"}), 400
        DonHangBUS(conn).cap_nhat_trang_thai(ma_dh, int(trang_thai_moi))
        return jsonify({"message": "Cập nhật trạng thái thành công!"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@don_hang_bp.route('/api/khuyen-mai', methods=['GET'])
def get_khuyen_mai():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(DonHangBUS(conn).lay_danh_sach_khuyen_mai()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()