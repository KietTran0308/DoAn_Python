from dao.danh_muc_dao import DanhMucDAO
from dto.danh_muc_su_kien import DanhMucSuKien


class DanhMucBUS:
    def __init__(self, db_connection):
        self.dao = DanhMucDAO(db_connection)

    def get_all_danh_muc(self):
        danh_sach_dto = self.dao.get_all()
        return [dm.to_dict() for dm in danh_sach_dto]

    def add_danh_muc(self, data):
        if not data.get('TEN_DM'):
            raise ValueError("Tên danh mục không được để trống!")

        new_dm = DanhMucSuKien(None, data['TEN_DM'], data.get('IMAGE_URL', ''))
        return self.dao.insert(new_dm)

    def update_danh_muc(self, ma_dmsk, data):
        if not data.get('TEN_DM'):
            raise ValueError("Tên danh mục không được để trống!")

        updated_dm = DanhMucSuKien(ma_dmsk, data['TEN_DM'], data.get('IMAGE_URL', ''))
        return self.dao.update(updated_dm)

    def delete_danh_muc(self, ma_dmsk):
        try:
            return self.dao.delete(ma_dmsk)
        except Exception as e:
            # Ràng buộc khóa ngoại: Không cho xóa nếu đang có sự kiện dùng danh mục này
            if "foreign key constraint fails" in str(e).lower():
                raise ValueError("Không thể xóa! Đang có sự kiện sử dụng danh mục này.")
            raise e