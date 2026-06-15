import bcrypt
from datetime import datetime

from dao.tai_khoan_dao import TaiKhoanDAO
from dao.nguoi_dung_dao import NguoiDungDAO


class TaiKhoanBUS:

    def __init__(self, db_connection):
        self.tai_khoan_dao = TaiKhoanDAO(db_connection)

    # mã hóa mật khẩu
    def _ma_hoa_mat_khau(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    # kiểm tra mật khẩu
    def _kiem_tra_mat_khau(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

    # format mã hiển thị: YY + 6 số
    @staticmethod
    def format_ma_tk(ma_tk: int) -> str:
        nam = datetime.now().year % 100
        return f"{nam}{ma_tk:06d}"

    # đăng nhập
    def xac_thuc(self, identifier, password):
        tai_khoan = self.tai_khoan_dao.get_by_username_or_email(identifier)

        if not tai_khoan:
            return {"success": False, "message": "Tên đăng nhập hoặc Email không tồn tại!"}

        if tai_khoan["TRANG_THAI"] == 0:
            return {"success": False, "message": "Tài khoản của bạn đã bị khóa!"}

        if not self._kiem_tra_mat_khau(password, tai_khoan["MAT_KHAU"]):
            return {"success": False, "message": "Mật khẩu không chính xác!"}

        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "data": {
                "ma_tk": tai_khoan["MA_TK"],
                "ma_hien_thi": self.format_ma_tk(tai_khoan["MA_TK"]),
                "ten_tk": tai_khoan["TEN_TK"],
                "quyen": tai_khoan["TEN_NQ"],
                "ho_ten": f"{tai_khoan['HO'] or ''} {tai_khoan['TEN'] or ''}".strip()
            }
        }

    # đăng ký
    def dang_ky(self, username, password, ho, ten, email, sdt):
        # 1. Kiểm tra tồn tại
        error_msg = self.tai_khoan_dao.check_exists(username, email)
        if error_msg:
            return {"success": False, "message": error_msg}

        # 2. Mã hóa mật khẩu
        hashed_password = self._ma_hoa_mat_khau(password)

        # 3. Lưu vào Database
        ma_tk = self.tai_khoan_dao.dang_ky_khach_hang(
            username, hashed_password, ho, ten, email, sdt
        )

        return {
            "success": True,
            "message": "Đăng ký thành công",
            "data": {
                "ma_tk": ma_tk,
                "ma_hien_thi": self.format_ma_tk(ma_tk)
            }
        }

    # Thêm vào dưới cùng của class TaiKhoanBUS
    def lay_danh_sach_khach_hang(self):
        # Trả về danh sách dictionary đã được định dạng sẵn từ DAO
        return self.tai_khoan_dao.get_all_khach_hang()

# Thêm vào dưới cùng của class TaiKhoanBUS
    def lay_tat_ca_nhom_quyen(self):
        return self.tai_khoan_dao.get_all_roles()

    def lay_tat_ca_chuc_nang(self):
        return self.tai_khoan_dao.get_all_functions()

    def lay_phan_quyen_theo_nhom(self, ma_nq):
        return self.tai_khoan_dao.get_permissions_by_role(ma_nq)

    def cap_nhat_phan_quyen(self, ma_nq, permissions):
        self.tai_khoan_dao.update_permissions(ma_nq, permissions)
        return {"success": True, "message": "Cập nhật phân quyền thành công"}

    def lay_menu_theo_tai_khoan(self, ma_tk):
        return self.tai_khoan_dao.get_menu_by_user(ma_tk)