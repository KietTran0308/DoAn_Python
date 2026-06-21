from flask import Blueprint, jsonify, request
from bus.van_hanh_bus import VanHanhBUS
from db_connection import DatabaseConnection

van_hanh_bp = Blueprint('van_hanh_bp', __name__)


@van_hanh_bp.route('/api/checkin/scan', methods=['POST'])
def quet_ve():
    conn = DatabaseConnection.get_connection()
    try:
        data = request.json
        qr_code = data.get('qr_code', '').strip()
        ma_tk_nhan_vien = data.get('ma_tk')
        ten_cong = data.get('ten_cong', 'Cổng chính')

        if not qr_code or not ma_tk_nhan_vien:
            return jsonify({"error": "Thiếu qr_code hoặc ma_tk"}), 400

        result = VanHanhBUS(conn).xu_ly_quet_ve(qr_code, ma_tk_nhan_vien, ten_cong)
        status = 200 if result['hop_le'] else 400
        return jsonify(result), status

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()


@van_hanh_bp.route('/api/checkin/logs', methods=['GET'])
def lich_su_checkin():
    """
    Lấy lịch sử check-in.
    - Nếu có query param ?ma_sk=<id>  -> lọc theo sự kiện đó
    - Nếu không có ma_sk              -> trả về toàn bộ (Admin xem tổng)
    """
    conn = DatabaseConnection.get_connection()
    try:
        ma_sk = request.args.get('ma_sk')
        bus = VanHanhBUS(conn)

        if ma_sk:
            result = bus.lay_lich_su(int(ma_sk))
        else:
            result = bus.lay_tat_ca_lich_su()

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()