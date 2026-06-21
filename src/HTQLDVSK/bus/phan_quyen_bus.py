from dao.phan_quyen_dao import PhanQuyenDAO


class PhanQuyenBUS:
    def __init__(self, db_connection):
        self.dao = PhanQuyenDAO(db_connection)

    def lay_danh_sach_nhom_quyen(self):
        return self.dao.get_all_nhom_quyen()

    def lay_danh_sach_chuc_nang(self):
        return self.dao.get_all_chuc_nang()

    def lay_quyen_theo_nhom(self, ma_nq):
        return self.dao.get_quyen_theo_nhom(ma_nq)

    def cap_nhat_quyen_theo_nhom(self, ma_nq, danh_sach_quyen_moi):
        self.dao.delete_quyen_theo_nhom(ma_nq)

        if not danh_sach_quyen_moi:
            return

        danh_sach_insert = []
        for q in danh_sach_quyen_moi:
            danh_sach_insert.append((
                ma_nq,
                q.get('MA_CN'),
                q.get('XEM', 0),
                q.get('THEM', 0),
                q.get('SUA', 0),
                q.get('XOA', 0)
            ))

        self.dao.insert_quyen_bulk(danh_sach_insert)