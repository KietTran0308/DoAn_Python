from dao.dia_diem_dao import DiaDiemDAO
from dto.dia_diem import DiaDiem

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

    def getList(self):
        dsDD = self.dao.getList()

        return dsDD

    def get_all_dia_diem(self):
        danh_sach_dto = self.dao.get_all()
        # Biến mảng DTO thành mảng Dictionary để chuẩn bị ép thành JSON
        return [dd.to_dict() for dd in danh_sach_dto]

    def add_dia_diem(self, data):
        if not data.get('TEN_DD') or not data.get('DIA_CHI'):
            raise ValueError("Tên và địa chỉ địa điểm không được để trống!")

        new_dd = DiaDiem(None, data['TEN_DD'], data['DIA_CHI'], data.get('TONG_SO_COT', 10),
                         data.get('TONG_SO_HANG', 10), data.get('LAYOUT_DATA', None))
        return self.dao.insert(new_dd)

    def update_dia_diem(self, ma_dd, data):
        if not data.get('TEN_DD') or not data.get('DIA_CHI'):
            raise ValueError("Tên và địa chỉ địa điểm không được để trống!")

        updated_dd = DiaDiem(ma_dd, data['TEN_DD'], data['DIA_CHI'], data.get('TONG_SO_COT', 10),
                             data.get('TONG_SO_HANG', 10), data.get('LAYOUT_DATA', None))
        return self.dao.update(updated_dd)

    def delete_dia_diem(self, ma_dd):
        try:
            return self.dao.delete(ma_dd)
        except Exception as e:
            # Bắt lỗi Khóa ngoại (Foreign Key Constraint) nếu địa điểm này đã có sự kiện tổ chức
            if "foreign key constraint fails" in str(e).lower():
                raise ValueError("Không thể xóa! Địa điểm này đang được sử dụng cho một hoặc nhiều Sự kiện.")
            raise e
