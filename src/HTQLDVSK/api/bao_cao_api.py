from flask import Blueprint, jsonify, request
from bus.bao_cao_bus import BaoCaoBUS
from db_connection import DatabaseConnection

bao_cao_bp = Blueprint('bao_cao_bp', __name__)


@bao_cao_bp.route('/api/bao-cao-doanh-thu', methods=['GET'])
def get_bao_cao_doanh_thu():
    conn = DatabaseConnection.get_connection()
    try:
        bus = BaoCaoBUS(conn)
        data = bus.get_doanh_thu_data()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@bao_cao_bp.route('/api/thong-ke-hoat-dong', methods=['GET'])
def get_thong_ke_hoat_dong():
    """
    Trả về toàn bộ log check-in kèm thông tin sự kiện,
    để CN42_ThongKeHoatDong.js tự tính KPI và vẽ biểu đồ phía client.
    Query param tuỳ chọn: ?ma_sk=<id>
    """
    conn = DatabaseConnection.get_connection()
    try:
        ma_sk = request.args.get('ma_sk')
        bus = BaoCaoBUS(conn)
        data = bus.get_thong_ke_hoat_dong(int(ma_sk) if ma_sk else None)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()