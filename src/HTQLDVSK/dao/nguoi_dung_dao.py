class NguoiDungDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    # Lấy thông tin người dùng theo mã tài khoản
    def get_by_ma_tk(self, ma_tk):
        cursor = self.db.cursor(dictionary=True)

        query = """
            SELECT *
            FROM nguoi_dung
            WHERE MA_TK = %s
        """

        cursor.execute(query, (ma_tk,))
        result = cursor.fetchone()

        cursor.close()

        return result

    # Kiểm tra email đã tồn tại hay chưa
    def get_by_email(self, email):
        cursor = self.db.cursor(dictionary=True)

        query = """
            SELECT *
            FROM nguoi_dung
            WHERE EMAIL = %s
        """

        cursor.execute(query, (email,))
        result = cursor.fetchone()

        cursor.close()

        return result
    
    # Alias dùng cho TaiKhoanBUS.xac_thuc()
    def get_thong_tin_nguoi_dung(self, ma_tk):
        return self.get_by_ma_tk(ma_tk)

    # Tạo người dùng mới
    def create(
        self,
        ma_tk,
        ho,
        ten,
        email,
        sdt
    ):
        cursor = self.db.cursor()

        query = """
            INSERT INTO nguoi_dung
            (
                MA_TK,
                HO,
                TEN,
                EMAIL,
                SDT
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        cursor.execute(
            query,
            (
                ma_tk,
                ho,
                ten,
                email,
                sdt
            )
        )

        self.db.commit()

        cursor.close()