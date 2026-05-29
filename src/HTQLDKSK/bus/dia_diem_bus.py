from dao.dia_diem_dao import DiaDiemDAO

class DiaDiemBUS:
    def __init__(self, db_connection):
        self.dao = DiaDiemDAO(db_connection)

    # Hàm lấy sơ đồ chỗ ngồi hoàn chỉnh để Frontend render giao diện
    def load_so_do_cho_ngoi(self, ma_sk):
        # Lấy danh sách tất cả các khu vực của sự kiện này
        danh_sach_khu_vuc = self.dao.get_khu_vuc_by_su_kien(ma_sk)

        # Nếu không có khu vực nào, trả về danh sách rỗng
        if not danh_sach_khu_vuc:
            return []

        # Duyệt qua từng khu vực trong danh sách vừa lấy được
        for khu_vuc in danh_sach_khu_vuc:
            # Với mỗi khu vực, gọi DAO lấy toàn bộ ghế của khu vực đó
            danh_sach_ghe = self.dao.get_ghe_by_khu_vuc(khu_vuc['MA_KV'])

            # Gắn danh sách ghế này vào như một thuộc tính con của khu_vuc
            # Điều này giúp tạo ra một cấu trúc cây (Tree) dữ liệu rất tiện cho Frontend
            khu_vuc['danh_sach_ghe'] = danh_sach_ghe

        # Trả về dữ liệu khu vực đã được "bơm" đầy đủ thông tin ghế bên trong
        return danh_sach_khu_vuc