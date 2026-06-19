class BaoCaoDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_all_orders_for_report(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            # Lấy tất cả đơn hàng kèm theo tên sự kiện và mã người tổ chức (MA_TK_TC)
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