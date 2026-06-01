class SuKienDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_su_kien():
        # Giả lập kết nối DB
        conn = mysql.connector.connect(host="localhost", user="root", database="hethongsukien")
        cursor = conn.cursor(dictionary=True)  # dictionary=True giúp trả về dạng Key-Value

        sql = "SELECT MA_SK, TEN_SK, TG_BAT_DAU, TRANG_THAI FROM su_kien"
        cursor.execute(sql)
        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return data

    def getChiTietSK(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT sk.*, dm.TEN_DM, dd.TEN_DD, dd.DIA_CHI
            FROM su_kien sk
            JOIN danh_muc_su_kien dm ON sk.MA_DMSK = dm.MA_DMSK
            JOIN dia_diem dd ON sk.MA_DD = dd.MA_DD
            WHERE sk.MA_SK = %s
        """
        cursor.execute(query, (ma_sk,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def get_nghe_si_cua_su_kien(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT ns.* 
            FROM nghe_si ns
            JOIN sk_ns sn ON ns.MA_NS = sn.MA_NS
            WHERE sn.MA_SK = %s
        """
        cursor.execute(query, (ma_sk,))
        result = cursor.fetchall()
        cursor.close()
        return result