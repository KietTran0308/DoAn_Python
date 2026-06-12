class NhanSuDAO:
    # MA_NQ của nhân sự (không phải customer)
    MA_NQ_NHAN_SU = (1, 2, 3, 7, 8, 9, 10)

    def __init__(self, db_connection):
        self.db = db_connection

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT tk.MA_TK, tk.TEN_TK, tk.MA_NQ, tk.TRANG_THAI,
                   nq.TEN_NQ, nd.HO, nd.TEN, nd.EMAIL, nd.SDT
            FROM tai_khoan tk
            JOIN nhom_quyen nq ON tk.MA_NQ = nq.MA_NQ
            LEFT JOIN nguoi_dung nd ON tk.MA_TK = nd.MA_TK
            WHERE tk.MA_NQ IN (1, 2, 3, 7, 8, 9, 10)
            ORDER BY tk.MA_TK ASC
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result

    def get_by_id(self, ma_tk):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT tk.MA_TK, tk.TEN_TK, tk.MA_NQ, tk.TRANG_THAI,
                   nq.TEN_NQ, nd.HO, nd.TEN, nd.EMAIL, nd.SDT
            FROM tai_khoan tk
            JOIN nhom_quyen nq ON tk.MA_NQ = nq.MA_NQ
            LEFT JOIN nguoi_dung nd ON tk.MA_TK = nd.MA_TK
            WHERE tk.MA_TK = %s
        """
        cursor.execute(query, (ma_tk,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def create_tai_khoan(self, ten_tk, hashed_password, ma_nq):
        cursor = self.db.cursor()
        query = """
            INSERT INTO tai_khoan (MA_NQ, TEN_TK, MAT_KHAU, TRANG_THAI)
            VALUES (%s, %s, %s, 1)
        """
        cursor.execute(query, (ma_nq, ten_tk, hashed_password))
        self.db.commit()
        ma_tk = cursor.lastrowid
        cursor.close()
        return ma_tk

    def update_trang_thai(self, ma_tk, trang_thai):
        cursor = self.db.cursor()
        query = "UPDATE tai_khoan SET TRANG_THAI = %s WHERE MA_TK = %s"
        cursor.execute(query, (trang_thai, ma_tk))
        self.db.commit()
        cursor.close()

    def update_nhom_quyen(self, ma_tk, ma_nq):
        cursor = self.db.cursor()
        query = "UPDATE tai_khoan SET MA_NQ = %s WHERE MA_TK = %s"
        cursor.execute(query, (ma_nq, ma_tk))
        self.db.commit()
        cursor.close()

    def get_all_nhom_quyen(self):
        cursor = self.db.cursor(dictionary=True)
        # Chỉ lấy nhóm quyền dành cho nhân sự
        query = """
            SELECT MA_NQ, TEN_NQ FROM nhom_quyen
            WHERE MA_NQ IN (1, 2, 3, 7, 8, 9, 10)
            ORDER BY MA_NQ ASC
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result