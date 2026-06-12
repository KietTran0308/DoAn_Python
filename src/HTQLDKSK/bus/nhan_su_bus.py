import bcrypt
from dao.nhan_su_dao import NhanSuDAO
from dao.nguoi_dung_dao import NguoiDungDAO

class NhanSuBUS:
    def __init__(self, db_connection):
        self.dao = NhanSuDAO(db_connection)
        self.nguoi_dung_dao = NguoiDungDAO(db_connection)

    def get_danh_sach(self):
        ds = self.dao.get_all()
        for ns in ds:
            ns['HO_TEN'] = f"{ns.get('HO', '')} {ns.get('TEN', '')}".strip()
            ns['TRANG_THAI_TEXT'] = 'Hoạt động' if ns['TRANG_THAI'] == 1 else 'Bị khóa'
        return ds

    def tao_tai_khoan(self, data):
        ten_tk = data.get('ten_tk', '').strip()
        mat_khau = data.get('mat_khau', '')
        ma_nq = data.get('ma_nq')
        ho = data.get('ho', '').strip()
        ten = data.get('ten', '').strip()
        email = data.get('email', '').strip()
        sdt = data.get('sdt', '').strip()

        if not ten_tk or not mat_khau or not ma_nq or not ho or not ten or not email:
            raise ValueError("Vui lòng nhập đầy đủ thông tin bắt buộc.")
        if len(mat_khau) < 6:
            raise ValueError("Mật khẩu phải có ít nhất 6 ký tự.")

        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(mat_khau.encode('utf-8'), salt).decode('utf-8')

        ma_tk = self.dao.create_tai_khoan(ten_tk, hashed, ma_nq)
        self.nguoi_dung_dao.create(ma_tk, ho, ten, email, sdt)
        return ma_tk

    def khoa_tai_khoan(self, ma_tk):
        ns = self.dao.get_by_id(ma_tk)
        if not ns:
            raise ValueError("Không tìm thấy tài khoản.")
        self.dao.update_trang_thai(ma_tk, 0)

    def mo_khoa_tai_khoan(self, ma_tk):
        ns = self.dao.get_by_id(ma_tk)
        if not ns:
            raise ValueError("Không tìm thấy tài khoản.")
        self.dao.update_trang_thai(ma_tk, 1)

    def doi_nhom_quyen(self, ma_tk, ma_nq):
        ns = self.dao.get_by_id(ma_tk)
        if not ns:
            raise ValueError("Không tìm thấy tài khoản.")
        self.dao.update_nhom_quyen(ma_tk, ma_nq)

    def get_danh_sach_nhom_quyen(self):
        return self.dao.get_all_nhom_quyen()