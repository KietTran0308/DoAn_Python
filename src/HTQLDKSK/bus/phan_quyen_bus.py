from dao.phan_quyen_dao import PhanQuyenDAO


class PhanQuyenBUS:
    def __init__(self, db_connection):
        self.dao = PhanQuyenDAO(db_connection)

    # Trả về ma trận dạng:
    # { ma_nq: { ten_nq, chuc_nang: [ {ma_cn, ten_cn, ma_cn_cha, xem, them, sua, xoa} ] } }
    def get_ma_tran(self):
        rows = self.dao.get_ma_tran_quyen()
        ma_tran = {}
        for row in rows:
            ma_nq = row['MA_NQ']
            if ma_nq not in ma_tran:
                ma_tran[ma_nq] = {
                    'ma_nq': ma_nq,
                    'ten_nq': row['TEN_NQ'],
                    'chuc_nang': []
                }
            ma_tran[ma_nq]['chuc_nang'].append({
                'ma_cn': row['MA_CN'],
                'ten_cn': row['TEN_CN'],
                'ma_cn_cha': row['MA_CN_CHA'],
                'xem': bool(row['XEM']),
                'them': bool(row['THEM']),
                'sua': bool(row['SUA']),
                'xoa': bool(row['XOA'])
            })
        return list(ma_tran.values())

    def cap_nhat_quyen(self, danh_sach):
        if not danh_sach:
            raise ValueError("Không có dữ liệu quyền để cập nhật.")
        self.dao.update_quyen_bulk(danh_sach)