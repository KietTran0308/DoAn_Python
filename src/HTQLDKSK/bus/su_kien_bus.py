from dao.su_kien_dao import SuKienDAO

class SuKienBUS:
    def __init__(self, db_connection):
        self.dao = SuKienDAO(db_connection)

    def lay_danh_sach_hien_thi(self):
        data = self.dao.lay_tat_ca_su_kien()

        for sk in data:
            if 'TG_BAT_DAU' in sk and sk['TG_BAT_DAU']:
                sk['TG_BAT_DAU'] = sk['TG_BAT_DAU'].strftime('%Y-%m-%d %H:%M:%S')

            # 2. Xử lý trạng thái (Giữ nguyên như bạn đã làm)
            if sk['TRANG_THAI'] == 1: sk['TRANG_THAI_TEXT'] = "🟢 Hoạt động"
            else: sk['TRANG_THAI_TEXT'] = "🔴 Đã khóa"

        return data

    def lay_thong_tin_su_kien_day_du(self, ma_sk):
        su_kien_info = self.dao.get_chi_tiet_su_kien(ma_sk)

        if not su_kien_info:
            return None

        danh_sach_nghe_si = self.dao.get_nghe_si_cua_su_kien(ma_sk)
        su_kien_info['danh_sach_nghe_si'] = danh_sach_nghe_si

        return su_kien_info

    def get_seat_map(self, ma_sk):
        # Có thể thêm các logic kiểm tra điều kiện (validate) ở đây nếu cần
        return self.dao.get_seat_map_data(ma_sk)

    def lay_danh_muc(self):
        danh_muc = self.dao.lay_tat_ca_danh_muc()
        # Có thể thêm các logic kiểm tra, map dữ liệu hoặc bổ sung đường dẫn ảnh gốc tại đây nếu cần
        return danh_muc