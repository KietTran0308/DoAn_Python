from flask import Blueprint, jsonify, request
from bus.nhan_su_bus import NhanSuBUS
from bus.phan_quyen_bus import PhanQuyenBUS
from db_connection import DatabaseConnection

nhan_su_bp = Blueprint('nhan_su_bp', __name__)


# --- NHÂN SỰ ---

@nhan_su_bp.route('/api/nhan-su', methods=['GET'])
def get_nhan_su():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(NhanSuBUS(conn).get_danh_sach()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/nhan-su', methods=['POST'])
def tao_nhan_su():
    conn = DatabaseConnection.get_connection()
    try:
        ma_tk = NhanSuBUS(conn).tao_tai_khoan(request.json)
        return jsonify({"message": "Tạo tài khoản thành công!", "ma_tk": ma_tk}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/nhan-su/<int:ma_tk>/khoa', methods=['PATCH'])
def khoa_nhan_su(ma_tk):
    conn = DatabaseConnection.get_connection()
    try:
        NhanSuBUS(conn).khoa_tai_khoan(ma_tk)
        return jsonify({"message": "Đã khóa tài khoản."}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/nhan-su/<int:ma_tk>/mo-khoa', methods=['PATCH'])
def mo_khoa_nhan_su(ma_tk):
    conn = DatabaseConnection.get_connection()
    try:
        NhanSuBUS(conn).mo_khoa_tai_khoan(ma_tk)
        return jsonify({"message": "Đã mở khóa tài khoản."}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/nhan-su/<int:ma_tk>/nhom-quyen', methods=['PATCH'])
def doi_nhom_quyen(ma_tk):
    conn = DatabaseConnection.get_connection()
    try:
        ma_nq = request.json.get('ma_nq')
        if not ma_nq:
            return jsonify({"error": "Thiếu ma_nq"}), 400
        NhanSuBUS(conn).doi_nhom_quyen(ma_tk, ma_nq)
        return jsonify({"message": "Cập nhật nhóm quyền thành công!"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/nhan-su/nhom-quyen', methods=['GET'])
def get_nhom_quyen():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(NhanSuBUS(conn).get_danh_sach_nhom_quyen()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


# --- PHÂN QUYỀN ---

@nhan_su_bp.route('/api/phan-quyen', methods=['GET'])
def get_phan_quyen():
    conn = DatabaseConnection.get_connection()
    try:
        return jsonify(PhanQuyenBUS(conn).get_ma_tran()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@nhan_su_bp.route('/api/phan-quyen', methods=['PUT'])
def cap_nhat_phan_quyen():
    conn = DatabaseConnection.get_connection()
    try:
        PhanQuyenBUS(conn).cap_nhat_quyen(request.json)
        return jsonify({"message": "Cập nhật phân quyền thành công!"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()