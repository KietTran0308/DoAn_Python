from dto.dia_diem import DiaDiem

class DiaDiemDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    # Lấy danh sách các khu vực (Khán đài A, Khu VIP...) của một sự kiện
    def get_khu_vuc_by_su_kien(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        # Truy vấn lấy dữ liệu khu vực kèm theo giá tiền của khu vực đó (từ bảng hang_ghe)
        query = """
            SELECT kv.*, hg.GIA_TIEN
            FROM khu_vuc kv
            JOIN hang_ghe hg ON kv.MA_HG = hg.MA_HG
            WHERE kv.MA_SK = %s
        """
        cursor.execute(query, (ma_sk,))
        # Dùng fetchall vì một sự kiện có rất nhiều khu vực
        result = cursor.fetchall()
        cursor.close()
        return result

    # Lấy toàn bộ ghế của một khu vực cụ thể
    def get_ghe_by_khu_vuc(self, ma_kv):
        cursor = self.db.cursor(dictionary=True)
        # Trả về các thông số ghế, đặc biệt là TRANG_THAI để biết ghế trống hay đã bán
        query = "SELECT MA_GHE, DAY_GHE, SO_GHE, TRANG_THAI, CSS_CLASS FROM ghe WHERE MA_KV = %s"
        cursor.execute(query, (ma_kv,))
        result = cursor.fetchall()
        cursor.close()
        return result

    def getList(self):
        cursor = self.db.cursor(dictionary=True)
        query = ("SELECT MA_DD, TEN_DD, DIA_CHI, TONG_SO_COT, TONG_SO_HANG FROM dia_diem")
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result

    def insert(self, dd: DiaDiem):
        cursor = self.db.cursor()
        query = "INSERT INTO dia_diem (TEN_DD, DIA_CHI, TONG_SO_COT, TONG_SO_HANG, LAYOUT_DATA) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query, (dd.ten_dd, dd.dia_chi, dd.tong_so_cot, dd.tong_so_hang, dd.layout_data))
        self.db.commit()
        cursor.close()
        return True

    def update(self, dd: DiaDiem):
        cursor = self.db.cursor()
        query = "UPDATE dia_diem SET TEN_DD = %s, DIA_CHI = %s, TONG_SO_COT = %s, TONG_SO_HANG = %s, LAYOUT_DATA = %s WHERE MA_DD = %s"
        cursor.execute(query, (dd.ten_dd, dd.dia_chi, dd.tong_so_cot, dd.tong_so_hang, dd.layout_data, dd.ma_dd))
        self.db.commit()
        cursor.close()
        return True

    def delete(self, ma_dd):
        cursor = self.db.cursor()
        query = "DELETE FROM dia_diem WHERE MA_DD = %s"
        cursor.execute(query, (ma_dd,))
        self.db.commit()
        cursor.close()
        return True