class PhanQuyenDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_all_nhom_quyen(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT MA_NQ, TEN_NQ FROM nhom_quyen ORDER BY MA_NQ")
        result = cursor.fetchall()
        cursor.close()
        return result

    def get_all_chuc_nang(self):
        cursor = self.db.cursor(dictionary=True)
        # Sắp xếp Cha trước, sau đó đến các Con của nó
        query = """
            SELECT MA_CN, TEN_CN, MA_CN_CHA
            FROM chuc_nang
            ORDER BY COALESCE(MA_CN_CHA, MA_CN), 
                     (MA_CN_CHA IS NOT NULL), 
                     MA_CN
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result

    def get_quyen_theo_nhom(self, ma_nq):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT MA_CN, XEM, THEM, SUA, XOA
            FROM nq_cn
            WHERE MA_NQ = %s
        """
        cursor.execute(query, (ma_nq,))
        result = cursor.fetchall()
        cursor.close()
        return result

    def delete_quyen_theo_nhom(self, ma_nq):
        cursor = self.db.cursor()
        cursor.execute("DELETE FROM nq_cn WHERE MA_NQ = %s", (ma_nq,))
        self.db.commit()
        cursor.close()

    def insert_quyen_bulk(self, danh_sach):
        cursor = self.db.cursor()
        query = """
            INSERT INTO nq_cn (MA_NQ, MA_CN, XEM, THEM, SUA, XOA)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(query, danh_sach)
        self.db.commit()
        cursor.close()