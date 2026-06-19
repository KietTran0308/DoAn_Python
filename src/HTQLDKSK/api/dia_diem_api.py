from flask import Blueprint, jsonify, request
from bus.dia_diem_bus import DiaDiemBUS
from db_connection import DatabaseConnection

dia_diem_bp = Blueprint('dia_diem_bp', __name__)

# Lấy danh sách
@dia_diem_bp.route('/api/dia-diem', methods=['GET'])
def get_dia_diem():
    conn = DatabaseConnection.get_connection()
    try:
        bus = DiaDiemBUS(conn)
        return jsonify(bus.getList()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# Thêm mới
@dia_diem_bp.route('/api/dia-diem', methods=['POST'])
def add_dia_diem():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = DiaDiemBUS(conn)
        ma_dd = bus.add_dia_diem(data)
        return jsonify({
            "message": "Thêm địa điểm thành công!",
            "MA_DD": ma_dd
        }), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()

# Cập nhật
@dia_diem_bp.route('/api/dia-diem/<int:ma_dd>', methods=['PUT'])
def update_dia_diem(ma_dd):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = DiaDiemBUS(conn)
        bus.update_dia_diem(ma_dd, data)
        return jsonify({"message": "Cập nhật địa điểm thành công!"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()

# Xóa
@dia_diem_bp.route('/api/dia-diem/<int:ma_dd>', methods=['DELETE'])
def delete_dia_diem(ma_dd):
    conn = DatabaseConnection.get_connection()
    try:
        bus = DiaDiemBUS(conn)
        bus.delete_dia_diem(ma_dd)
        return jsonify({"message": "Xóa địa điểm thành công!"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Lỗi hệ thống: " + str(e)}), 500
    finally:
        if conn: conn.close()