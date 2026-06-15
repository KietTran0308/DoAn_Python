class SuKienDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_su_kien(self):
        cursor = self.db.cursor(dictionary=True)
        # Bổ sung sk.MA_DMSK vào câu SELECT
        sql = """
              SELECT sk.MA_SK, \
                     sk.TEN_SK, \
                     sk.IMAGE_URL, \
                     sk.MA_DMSK, \
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

    def lay_tat_ca_danh_muc(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            sql = "SELECT MA_DMSK, TEN_DM, IMAGE_URL FROM danh_muc_su_kien"
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()

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

    def get_seat_map_data(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        try:
            # 1. Lấy danh sách Hạng Ghế của Sự kiện này
            cursor.execute("SELECT MA_HG as id, TEN_HG, GIA_TIEN FROM hang_ghe WHERE MA_SK = %s", (ma_sk,))
            hang_ghe_list = cursor.fetchall()

            # Ép kiểu Decimal sang float để jsonify không bị lỗi
            hg_dict = {}
            for hg in hang_ghe_list:
                hg['GIA_TIEN'] = float(hg['GIA_TIEN'])
                hg_dict[hg['id']] = hg

            # 2. Lấy danh sách Khu Vực
            cursor.execute("SELECT MA_KV as id, MA_HG, TEN_KV, LOAI_KV, SUC_CHUA FROM khu_vuc WHERE MA_SK = %s",
                           (ma_sk,))
            khu_vuc_list = cursor.fetchall()

            # 3. Lồng ghép dữ liệu Hạng Ghế và Danh sách Ghế vào từng Khu Vực
            for kv in khu_vuc_list:
                # Gắn thông tin hạng ghế tương ứng
                kv['HANG_GHE'] = hg_dict.get(kv['MA_HG'], None)

                # Truy vấn lấy các Ghế thuộc khu vực này
                cursor.execute("SELECT MA_GHE, DAY_GHE, SO_GHE, TOA_DO_X as x, TOA_DO_Y as y FROM ghe WHERE MA_KV = %s",
                               (kv['id'],))
                ghe_list = cursor.fetchall()

                # Tạo TEN_GHE (VD: A1 hoặc FZONE-1) cho Frontend hiển thị
                for g in ghe_list:
                    if kv['LOAI_KV'] == 'STANDING':
                        g['TEN_GHE'] = f"{g['DAY_GHE']}-{g['SO_GHE']}"
                    else:
                        g['TEN_GHE'] = f"{g['DAY_GHE']}{g['SO_GHE']}"

                kv['GHE_LIST'] = ghe_list

            return {
                "hang_ghe": hang_ghe_list,
                "khu_vuc": khu_vuc_list
            }
        finally:
            cursor.close()
