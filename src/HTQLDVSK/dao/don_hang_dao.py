class DonHangDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_don_hang(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            sql = """
                SELECT dh.MA_DH,
                       tk.TEN_TK,
                       sk.TEN_SK,
                       dh.TONG_TIEN_BAN_DAU,
                       dh.SO_TIEN_DUOC_GIAM,
                       dh.TONG_TIEN_CON_LAI,
                       dh.TG_TAO_DH,
                       dh.TRANG_THAI
                FROM don_hang dh
                JOIN tai_khoan tk ON dh.MA_TK = tk.MA_TK
                JOIN su_kien sk   ON dh.MA_SK = sk.MA_SK
                ORDER BY dh.TG_TAO_DH DESC
            """
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()

    def lay_chi_tiet_don_hang(self, ma_dh):
        """
        Trả về danh sách vé thuộc đơn hàng, kèm thông tin khu vực / hàng ghế.
        Mỗi row = 1 vé, nhóm theo TEN_HG (tên hàng ghế / khu vực) ở tầng BUS.
        """
        cursor = self.db.cursor(dictionary=True)
        try:
            sql = """
                SELECT
                    v.MA_VE,
                    v.QR_CODE,
                    v.GIA_VE_LUC_MUA,
                    hg.TEN_HG,
                    kv.TEN_KV
                FROM ve v
                LEFT JOIN khu_vuc kv ON v.MA_KV = kv.MA_KV
                LEFT JOIN hang_ghe hg ON kv.MA_HG = hg.MA_HG
                WHERE v.MA_DH = %s
                ORDER BY hg.TEN_HG, kv.TEN_KV
            """
            cursor.execute(sql, (ma_dh,))
            return cursor.fetchall()
        finally:
            cursor.close()

    def cap_nhat_trang_thai(self, ma_dh, trang_thai_moi):
        cursor = self.db.cursor()
        try:
            sql = "UPDATE don_hang SET TRANG_THAI = %s WHERE MA_DH = %s"
            cursor.execute(sql, (trang_thai_moi, ma_dh))
            self.db.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()

    def lay_tat_ca_giam_gia(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            sql = "SELECT * FROM giam_gia ORDER BY MA_GG DESC"
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()