from dao.su_kien_dao import SuKienDAO

class su_kien_bus:
    def __init__(self, db_connection):
        self.dao = SuKienDAO(db_connection)

    def lay_thong_tin_su_kien_day_du(self, ma_sk):
        su_kien_info = self.dao.get_chi_tiet_su_kien(ma_sk)

        if not su_kien_info:
            return None

        danh_sach_nghe_si = self.dao.get_nghe_si_cua_su_kien(ma_sk)
        su_kien_info['danh_sach_nghe_si'] = danh_sach_nghe_si

        return su_kien_info