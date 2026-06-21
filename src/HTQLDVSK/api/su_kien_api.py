from flask import Blueprint, jsonify, request
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

@su_kien_bp.route('/api/su-kien/<int:ma_sk>', methods=['DELETE'])
def delete_su_kien(ma_sk):
    conn = DatabaseConnection.get_connection()
    try:
        bus = SuKienBUS(conn)
        bus.xoa_su_kien(ma_sk)
        return jsonify({"success": True, "message": "Xóa sự kiện thành công!"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
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


@su_kien_bp.route('/api/events/<int:ma_sk>/seats', methods=['GET'])
def get_event_seats(ma_sk):
    conn = DatabaseConnection.get_connection()
    try:
        bus = SuKienBUS(conn)
        data = bus.get_seat_map(ma_sk)

        # Nếu chưa có dữ liệu sơ đồ nào, trả về mảng rỗng để JS chuyển qua chế độ tạo mới
        if not data['hang_ghe'] and not data['khu_vuc']:
            return jsonify({"hang_ghe": [], "khu_vuc": []}), 200

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@su_kien_bp.route('/api/danh-muc-su-kien', methods=['GET'])
def get_danh_muc_su_kien():
    conn = DatabaseConnection.get_connection()
    try:
        bus = SuKienBUS(conn)
        return jsonify(bus.lay_danh_muc()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@su_kien_bp.route('/api/events/<int:ma_sk>/seats', methods=['POST'])
def save_event_seats(ma_sk):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = SuKienBUS(conn)

        # Gọi xuống tầng BUS để xử lý nghiệp vụ lưu trữ
        bus.luu_cau_hinh_so_do(ma_sk, data)

        return jsonify({
            "success": True,
            "message": "Đã lưu cấu hình sơ đồ phân hạng vé thành công!"
        }), 200
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()


@su_kien_bp.route('/api/su-kien', methods=['POST'])
def create_su_kien():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = SuKienBUS(conn)
        new_id = bus.tao_su_kien(data)

        return jsonify({
            "success": True,
            "message": "Tạo sự kiện thành công!",
            "MA_SK": new_id
        }), 201
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()