from dto.dia_diem import DiaDiem
import json
import datetime


class DiaDiemDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_khu_vuc_by_su_kien(self, ma_sk):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT kv.*, hg.GIA_TIEN
            FROM khu_vuc kv
            JOIN hang_ghe hg ON kv.MA_HG = hg.MA_HG
            WHERE kv.MA_SK = %s
        """
        cursor.execute(query, (ma_sk,))
        result = cursor.fetchall()
        cursor.close()
        return result

    def get_ghe_by_khu_vuc(self, ma_kv):
        cursor = self.db.cursor(dictionary=True)
        query = "SELECT MA_GHE, DAY_GHE, SO_GHE, TRANG_THAI, CSS_CLASS FROM ghe WHERE MA_KV = %s"
        cursor.execute(query, (ma_kv,))
        result = cursor.fetchall()
        cursor.close()
        return result

    def getList(self):
        cursor = self.db.cursor(dictionary=True)
        sql = "SELECT * FROM dia_diem WHERE TRANG_THAI != -1 ORDER BY MA_DD DESC"
        cursor.execute(sql)
        data = cursor.fetchall()
        cursor.close()
        return data

    def update(self, obj):
        cursor = self.db.cursor()
        sql = """
            UPDATE dia_diem 
            SET TEN_DD = %s, DIA_CHI = %s, TONG_SO_COT = %s, TONG_SO_HANG = %s, LAYOUT_DATA = %s 
            WHERE MA_DD = %s
        """
        val = (obj.ten_dd, obj.dia_chi, obj.tong_so_cot, obj.tong_so_hang, obj.layout_data, obj.ma_dd)
        try:
            cursor.execute(sql, val)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def sync_ghe_vat_ly(self, ma_dd, seat_list):
        cursor = self.db.cursor()
        try:
            # Xóa các ghế cũ (chỉ khi chúng không dính líu đến sự kiện nào)
            cursor.execute("SELECT MA_GHE FROM ghe_vat_ly WHERE MA_DD = %s", (ma_dd,))
            old_seats = [row[0] for row in cursor.fetchall()]

            new_seat_map = {}
            for s in seat_list:
                day_ghe = ''.join(filter(str.isalpha, s['label'])) or 'A'
                so_ghe = ''.join(filter(str.isdigit, s['label'])) or '1'
                new_seat_map[f"{day_ghe}_{so_ghe}"] = s

            cursor.execute("SELECT MA_GHE, DAY_GHE, SO_GHE FROM ghe_vat_ly WHERE MA_DD = %s", (ma_dd,))
            existing_seats = cursor.fetchall()

            existing_map = {f"{r[1]}_{r[2]}": r[0] for r in existing_seats}
            to_insert = []
            to_update = []
            to_delete_ids = []

            for key, s in new_seat_map.items():
                if key in existing_map:
                    to_update.append((s['x'], s['y'], existing_map[key]))
                else:
                    day_ghe = ''.join(filter(str.isalpha, s['label'])) or 'A'
                    so_ghe = ''.join(filter(str.isdigit, s['label'])) or '1'
                    to_insert.append((ma_dd, day_ghe, int(so_ghe), s.get('LOAI_GHE', 'NORMAL'), s['x'], s['y']))

            for old_key, old_id in existing_map.items():
                if old_key not in new_seat_map:
                    to_delete_ids.append(old_id)

            # Insert ghế mới
            if to_insert:
                next_id = self._get_next_id(cursor, 'ghe_vat_ly', 'MA_GHE')
                for item in to_insert:
                    cursor.execute("""
                        INSERT INTO ghe_vat_ly (MA_GHE, MA_DD, DAY_GHE, SO_GHE, LOAI_GHE, TOA_DO_X, TOA_DO_Y) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (next_id,) + item[1:])
                    next_id += 1

            # Update tọa độ ghế cũ
            if to_update:
                cursor.executemany("""
                    UPDATE ghe_vat_ly 
                    SET TOA_DO_X = %s, TOA_DO_Y = %s 
                    WHERE MA_GHE = %s
                """, to_update)

            # Xóa ghế bị loại bỏ khỏi giao diện
            if to_delete_ids:
                format_strings = ','.join(['%s'] * len(to_delete_ids))
                cursor.execute(f"SELECT DISTINCT MA_GHE_VL FROM ghe_su_kien WHERE MA_GHE_VL IN ({format_strings})",
                               tuple(to_delete_ids))
                used_seats = cursor.fetchall()

                if used_seats:
                    self.db.rollback()
                    raise ValueError(
                        "Không thể lưu! Bạn vừa xóa một số ghế đang được sử dụng cho sự kiện. Vui lòng hoàn tác, bạn chỉ được phép dời vị trí hoặc thêm ghế mới.")

                cursor.execute(f"DELETE FROM ghe_vat_ly WHERE MA_GHE IN ({format_strings})", tuple(to_delete_ids))

            self.db.commit()
        except ValueError as ve:
            self.db.rollback()
            raise ve
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Lỗi hệ thống khi đồng bộ ghế: {str(e)}")
        finally:
            cursor.close()

    def generate_ma_dd(self, cursor):
        current_year = datetime.datetime.now().strftime("%y")
        prefix = int(f"2{current_year}00000")

        cursor.execute("SELECT MAX(MA_DD) as max_id FROM dia_diem WHERE MA_DD > %s AND MA_DD < %s",
                       (prefix, prefix + 100000))
        result = cursor.fetchone()

        if result and result['max_id']:
            return result['max_id'] + 1
        else:
            return prefix + 1

    def _get_next_id(self, cursor, table_name, id_column):
        cursor.execute(f"SELECT MAX({id_column}) as max_id FROM {table_name}")
        row = cursor.fetchone()
        return 1 if row['max_id'] is None else row['max_id'] + 1

    # ========================================================
    # HÀM LƯU ĐỊA ĐIỂM (INSERT)
    # ========================================================
    def insert_dia_diem(self, data):
        cursor = self.db.cursor(dictionary=True)
        try:
            new_ma_dd = self.generate_ma_dd(cursor)

            loai_dd = data.get('LOAI_DD', 'FIXED_SEAT')
            suc_chua = data.get('SUC_CHUA_TONG', 0)
            layout_data = data.get('LAYOUT_DATA', [])

            if isinstance(layout_data, (list, dict)):
                layout_data = json.dumps(layout_data)

            sql = """
                INSERT INTO dia_diem (MA_DD, TEN_DD, DIA_CHI, LOAI_DD, TONG_SO_COT, TONG_SO_HANG, LAYOUT_DATA, SUC_CHUA_TONG, TRANG_THAI)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1)
            """
            cursor.execute(sql, (
                new_ma_dd,
                data['TEN_DD'],
                data['DIA_CHI'],
                loai_dd,
                data.get('TONG_SO_COT', 0),
                data.get('TONG_SO_HANG', 0),
                layout_data,
                suc_chua
            ))

            # CHỈ XỬ LÝ GHẾ NẾU LÀ LOẠI FIXED_SEAT
            if loai_dd == 'FIXED_SEAT' and layout_data and layout_data != '[]':
                seats = json.loads(layout_data)
                next_ma_ghe = self._get_next_id(cursor, 'ghe_vat_ly', 'MA_GHE')

                for seat in seats:
                    label = seat.get('label', '')
                    day_ghe = ''.join(filter(str.isalpha, label)) or 'A'
                    so_ghe = ''.join(filter(str.isdigit, label)) or '1'

                    cursor.execute("""
                        INSERT INTO ghe_vat_ly (MA_GHE, MA_DD, DAY_GHE, SO_GHE, LOAI_GHE, TOA_DO_X, TOA_DO_Y) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        next_ma_ghe,
                        new_ma_dd,
                        day_ghe,
                        int(so_ghe),
                        seat.get('LOAI_GHE', 'NORMAL'),
                        seat.get('x', 0),
                        seat.get('y', 0)
                    ))
                    next_ma_ghe += 1

            self.db.commit()
            return new_ma_dd
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def delete_dia_diem(self, ma_dd):
        cursor = self.db.cursor(dictionary=True)
        try:
            cursor.execute("SELECT COUNT(*) as dem FROM su_kien WHERE MA_DD = %s", (ma_dd,))
            su_kien_count = cursor.fetchone()['dem']

            if su_kien_count > 0:
                cursor.execute("UPDATE dia_diem SET TRANG_THAI = -1 WHERE MA_DD = %s", (ma_dd,))
                msg = f"Đã ẩn địa điểm (đang chứa {su_kien_count} sự kiện)."
                del_type = "SOFT"
            else:
                cursor.execute("DELETE FROM ghe_vat_ly WHERE MA_DD = %s", (ma_dd,))
                cursor.execute("DELETE FROM dia_diem WHERE MA_DD = %s", (ma_dd,))
                msg = "Đã xóa vĩnh viễn địa điểm trống này."
                del_type = "HARD"

            self.db.commit()
            return {"success": True, "message": msg, "type": del_type}
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()