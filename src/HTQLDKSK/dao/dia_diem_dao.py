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
        query = ("SELECT MA_DD, TEN_DD, DIA_CHI, TONG_SO_COT, TONG_SO_HANG, LAYOUT_DATA FROM dia_diem")
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

    def sync_ghe_vat_ly(self, ma_dd, seat_list):
        # Lưu ý: Bật dictionary=True để lấy dữ liệu dạng key-value
        cursor = self.db.cursor(dictionary=True)
        try:
            # 1. Lấy danh sách ghế hiện tại của địa điểm này trong CSDL
            cursor.execute("SELECT MA_GHE, DAY_GHE, SO_GHE FROM ghe_vat_ly WHERE MA_DD = %s", (ma_dd,))
            existing_seats = cursor.fetchall()

            # Tạo một cuốn từ điển (Dictionary) để tra cứu nhanh: (DAY_GHE, SO_GHE) -> MA_GHE
            existing_dict = {(str(row['DAY_GHE']), int(row['SO_GHE'])): row['MA_GHE'] for row in existing_seats}

            to_update = []
            to_insert = []
            processed_keys = set()

            # 2. Phân loại thao tác từ danh sách ghế giao diện gửi xuống
            for seat in seat_list:
                day_ghe = str(seat.get('DAY_GHE'))
                so_ghe = int(seat.get('SO_GHE'))
                x = seat.get('x')
                y = seat.get('y')
                key = (day_ghe, so_ghe)

                processed_keys.add(key)

                if key in existing_dict:
                    # Nếu Dãy và Số ghế đã tồn tại -> Lưu vào danh sách cần UPDATE tọa độ
                    ma_ghe = existing_dict[key]
                    to_update.append((x, y, ma_ghe))
                else:
                    # Nếu chưa tồn tại -> Lưu vào danh sách cần INSERT mới
                    to_insert.append((ma_dd, day_ghe, so_ghe, x, y))

            # 3. Tìm các ghế có trong DB nhưng bị Admin xóa khỏi Canvas
            to_delete_ids = [existing_dict[key] for key in existing_dict if key not in processed_keys]

            # 4. THỰC THI SQL HÀNG LOẠT (BULK EXECUTION)
            if to_insert:
                cursor.executemany("""
                    INSERT INTO ghe_vat_ly (MA_DD, DAY_GHE, SO_GHE, TOA_DO_X, TOA_DO_Y) 
                    VALUES (%s, %s, %s, %s, %s)
                """, to_insert)

            if to_update:
                cursor.executemany("""
                    UPDATE ghe_vat_ly 
                    SET TOA_DO_X = %s, TOA_DO_Y = %s 
                    WHERE MA_GHE = %s
                """, to_update)

            # 5. Xử lý an toàn khi XÓA
            if to_delete_ids:
                format_strings = ','.join(['%s'] * len(to_delete_ids))

                # Kiểm tra xem những ghế định xóa có đang được map vào bảng ghe_su_kien hay không
                cursor.execute(f"SELECT DISTINCT MA_GHE_VL FROM ghe_su_kien WHERE MA_GHE_VL IN ({format_strings})",
                               tuple(to_delete_ids))
                used_seats = cursor.fetchall()

                if used_seats:
                    self.db.rollback()
                    # Bắn lỗi thân thiện lên Frontend
                    raise ValueError(
                        "Không thể lưu! Bạn vừa xóa một số ghế đang được sử dụng cho sự kiện. Vui lòng hoàn tác, bạn chỉ được phép dời vị trí hoặc thêm ghế mới.")

                # Nếu không có ghế nào bị dính sự kiện -> An tâm xóa
                cursor.execute(f"DELETE FROM ghe_vat_ly WHERE MA_GHE IN ({format_strings})", tuple(to_delete_ids))

            self.db.commit()
        except ValueError as ve:
            # Bắt lỗi logic nghiệp vụ
            self.db.rollback()
            raise ve
        except Exception as e:
            # Bắt các lỗi SQL khác
            self.db.rollback()
            raise Exception(f"Lỗi hệ thống khi đồng bộ ghế: {str(e)}")
        finally:
            cursor.close()