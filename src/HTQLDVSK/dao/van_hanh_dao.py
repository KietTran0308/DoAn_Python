class VanHanhDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    # Hàm tìm vé dựa trên mã QR được quét
    def tim_ve_theo_qr(self, qr_code):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT v.MA_VE, v.QR_CODE, v.GIA_VE_LUC_MUA,
                   nd.HO, nd.TEN, nd.EMAIL,
                   sk.TEN_SK
            FROM ve v
            JOIN don_hang dh ON v.MA_DH = dh.MA_DH
            JOIN tai_khoan tk ON dh.MA_TK = tk.MA_TK
            JOIN nguoi_dung nd ON tk.MA_TK = nd.MA_TK
            JOIN su_kien sk ON dh.MA_SK = sk.MA_SK
            WHERE v.QR_CODE = %s
        """
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
        cursor.execute("SELECT COALESCE(MAX(MA_LOG), 0) + 1 FROM check_in_log")
        ma_log = cursor.fetchone()[0]
        query = """
            INSERT INTO check_in_log (MA_LOG, MA_VE, MA_TK, TRANG_THAI, TG_QUET, TEN_CONG)
            VALUES (%s, %s, %s, %s, NOW(), %s)
        """
        cursor.execute(query, (ma_log, ma_ve, ma_tk_nhan_vien, trang_thai, ten_cong))
        self.db.commit()
        cursor.close()

    # Lấy lịch sử check-in theo sự kiện (dùng cho CN52)
    def get_lich_su_by_su_kien(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT
                cl.MA_LOG,
                cl.TG_QUET,
                cl.TEN_CONG,
                cl.TRANG_THAI,
                v.QR_CODE,
                v.GIA_VE_LUC_MUA,
                nd.HO,
                nd.TEN,
                nd.EMAIL,
                nv_nd.HO  AS HO_NV,
                nv_nd.TEN AS TEN_NV
            FROM check_in_log cl
            LEFT JOIN ve v          ON cl.MA_VE  = v.MA_VE
            LEFT JOIN don_hang dh   ON v.MA_DH   = dh.MA_DH
            LEFT JOIN tai_khoan tk  ON dh.MA_TK  = tk.MA_TK
            LEFT JOIN nguoi_dung nd ON tk.MA_TK  = nd.MA_TK
            LEFT JOIN tai_khoan tk_nv   ON cl.MA_TK   = tk_nv.MA_TK
            LEFT JOIN nguoi_dung nv_nd  ON tk_nv.MA_TK = nv_nd.MA_TK
            WHERE dh.MA_SK = %s
            ORDER BY cl.TG_QUET DESC
        """
        cursor.execute(query, (ma_sk,))
        result = cursor.fetchall()
        cursor.close()
        return result

    # Lấy TOÀN BỘ lịch sử check-in (không lọc sự kiện — dùng cho Admin xem tổng)
    def get_all_lich_su(self):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT
                cl.MA_LOG,
                cl.TG_QUET,
                cl.TEN_CONG,
                cl.TRANG_THAI,
                v.QR_CODE,
                v.GIA_VE_LUC_MUA,
                sk.MA_SK,
                sk.TEN_SK,
                nd.HO,
                nd.TEN,
                nd.EMAIL,
                nv_nd.HO  AS HO_NV,
                nv_nd.TEN AS TEN_NV
            FROM check_in_log cl
            LEFT JOIN ve v          ON cl.MA_VE  = v.MA_VE
            LEFT JOIN don_hang dh   ON v.MA_DH   = dh.MA_DH
            LEFT JOIN su_kien sk    ON dh.MA_SK  = sk.MA_SK
            LEFT JOIN tai_khoan tk  ON dh.MA_TK  = tk.MA_TK
            LEFT JOIN nguoi_dung nd ON tk.MA_TK  = nd.MA_TK
            LEFT JOIN tai_khoan tk_nv   ON cl.MA_TK   = tk_nv.MA_TK
            LEFT JOIN nguoi_dung nv_nd  ON tk_nv.MA_TK = nv_nd.MA_TK
            ORDER BY cl.TG_QUET DESC
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result