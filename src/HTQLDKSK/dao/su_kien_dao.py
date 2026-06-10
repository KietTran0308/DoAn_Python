class SuKienDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_su_kien(self):
        cursor = self.db.cursor(dictionary=True)
        sql = """
              SELECT sk.MA_SK, \
                     sk.TEN_SK, \
                     dm.TEN_DM, \
                     sk.TG_BAT_DAU, \
                     dd.TEN_DD, \
                     sk.TRANG_THAI, \
                     (SELECT COUNT(*) \
                      FROM ve v \
                               JOIN don_hang dh ON v.MA_DH = dh.MA_DH \
                      WHERE dh.MA_SK = sk.MA_SK) AS VE_DA_BAN
              FROM su_kien sk
                       JOIN dia_diem dd ON sk.MA_DD = dd.MA_DD
                       JOIN danh_muc_su_kien dm ON sk.MA_DMSK = dm.MA_DMSK
              ORDER BY sk.TG_BAT_DAU DESC; \
              """
        cursor.execute(sql)
        data = cursor.fetchall()
        cursor.close()

        return data

    def get_chi_tiet_su_kien(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        query = """
                SELECT sk.*, dm.TEN_DM, dd.TEN_DD, dd.DIA_CHI
                FROM su_kien sk
                         JOIN danh_muc_su_kien dm ON sk.MA_DMSK = dm.MA_DMSK
                         JOIN dia_diem dd ON sk.MA_DD = dd.MA_DD
                WHERE sk.MA_SK = %s \
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
                WHERE sn.MA_SK = %s \
                """
        cursor.execute(query, (ma_sk,))
        result = cursor.fetchall()
        cursor.close()
        return result
