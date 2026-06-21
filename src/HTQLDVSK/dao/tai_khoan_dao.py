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

    def get_by_username_or_email(self, identifier):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT 
                tk.MA_TK,
                tk.MA_NQ,
                tk.TEN_TK,
                tk.MAT_KHAU,
                tk.TRANG_THAI,
                nq.TEN_NQ,
                nd.HO,
                nd.TEN
            FROM tai_khoan tk
            JOIN nhom_quyen nq ON tk.MA_NQ = nq.MA_NQ
            LEFT JOIN nguoi_dung nd ON tk.MA_TK = nd.MA_TK
            WHERE tk.TEN_TK = %s OR nd.EMAIL = %s
        """
        cursor.execute(query, (identifier, identifier))
        result = cursor.fetchone()
        cursor.close()
        return result

    def check_exists(self, username, email):
        cursor = self.db.cursor(dictionary=True)

        # Kiểm tra trùng tên đăng nhập
        cursor.execute("SELECT MA_TK FROM tai_khoan WHERE TEN_TK = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            return "Tên đăng nhập đã tồn tại"

        # Kiểm tra trùng email
        cursor.execute("SELECT MA_TK FROM nguoi_dung WHERE EMAIL = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return "Email đã được sử dụng"

        cursor.close()
        return None

    def check_ma_tk_exists(self, ma_tk):
        cursor = self.db.cursor()
        try:
            cursor.execute("SELECT 1 FROM tai_khoan WHERE MA_TK = %s", (ma_tk,))
            result = cursor.fetchone()
            return result is not None
        finally:
            cursor.close()

    def dang_ky_khach_hang(self, ma_tk, username, hashed_password, ho, ten, email, sdt):
        cursor = self.db.cursor()
        try:
            # 1. Chèn vào bảng tai_khoan với MA_TK được chỉ định
            query_tk = """
                INSERT INTO tai_khoan (MA_TK, MA_NQ, TEN_TK, MAT_KHAU, TRANG_THAI)
                VALUES (%s, %s, %s, %s, 1)
            """
            cursor.execute(query_tk, (ma_tk, self.MA_NQ_CUSTOMER, username, hashed_password))

            # 2. Chèn thông tin cá nhân vào bảng nguoi_dung
            query_nd = """
                INSERT INTO nguoi_dung (MA_TK, HO, TEN, EMAIL, SDT)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query_nd, (ma_tk, ho, ten, email, sdt))

            self.db.commit()
            return ma_tk
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

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

    # Thêm vào dưới cùng của class TaiKhoanDAO
    def get_all_khach_hang(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            # Lấy các tài khoản thuộc nhóm quyền 4 (Khách hàng) và 5 (VIP)
            query = """
                SELECT 
                    tk.MA_TK, 
                    tk.TEN_TK, 
                    tk.TRANG_THAI, 
                    tk.MA_NQ,
                    nd.HO, 
                    nd.TEN, 
                    nd.EMAIL, 
                    nd.SDT, 
                    nd.AVATAR_URL
                FROM tai_khoan tk
                LEFT JOIN nguoi_dung nd ON tk.MA_TK = nd.MA_TK
                WHERE tk.MA_NQ IN (4, 5)
                ORDER BY tk.MA_TK DESC
            """
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            cursor.close()

    # Thêm vào dưới cùng của class TaiKhoanDAO
    def get_all_roles(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            cursor.execute("SELECT MA_NQ, TEN_NQ FROM nhom_quyen ORDER BY MA_NQ ASC")
            return cursor.fetchall()
        finally:
            cursor.close()

    def get_all_functions(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            sql = """
                            SELECT MA_CN, TEN_CN, MA_CN_CHA 
                            FROM chuc_nang 
                            ORDER BY COALESCE(MA_CN_CHA, MA_CN) ASC, MA_CN_CHA IS NOT NULL ASC, MA_CN ASC
                        """
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()

    def get_menu_by_user(self, ma_tk):
        cursor = self.db.cursor(dictionary=True)
        try:
            # Chỉ lấy những chức năng mà tài khoản có quyền XEM = 1
            sql = """
                SELECT c.MA_CN, c.TEN_CN, c.MA_CN_CHA, nc.XEM
                FROM chuc_nang c
                JOIN nq_cn nc ON c.MA_CN = nc.MA_CN
                JOIN tai_khoan tk ON nc.MA_NQ = tk.MA_NQ
                WHERE tk.MA_TK = %s AND nc.XEM = 1
                ORDER BY COALESCE(c.MA_CN_CHA, c.MA_CN) ASC, c.MA_CN_CHA IS NOT NULL ASC, c.MA_CN ASC
            """
            cursor.execute(sql, (ma_tk,))
            return cursor.fetchall()
        finally:
            cursor.close()

    def get_permissions_by_role(self, ma_nq):
        cursor = self.db.cursor(dictionary=True)
        try:
            cursor.execute("SELECT MA_CN, XEM, THEM, SUA, XOA FROM nq_cn WHERE MA_NQ = %s", (ma_nq,))
            return cursor.fetchall()
        finally:
            cursor.close()

    def update_permissions(self, ma_nq, permissions):
        cursor = self.db.cursor()
        try:
            # 1. Xóa phân quyền cũ của nhóm này
            cursor.execute("DELETE FROM nq_cn WHERE MA_NQ = %s", (ma_nq,))

            # 2. Thêm phân quyền mới
            if permissions:
                sql = "INSERT INTO nq_cn (MA_NQ, MA_CN, XEM, THEM, SUA, XOA) VALUES (%s, %s, %s, %s, %s, %s)"
                values = [(ma_nq, p['MA_CN'], p['XEM'], p['THEM'], p['SUA'], p['XOA']) for p in permissions]
                cursor.executemany(sql, values)

            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def update_last_login(self, ma_tk):
        cursor = self.db.cursor()
        try:
            query = "UPDATE tai_khoan SET LAN_DANG_NHAP_CUOI = CURRENT_TIMESTAMP WHERE MA_TK = %s"
            cursor.execute(query, (ma_tk,))
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()
