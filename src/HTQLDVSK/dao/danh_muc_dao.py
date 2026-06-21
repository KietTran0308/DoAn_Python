from dto.danh_muc_su_kien import DanhMucSuKien

class DanhMucDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        # Kết hợp JOIN để đếm số lượng sự kiện thuộc mỗi danh mục
        query = """
            SELECT dm.MA_DMSK, dm.TEN_DM, dm.IMAGE_URL, COUNT(sk.MA_SK) as SO_LUONG_SK
            FROM danh_muc_su_kien dm
            LEFT JOIN su_kien sk ON dm.MA_DMSK = sk.MA_DMSK
            GROUP BY dm.MA_DMSK
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()

        # Trả về danh sách object DTO
        return [DanhMucSuKien(r['MA_DMSK'], r['TEN_DM'], r['IMAGE_URL'], r['SO_LUONG_SK']) for r in rows]

    def insert(self, dm: DanhMucSuKien):
        cursor = self.db.cursor()
        query = "INSERT INTO danh_muc_su_kien (TEN_DM, IMAGE_URL) VALUES (%s, %s)"
        cursor.execute(query, (dm.ten_dm, dm.image_url))
        self.db.commit()
        cursor.close()
        return True

    def update(self, dm: DanhMucSuKien):
        cursor = self.db.cursor()
        query = "UPDATE danh_muc_su_kien SET TEN_DM = %s, IMAGE_URL = %s WHERE MA_DMSK = %s"
        cursor.execute(query, (dm.ten_dm, dm.image_url, dm.ma_dmsk))
        self.db.commit()
        cursor.close()
        return True

    def delete(self, ma_dmsk):
        cursor = self.db.cursor()
        try:
            # Kiểm tra xem danh mục có đang chứa sự kiện nào không
            cursor.execute("SELECT COUNT(*) FROM su_kien WHERE MA_DMSK = %s", (ma_dmsk,))
            if cursor.fetchone()[0] > 0:
                raise ValueError("Không thể xóa: Danh mục này đang chứa sự kiện!")

            query = "DELETE FROM danh_muc_su_kien WHERE MA_DMSK = %s"
            cursor.execute(query, (ma_dmsk,))
            self.db.commit()
            return True
        except mysql.connector.Error as err:
            self.db.rollback()
            raise Exception(f"Lỗi cơ sở dữ liệu: {err}")
        finally:
            cursor.close()