class BaoCaoDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_all_orders_for_report(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            query = """
                SELECT
                    dh.MA_DH,
                    dh.MA_SK,
                    sk.TEN_SK,
                    sk.MA_TK_TC,
                    dh.TONG_TIEN_BAN_DAU,
                    dh.SO_TIEN_DUOC_GIAM,
                    dh.TONG_TIEN_CON_LAI,
                    dh.TG_TAO_DH,
                    dh.TRANG_THAI
                FROM don_hang dh
                JOIN su_kien sk ON dh.MA_SK = sk.MA_SK
                ORDER BY dh.TG_TAO_DH DESC
            """
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            cursor.close()

    def get_checkin_logs_for_stats(self, ma_sk=None):
        """
        Lấy log check-in kèm thông tin sự kiện và khách hàng.
        Nếu ma_sk được truyền thì lọc theo sự kiện đó.
        """
        cursor = self.db.cursor(dictionary=True)
        try:
            base_query = """
                SELECT
                    cl.MA_LOG,
                    cl.TG_QUET,
                    cl.TEN_CONG,
                    cl.TRANG_THAI,
                    v.QR_CODE,
                    sk.MA_SK,
                    sk.TEN_SK,
                    nd.HO,
                    nd.TEN,
                    nv_nd.HO  AS HO_NV,
                    nv_nd.TEN AS TEN_NV
                FROM check_in_log cl
                LEFT JOIN ve v              ON cl.MA_VE   = v.MA_VE
                LEFT JOIN don_hang dh       ON v.MA_DH    = dh.MA_DH
                LEFT JOIN su_kien sk        ON dh.MA_SK   = sk.MA_SK
                LEFT JOIN tai_khoan tk      ON dh.MA_TK   = tk.MA_TK
                LEFT JOIN nguoi_dung nd     ON tk.MA_TK   = nd.MA_TK
                LEFT JOIN tai_khoan tk_nv   ON cl.MA_TK   = tk_nv.MA_TK
                LEFT JOIN nguoi_dung nv_nd  ON tk_nv.MA_TK = nv_nd.MA_TK
            """
            if ma_sk:
                cursor.execute(base_query + " WHERE dh.MA_SK = %s ORDER BY cl.TG_QUET DESC", (ma_sk,))
            else:
                cursor.execute(base_query + " ORDER BY cl.TG_QUET DESC")
            return cursor.fetchall()
        finally:
            cursor.close()