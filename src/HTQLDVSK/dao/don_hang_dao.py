class DonHangDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_don_hang(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            # Lấy thông tin đơn hàng kèm Tên tài khoản và Tên sự kiện
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
                           JOIN su_kien sk ON dh.MA_SK = sk.MA_SK
                  ORDER BY dh.TG_TAO_DH DESC;
                  """
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()

    def lay_tat_ca_giam_gia(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            # Lấy toàn bộ danh sách mã khuyến mãi, sắp xếp mới nhất lên đầu
            sql = "SELECT * FROM giam_gia ORDER BY MA_GG DESC;"
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()