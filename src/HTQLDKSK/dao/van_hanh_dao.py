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
    
    def kiem_tra_da_su_dung(self, ma_ve):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT MA_LOG FROM check_in_log
            WHERE MA_VE = %s AND TRANG_THAI = 1
            LIMIT 1
        """
        cursor.execute(query, (ma_ve,))
        result = cursor.fetchone()
        cursor.close()
        return result is not None

    # Hàm ghi lại lịch sử check-in vào cổng
    def ghi_log_check_in(self, ma_ve, ma_tk_nhan_vien, trang_thai, ten_cong):
        cursor = self.db.cursor()
        # Lấy MA_LOG lớn nhất hiện tại rồi +1
        cursor.execute("SELECT COALESCE(MAX(MA_LOG), 0) + 1 FROM check_in_log")
        ma_log = cursor.fetchone()[0]
        query = """
            INSERT INTO check_in_log (MA_LOG, MA_VE, MA_TK, TRANG_THAI, TG_QUET, TEN_CONG)
            VALUES (%s, %s, %s, %s, NOW(), %s)
        """
        cursor.execute(query, (ma_log, ma_ve, ma_tk_nhan_vien, trang_thai, ten_cong))
        self.db.commit()
        cursor.close()