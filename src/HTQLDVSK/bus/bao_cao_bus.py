from dao.bao_cao_dao import BaoCaoDAO


class BaoCaoBUS:
    def __init__(self, db_connection):
        self.dao = BaoCaoDAO(db_connection)

    def get_doanh_thu_data(self):
        orders = self.dao.get_all_orders_for_report()
        for o in orders:
            if o.get('TG_TAO_DH'):
                o['TG_TAO_DH'] = o['TG_TAO_DH'].strftime('%Y-%m-%dT%H:%M:%S')
            o['TONG_TIEN_BAN_DAU'] = float(o['TONG_TIEN_BAN_DAU'] or 0)
            o['SO_TIEN_DUOC_GIAM']  = float(o['SO_TIEN_DUOC_GIAM']  or 0)
            o['TONG_TIEN_CON_LAI']  = float(o['TONG_TIEN_CON_LAI']  or 0)
        return orders

    def get_thong_ke_hoat_dong(self, ma_sk=None):
        rows = self.dao.get_checkin_logs_for_stats(ma_sk)
        result = []
        for r in rows:
            result.append({
                "ma_log":      r['MA_LOG'],
                "tg_quet":     r['TG_QUET'].strftime('%Y-%m-%dT%H:%M:%S'),
                "ten_cong":    r.get('TEN_CONG') or 'N/A',
                "trang_thai":  r['TRANG_THAI'],          # 1 = thành công, 0 = thất bại
                "qr_code":     r.get('QR_CODE') or '',
                "ma_sk":       r.get('MA_SK'),
                "ten_su_kien": r.get('TEN_SK') or '',
                "ten_khach":   f"{r.get('HO') or ''} {r.get('TEN') or ''}".strip(),
                "nhan_vien":   f"{r.get('HO_NV') or ''} {r.get('TEN_NV') or ''}".strip() or 'N/A',
            })
        return result