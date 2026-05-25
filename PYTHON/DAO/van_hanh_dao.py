class VanHanhDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    # Hàm tìm vé dựa trên mã QR được quét
    def tim_ve_theo_qr(self, qr_code):
        cursor = self.db.cursor(dictionary=True)
        # Truy vấn bảng ve dựa vào mã QR_CODE
        query = "SELECT * FROM ve WHERE QR_CODE = %s"
        cursor.execute(query, (qr_code,))
        result = cursor.fetchone()
        cursor.close()
        return result

    # Hàm ghi lại lịch sử check-in vào cổng
    def ghi_log_check_in(self, ma_ve, ma_tk_nhan_vien, trang_thai, ten_cong):
        cursor = self.db.cursor()
        # Lưu vào bảng check_in_log với thời gian quét (NOW())
        query = """
            INSERT INTO check_in_log (MA_VE, MA_TK, TRANG_THAI, TG_QUET, TEN_CONG)
            VALUES (%s, %s, %s, NOW(), %s)
        """
        cursor.execute(query, (ma_ve, ma_tk_nhan_vien, trang_thai, ten_cong))
        self.db.commit() # Xác nhận ghi vào database
        cursor.close()