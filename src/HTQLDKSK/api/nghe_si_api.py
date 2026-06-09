from flask import Blueprint, jsonify, request
from bus.nghe_si_bus import NgheSiBUS
from db_connection import DatabaseConnection

nghe_si_bp = Blueprint('nghe_si_bp', __name__)

@nghe_si_bp.route('/api/nghe-si', methods=['GET'])
def get_nghe_si():
    conn = DatabaseConnection.get_connection()
    try:
        bus = NgheSiBUS(conn)
        return jsonify(bus.get_all_nghe_si()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nghe_si_bp.route('/api/nghe-si', methods=['POST'])
def add_nghe_si():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = NgheSiBUS(conn)
        bus.add_nghe_si(data)
        return jsonify({"message": "Thêm nghệ sĩ thành công!"}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()

@nghe_si_bp.route('/api/nghe-si/<int:ma_ns>', methods=['PUT'])
def update_nghe_si(ma_ns):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = NgheSiBUS(conn)
        bus.update_nghe_si(ma_ns, data)
        return jsonify({"message": "Cập nhật thông tin nghệ sĩ thành công!"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()

@nghe_si_bp.route('/api/nghe-si/<int:ma_ns>', methods=['DELETE'])
def delete_nghe_si(ma_ns):
    conn = DatabaseConnection.get_connection()
    try:
        bus = NgheSiBUS(conn)
        bus.delete_nghe_si(ma_ns)
        return jsonify({"message": "Xóa nghệ sĩ thành công!"}), 200
    except ValueError as ve:
        # Trả về lỗi 400 nếu nghệ sĩ đang nằm trong sự kiện
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()