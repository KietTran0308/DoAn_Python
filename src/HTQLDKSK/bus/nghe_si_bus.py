from dao.nghe_si_dao import NgheSiDAO
from dto.nghe_si import NgheSi


class NgheSiBUS:
    def __init__(self, db_connection):
        self.dao = NgheSiDAO(db_connection)

    def get_all_nghe_si(self):
        danh_sach_dto = self.dao.get_all()
        # Chuyển đổi toàn bộ mảng DTO thành dictionary
        return [ns.to_dict() for ns in danh_sach_dto]

    def add_nghe_si(self, data):
        # Bắt buộc phải có tên nghệ sĩ
        if not data.get('TEN_NS'):
            raise ValueError("Tên nghệ sĩ không được để trống!")

        new_ns = NgheSi(None, data['TEN_NS'], data.get('TIEU_SU', ''), data.get('IMAGE_URL', ''))
        return self.dao.insert(new_ns)

    def update_nghe_si(self, ma_ns, data):
        if not data.get('TEN_NS'):
            raise ValueError("Tên nghệ sĩ không được để trống!")

        updated_ns = NgheSi(ma_ns, data['TEN_NS'], data.get('TIEU_SU', ''), data.get('IMAGE_URL', ''))
        return self.dao.update(updated_ns)

    def delete_nghe_si(self, ma_ns):
        try:
            return self.dao.delete(ma_ns)
        except Exception as e:
            # Ràng buộc khóa ngoại: Không cho xóa nếu nghệ sĩ này đang có tên trong bảng `sk_ns`
            if "foreign key constraint fails" in str(e).lower():
                raise ValueError("Không thể xóa! Nghệ sĩ này đang tham gia vào một hoặc nhiều sự kiện.")
            raise e