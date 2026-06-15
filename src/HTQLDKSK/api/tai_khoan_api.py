from flask import Blueprint, jsonify, request
from bus.tai_khoan_bus import TaiKhoanBUS
from db_connection import DatabaseConnection

tai_khoan_bp = Blueprint('tai_khoan_bp', __name__)

@tai_khoan_bp.route('/api/dang-nhap', methods=['POST'])
def dang_nhap():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = TaiKhoanBUS(conn)
        result = bus.xac_thuc(data.get('identifier'), data.get('mat_khau'))
        status = 200 if result['success'] else 401
        return jsonify(result), status
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/dang-ky', methods=['POST'])
def dang_ky():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        bus = TaiKhoanBUS(conn)
        result = bus.dang_ky(
            data.get('ten_tk'),
            data.get('mat_khau'),
            data.get('ho'),
            data.get('ten'),
            data.get('email'),
            data.get('sdt')
        )
        status = 201 if result['success'] else 400
        return jsonify(result), status
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/khach-hang', methods=['GET'])
def get_danh_sach_khach_hang():
    conn = DatabaseConnection.get_connection()
    try:
        bus = TaiKhoanBUS(conn)
        ds_khach_hang = bus.lay_danh_sach_khach_hang()
        return jsonify(ds_khach_hang), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

# Thêm vào cuối file tai_khoan_api.py
@tai_khoan_bp.route('/api/nhom-quyen', methods=['GET'])
def get_nhom_quyen():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(TaiKhoanBUS(conn).lay_tat_ca_nhom_quyen()), 200
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/chuc-nang', methods=['GET'])
def get_chuc_nang():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(TaiKhoanBUS(conn).lay_tat_ca_chuc_nang()), 200
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/phan-quyen/<int:ma_nq>', methods=['GET'])
def get_phan_quyen(ma_nq):
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(TaiKhoanBUS(conn).lay_phan_quyen_theo_nhom(ma_nq)), 200
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/phan-quyen/<int:ma_nq>', methods=['POST'])
def update_phan_quyen(ma_nq):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        result = TaiKhoanBUS(conn).cap_nhat_phan_quyen(ma_nq, data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@tai_khoan_bp.route('/api/menu-quyen/<int:ma_tk>', methods=['GET'])
def get_menu_quyen(ma_tk):
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(TaiKhoanBUS(conn).lay_menu_theo_tai_khoan(ma_tk)), 200
    finally:
        if conn: conn.close()