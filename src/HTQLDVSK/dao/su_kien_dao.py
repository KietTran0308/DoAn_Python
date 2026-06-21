class SuKienDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def lay_tat_ca_su_kien(self):
        cursor = self.db.cursor(dictionary=True)
        sql = """
              SELECT sk.MA_SK, sk.TEN_SK, sk.IMAGE_URL, sk.MA_DMSK, dm.TEN_DM, 
                     sk.TG_BAT_DAU, dd.TEN_DD, sk.TRANG_THAI, 
                     (SELECT COUNT(*) FROM ve v JOIN don_hang dh ON v.MA_DH = dh.MA_DH 
                      WHERE dh.MA_SK = sk.MA_SK) AS VE_DA_BAN
              FROM su_kien sk
              JOIN dia_diem dd ON sk.MA_DD = dd.MA_DD
              JOIN danh_muc_su_kien dm ON sk.MA_DMSK = dm.MA_DMSK
              WHERE sk.TRANG_THAI != -1 
              ORDER BY sk.TG_BAT_DAU DESC; 
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
            # 1. Lấy danh sách Hạng Ghế
            cursor.execute("SELECT MA_HG as id, TEN_HG, GIA_TIEN, TRANG_THAI, CSS_CLASS as COLOR FROM hang_ghe WHERE MA_SK = %s", (ma_sk,))
            hang_ghe_list = cursor.fetchall()

            hg_dict = {}
            for hg in hang_ghe_list:
                hg['GIA_TIEN'] = float(hg['GIA_TIEN'])
                hg_dict[hg['id']] = hg

            # 2. Lấy danh sách Khu Vực
            cursor.execute("SELECT MA_KV as id, MA_HG, TEN_KV, LOAI_KV, SUC_CHUA FROM khu_vuc WHERE MA_SK = %s", (ma_sk,))
            khu_vuc_list = cursor.fetchall()

            for kv in khu_vuc_list:
                kv['HANG_GHE'] = hg_dict.get(kv['MA_HG'], None)

                # Truy vấn lấy các Ghế thuộc khu vực này
                cursor.execute("""
                    SELECT gsk.MA_GHE_SK, gvl.DAY_GHE, gvl.SO_GHE, gvl.TOA_DO_X as x, gvl.TOA_DO_Y as y 
                    FROM ghe_su_kien gsk
                    JOIN ghe_vat_ly gvl ON gsk.MA_GHE_VL = gvl.MA_GHE
                    WHERE gsk.MA_KV = %s
                """, (kv['id'],))
                ghe_list = cursor.fetchall()

                for g in ghe_list:
                    g['TEN_GHE'] = f"{g['DAY_GHE']}{g['SO_GHE']}"

                kv['GHE_LIST'] = ghe_list

            return {
                "hang_ghe": hang_ghe_list,
                "khu_vuc": khu_vuc_list
            }
        finally:
            cursor.close()

    def xoa_mem_su_kien(self, ma_sk):
        cursor = self.db.cursor()
        try:
            sql = "UPDATE su_kien SET TRANG_THAI = -1 WHERE MA_SK = %s"
            cursor.execute(sql, (ma_sk,))
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def _get_next_id(self, cursor, table_name, id_column):
        cursor.execute(f"SELECT MAX({id_column}) FROM {table_name}")
        max_id = cursor.fetchone()[0]
        return 1 if max_id is None else max_id + 1

    def luu_cau_hinh_so_do(self, ma_sk, payload):
        cursor = self.db.cursor()
        try:
            hang_ghe_list = payload.get('hang_ghe', [])
            khu_vuc_list = payload.get('khu_vuc', [])
            ghe_list = payload.get('ghe_su_kien', [])

            # 1. Kiểm tra xem sự kiện đã có vé bán chưa
            cursor.execute("SELECT COUNT(*) FROM ve v JOIN don_hang dh ON v.MA_DH = dh.MA_DH WHERE dh.MA_SK = %s",
                           (ma_sk,))
            if cursor.fetchone()[0] > 0:
                raise ValueError("Sự kiện đã có vé bán, không thể thay đổi sơ đồ!")

            # 2. Xóa dữ liệu cũ an toàn (thứ tự ngược với khóa ngoại)
            cursor.execute("DELETE FROM ghe_su_kien WHERE MA_SK = %s", (ma_sk,))
            cursor.execute("DELETE FROM khu_vuc WHERE MA_SK = %s", (ma_sk,))
            cursor.execute("DELETE FROM hang_ghe WHERE MA_SK = %s", (ma_sk,))

            # 3. INSERT HẠNG GHẾ
            ma_hg_map = {}
            next_hg_id = self._get_next_id(cursor, 'hang_ghe', 'MA_HG')
            for hg in hang_ghe_list:
                old_id = str(hg.get('id', hg.get('MA_HG', '')))
                cursor.execute("""
                    INSERT INTO hang_ghe (MA_HG, MA_SK, TEN_HG, GIA_TIEN, TRANG_THAI) 
                    VALUES (%s, %s, %s, %s, 1)
                """, (next_hg_id, ma_sk, hg['TEN_HG'], hg['GIA_TIEN']))
                ma_hg_map[old_id] = next_hg_id
                next_hg_id += 1

            # 4. INSERT KHU VỰC
            ma_kv_map = {}
            next_kv_id = self._get_next_id(cursor, 'khu_vuc', 'MA_KV')
            for kv in khu_vuc_list:
                old_kv_id = str(kv.get('id', ''))
                ma_hg_thuc = ma_hg_map.get(str(kv.get('MA_HG', '')))

                if ma_hg_thuc:
                    cursor.execute("""
                        INSERT INTO khu_vuc (MA_KV, MA_SK, MA_HG, TEN_KV, LOAI_KV, SUC_CHUA, MAU_HIEN_THI) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (next_kv_id, ma_sk, ma_hg_thuc, kv['TEN_KV'], kv['LOAI_KV'], kv['SUC_CHUA'],
                          kv.get('COLOR', '#000000')))
                    ma_kv_map[old_kv_id] = next_kv_id
                    next_kv_id += 1

            # 5. INSERT GHẾ
            next_ghesk_id = self._get_next_id(cursor, 'ghe_su_kien', 'MA_GHE_SK')
            for ghe in ghe_list:
                kv_id_map = ma_kv_map.get(str(ghe.get('MA_KV', '')))
                if kv_id_map:
                    cursor.execute("""
                        INSERT INTO ghe_su_kien (MA_GHE_SK, MA_SK, MA_GHE_VL, MA_KV, TRANG_THAI) 
                        VALUES (%s, %s, %s, %s, 0)
                    """, (next_ghesk_id, ma_sk, ghe['MA_GHE_VL'], kv_id_map))
                    next_ghesk_id += 1

            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Lỗi database: {str(e)}")
        finally:
            cursor.close()

    def generate_ma_sk(self, cursor):
        import datetime
        current_year = datetime.datetime.now().strftime("%y")
        # Sinh mã bắt đầu bằng số 1, tiếp theo là 2 số năm (VD: 12600000)
        prefix = int(f"1{current_year}00000")

        cursor.execute("SELECT MAX(MA_SK) as max_id FROM su_kien WHERE MA_SK > %s AND MA_SK < %s",
                       (prefix, prefix + 100000))
        result = cursor.fetchone()

        if result and result['max_id']:
            return result['max_id'] + 1
        return prefix + 1

    def tao_su_kien_moi(self, payload):
        cursor = self.db.cursor(dictionary=True)
        try:
            # 1. Tự động cấp mã sự kiện
            ma_sk = self.generate_ma_sk(cursor)

            tg_kt = payload.get('TG_KET_THUC')
            if not tg_kt: tg_kt = None

            # 2. Insert vào bảng sự kiện
            cursor.execute("""
                INSERT INTO su_kien (MA_SK, MA_DMSK, MA_DD, TEN_SK, MO_TA, IMAGE_URL, TG_BAT_DAU, TG_KET_THUC, TRANG_THAI)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                ma_sk,
                payload['MA_DMSK'],
                payload['MA_DD'],
                payload['TEN_SK'],
                payload.get('MO_TA'),
                payload.get('IMAGE_URL'),
                payload['TG_BAT_DAU'],
                tg_kt,
                payload.get('TRANG_THAI', 1)
            ))

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            cursor.close()
            raise Exception(f"Lỗi thêm sự kiện: {str(e)}")
        finally:
            cursor.close()

        # 3. Sau khi tạo sự kiện xong, TÁI SỬ DỤNG hàm lưu ghế để lưu Hạng Vé & Khu Vực
        self.luu_cau_hinh_so_do(ma_sk, payload)

        return ma_sk

    def _get_next_id(self, cursor, table_name, id_column):
        cursor.execute(f"SELECT MAX({id_column}) FROM {table_name}")
        max_id = cursor.fetchone()[0]
        return 1 if max_id is None else max_id + 1