class NguoiDungDAO:
    # Hàm khởi tạo nhận vào kết nối cơ sở dữ liệu
    def __init__(self, db_connection):
        self.db = db_connection

    # Hàm lấy thông tin tài khoản dựa vào tên đăng nhập (TEN_TK)
    def get_tai_khoan_by_username(self, username):
        # Tạo cursor trả về dữ liệu dạng Dictionary (key-value)
        cursor = self.db.cursor(dictionary=True)
        # Viết câu lệnh SQL lấy tài khoản và cả thông tin nhóm quyền tương ứng
        query = """
            SELECT tk.*, nq.TEN_NQ 
            FROM tai_khoan tk
            JOIN nhom_quyen nq ON tk.MA_NQ = nq.MA_NQ
            WHERE tk.TEN_TK = %s
        """
        # Thực thi câu lệnh với tham số username truyền vào (chống SQL Injection)
        cursor.execute(query, (username,))
        # Lấy ra 1 dòng kết quả duy nhất (vì tên đăng nhập là độc nhất)
        result = cursor.fetchone()
        # Đóng cursor để giải phóng bộ nhớ
        cursor.close()
        # Trả về kết quả cho tầng BUS
        return result

    # Hàm lấy thông tin chi tiết người dùng (Họ tên, SĐT...) dựa vào mã tài khoản
    def get_thong_tin_nguoi_dung(self, ma_tk):
        cursor = self.db.cursor(dictionary=True)
        # Truy vấn vào bảng nguoi_dung
        query = "SELECT * FROM nguoi_dung WHERE MA_TK = %s"
        cursor.execute(query, (ma_tk,))
        result = cursor.fetchone()
        cursor.close()
        return result