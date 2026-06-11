import bcrypt
from datetime import datetime

from dao.tai_khoan_dao import TaiKhoanDAO
from dao.nguoi_dung_dao import NguoiDungDAO


class TaiKhoanBUS:

    def __init__(self, db_connection):
        self.tai_khoan_dao = TaiKhoanDAO(db_connection)
        self.nguoi_dung_dao = NguoiDungDAO(db_connection)

    # mã hóa mật khẩu
    def _ma_hoa_mat_khau(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    # kiểm tra mật khẩu
    def _kiem_tra_mat_khau(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            hashed.encode("utf-8")
        )

    # format mã hiển thị: YY + 6 số
    @staticmethod
    def format_ma_tk(ma_tk: int) -> str:
        nam = datetime.now().year % 100
        return f"{nam}{ma_tk:06d}"

    # đăng nhập
    def xac_thuc(self, username, password):

        tai_khoan = self.tai_khoan_dao.get_by_username(username)

        if not tai_khoan:
            return {
                "success": False,
                "message": "Tài khoản không tồn tại"
            }

        if not tai_khoan.get("MAT_KHAU"):
            return {
                "success": False,
                "message": "Dữ liệu tài khoản lỗi"
            }

        if not self._kiem_tra_mat_khau(password, tai_khoan["MAT_KHAU"]):
            return {
                "success": False,
                "message": "Sai mật khẩu"
            }

        if tai_khoan["TRANG_THAI"] == 0:
            return {
                "success": False,
                "message": "Tài khoản đã bị khóa"
            }

        thong_tin = self.nguoi_dung_dao.get_thong_tin_nguoi_dung(
            tai_khoan["MA_TK"]
        )

        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "data": {
                "ma_tk": tai_khoan["MA_TK"],
                "ma_hien_thi": self.format_ma_tk(tai_khoan["MA_TK"]),
                "ten_tk": tai_khoan["TEN_TK"],
                "quyen": tai_khoan["TEN_NQ"],
                "ho_ten": f"{thong_tin['HO']} {thong_tin['TEN']}"
            }
        }

    # đăng ký
    def dang_ky(self, username, password, ho, ten, email, sdt):

        if self.tai_khoan_dao.get_by_username(username):
            return {
                "success": False,
                "message": "Tên đăng nhập đã tồn tại"
            }

        if self.nguoi_dung_dao.get_by_email(email):
            return {
                "success": False,
                "message": "Email đã được sử dụng"
            }

        hashed_password = self._ma_hoa_mat_khau(password)

        ma_tk = self.tai_khoan_dao.create(
            username,
            hashed_password
        )

        self.nguoi_dung_dao.create(
            ma_tk,
            ho,
            ten,
            email,
            sdt
        )

        return {
            "success": True,
            "message": "Đăng ký thành công",
            "data": {
                "ma_tk": ma_tk,
                "ma_hien_thi": self.format_ma_tk(ma_tk)
            }
        }