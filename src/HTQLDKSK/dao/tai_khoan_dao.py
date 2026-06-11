class TaiKhoanDAO:

    MA_NQ_CUSTOMER = 4

    def __init__(self, db_connection):
        self.db = db_connection

    # tìm theo username
    def get_by_username(self, username):
        cursor = self.db.cursor(dictionary=True)

        query = """
            SELECT 
                tk.MA_TK,
                tk.MA_NQ,
                tk.TEN_TK,
                tk.MAT_KHAU,
                tk.TRANG_THAI,
                nq.TEN_NQ
            FROM tai_khoan tk
            JOIN nhom_quyen nq ON tk.MA_NQ = nq.MA_NQ
            WHERE tk.TEN_TK = %s
        """

        cursor.execute(query, (username,))
        result = cursor.fetchone()
        cursor.close()

        return result

    # tạo tài khoản
    def create(self, username, hashed_password):
        cursor = self.db.cursor()

        query = """
            INSERT INTO tai_khoan
            (
                MA_NQ,
                TEN_TK,
                MAT_KHAU,
                TRANG_THAI
            )
            VALUES
            (%s, %s, %s, 1)
        """

        cursor.execute(
            query,
            (
                self.MA_NQ_CUSTOMER,
                username,
                hashed_password
            )
        )

        self.db.commit()

        ma_tk = cursor.lastrowid
        cursor.close()

        return ma_tk