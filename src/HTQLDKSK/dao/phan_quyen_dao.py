class PhanQuyenDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    # Lấy ma trận quyền: mỗi nhóm quyền có quyền gì với từng chức năng
    def get_ma_tran_quyen(self):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT nq.MA_NQ, nq.TEN_NQ,
                   cn.MA_CN, cn.TEN_CN, cn.MA_CN_CHA,
                   COALESCE(nqcn.XEM, 0) AS XEM,
                   COALESCE(nqcn.THEM, 0) AS THEM,
                   COALESCE(nqcn.SUA, 0) AS SUA,
                   COALESCE(nqcn.XOA, 0) AS XOA
            FROM nhom_quyen nq
            CROSS JOIN chuc_nang cn
            LEFT JOIN nq_cn nqcn ON nq.MA_NQ = nqcn.MA_NQ AND cn.MA_CN = nqcn.MA_CN
            WHERE nq.MA_NQ IN (1, 2, 3, 7, 8, 9, 10)
            ORDER BY nq.MA_NQ, cn.MA_CN
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result

    # Cập nhật quyền cho 1 nhóm với 1 chức năng
    def update_quyen(self, ma_nq, ma_cn, xem, them, sua, xoa):
        cursor = self.db.cursor()
        # Dùng REPLACE INTO để tự động INSERT nếu chưa có, UPDATE nếu đã có
        query = """
            REPLACE INTO nq_cn (MA_NQ, MA_CN, XEM, THEM, SUA, XOA)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (ma_nq, ma_cn, xem, them, sua, xoa))
        self.db.commit()
        cursor.close()

    # Cập nhật hàng loạt (nhiều quyền cùng lúc)
    def update_quyen_bulk(self, danh_sach):
        cursor = self.db.cursor()
        query = """
            REPLACE INTO nq_cn (MA_NQ, MA_CN, XEM, THEM, SUA, XOA)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        data = [(q['ma_nq'], q['ma_cn'], q['xem'], q['them'], q['sua'], q['xoa'])
                for q in danh_sach]
        cursor.executemany(query, data)
        self.db.commit()
        cursor.close()