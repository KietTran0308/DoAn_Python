from flask import Blueprint, jsonify, request
from bus.phan_quyen_bus import PhanQuyenBUS
from db_connection import DatabaseConnection

phan_quyen_bp = Blueprint('phan_quyen_bp', __name__)

@phan_quyen_bp.route('/api/nhom-quyen', methods=['GET'])
def get_nhom_quyen():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(PhanQuyenBUS(conn).lay_danh_sach_nhom_quyen()), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

# API riêng để lấy danh sách chức năng đã được sắp xếp theo dạng cây Cha-Con
@phan_quyen_bp.route('/api/phan-quyen/chuc-nang', methods=['GET'])
def get_chuc_nang_cay():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(PhanQuyenBUS(conn).lay_danh_sach_chuc_nang()), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@phan_quyen_bp.route('/api/phan-quyen/<int:ma_nq>', methods=['GET'])
def get_phan_quyen_theo_nhom(ma_nq):
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(PhanQuyenBUS(conn).lay_quyen_theo_nhom(ma_nq)), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@phan_quyen_bp.route('/api/phan-quyen/<int:ma_nq>', methods=['POST'])
def update_phan_quyen_theo_nhom(ma_nq):
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        PhanQuyenBUS(conn).cap_nhat_quyen_theo_nhom(ma_nq, data)
        return jsonify({"success": True, "message": "Cập nhật phân quyền thành công!"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()