from  dao.van_hanh_dao import VanHanhDao

class VanHanhBUS:
    def __init__(self, db_connection):
        self.dao = VanHanhDAO(db_connection)

    # Hàm xử lý logic khi nhân viên cầm máy quét mã QR của khách
    def xu_ly_quet_ve(self, qr_code, ma_tk_nhan_vien, ten_cong):
        # Bước 1: Tra cứu xem mã QR này có tồn tại trong hệ thống không
        ve_info = self.dao.tim_ve_theo_qr(qr_code)

        # Nếu vé không tồn tại (QR giả mạo)
        if not ve_info:
            # Vẫn ghi log lại để cảnh báo có người dùng vé giả (trạng thái 0 = Thất bại)
            self.dao.ghi_log_check_in(None, ma_tk_nhan_vien, 0, ten_cong)
            return {"hợp_lệ": False, "tin_nhắn": "Vé không hợp lệ hoặc QR giả mạo!"}

        # Lấy mã vé thật từ database
        ma_ve = ve_info['MA_VE']

        # Bước 2: Kiểm tra xem vé này đã được sử dụng trước đó chưa
        # (Chỗ này cần thêm 1 hàm DAO check xem ma_ve này đã có trong bảng check_in_log với trạng thái thành công chưa,
        # vì lý do ngắn gọn tôi giả sử biến is_used lưu kết quả kiểm tra đó)
        is_used = False  # Giả lập vé chưa dùng

        if is_used:
            # Nếu vé đã quét rồi (người dùng copy vé của nhau) -> Ghi log thất bại
            self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 0, ten_cong)
            return {"hợp_lệ": False, "tin_nhắn": "Vé này đã được sử dụng để vào cổng trước đó!"}

        # Bước 3: Vé hợp lệ và chưa sử dụng -> Ghi log thành công (trạng thái 1)
        self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 1, ten_cong)

        return {"hợp_lệ": True, "tin_nhắn": "Check-in thành công. Mời khách vào!"}