from flask import Blueprint, jsonify, request
from bus.danh_muc_bus import DanhMucBUS
from db_connection import DatabaseConnection

danh_muc_bp = Blueprint('danh_muc_bp', __name__)

@danh_muc_bp.route('/api/danh-muc', methods=['GET'])
def get_danh_muc():
    conn = DatabaseConnection.get_connection()
    try:
        bus = DanhMucBUS(conn)
        return jsonify(bus.get_all_danh_muc()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@danh_muc_bp.route('/api/danh-muc', methods=['POST'])
def add_danh_muc():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = DanhMucBUS(conn)
        bus.add_danh_muc(data)
        return jsonify({"message": "Thêm danh mục thành công!"}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@danh_muc_bp.route('/api/danh-muc/<int:ma_dmsk>', methods=['PUT'])
def update_danh_muc(ma_dmsk):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = DanhMucBUS(conn)
        bus.update_danh_muc(ma_dmsk, data)
        return jsonify({"message": "Cập nhật thành công!"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@danh_muc_bp.route('/api/danh-muc/<int:ma_dmsk>', methods=['DELETE'])
def delete_danh_muc(ma_dmsk):
    conn = DatabaseConnection.get_connection()
    try:
        bus = DanhMucBUS(conn)
        bus.delete_danh_muc(ma_dmsk)
        return jsonify({"message": "Xóa thành công!"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()