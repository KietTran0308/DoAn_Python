from dao.nguoi_dung_dao import NguoiDungDAO

class NguoiDungBUS:
    def __init__(self, db_connection):
        self.dao = NguoiDungDAO(db_connection)

    # Hàm xử lý nghiệp vụ đăng nhập
    def xu_ly_dang_nhap(self, username, password):
        # Bước 1: Gọi DAO để tìm tài khoản trong Database
        tai_khoan = self.dao.get_tai_khoan_by_username(username)

        # Bước 2: Kiểm tra xem tài khoản có tồn tại không
        if not tai_khoan:
            # Nếu không có dữ liệu, trả về lỗi
            return {"success": False, "message": "Tài khoản không tồn tại"}

        # Bước 3: So sánh mật khẩu (Trong thực tế, chỗ này phải dùng thư viện hash như bcrypt)
        # Ở đây so sánh chuỗi đơn giản theo mô hình của bạn
        if tai_khoan['MAT_KHAU'] != password:
            # Mật khẩu sai, trả về lỗi
            return {"success": False, "message": "Sai mật khẩu"}

        # Bước 4: Kiểm tra trạng thái tài khoản (ví dụ: 1 là hoạt động, 0 là bị khóa)
        if tai_khoan['TRANG_THAI'] == 0:
            return {"success": False, "message": "Tài khoản đang bị khóa"}

        # Bước 5: Nếu đúng hết, lấy thêm thông tin cá nhân của người dùng này
        thong_tin_ca_nhan = self.dao.get_thong_tin_nguoi_dung(tai_khoan['MA_TK'])

        # Trả về đối tượng JSON chứa thông tin để hiển thị lên giao diện
        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "data": {
                "ma_tk": tai_khoan['MA_TK'],
                "quyen": tai_khoan['TEN_NQ'],
                "ho_ten": f"{thong_tin_ca_nhan['HO']} {thong_tin_ca_nhan['TEN']}"
            }
        }
    
    # Bổ sung def xử lý đăng ký
    def xu_ly_dang_ky(
        self,
        username,
        password,
        ho,
        ten,
        email,
        sdt
    ):

    # kiểm tra username
    tai_khoan = self.dao.get_tai_khoan_by_username(username)

    if tai_khoan:
        return {
            "success": False,
            "message": "Tên đăng nhập đã tồn tại"
        }

    # kiểm tra email
    nguoi_dung = self.dao.get_nguoi_dung_by_email(email)

    if nguoi_dung:
        return {
            "success": False,
            "message": "Email đã được sử dụng"
        }

    # tạo tài khoản
    ma_tk = self.dao.create_tai_khoan(
        username,
        password
    )

    if not ma_tk:
        return {
            "success": False,
            "message": "Đăng ký thất bại"
        }

    # tạo thông tin người dùng
    self.dao.create_nguoi_dung(
        ma_tk,
        ho,
        ten,
        email,
        sdt
    )

    return {
        "success": True,
        "message": "Đăng ký thành công"
    }