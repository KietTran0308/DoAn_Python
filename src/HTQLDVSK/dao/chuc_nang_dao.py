from db_connection import DatabaseConnection

class ChucNangDAO:
    @staticmethod
    def get_all():
        conn = DatabaseConnection.get_connection()

        if not conn:
            return []

        try:
            cursor = conn.cursor(dictionary=True)
            sql = "SELECT MA_CN, TEN_CN, MA_CN_CHA FROM chuc_nang ORDER BY MA_CN ASC"
            cursor.execute(sql)
            data = cursor.fetchall()

            return data

        except Exception as err:
            print(f"Lỗi truy vấn CSDL bảng chuc_nang: {err}")
            return []

        finally:
        
            if 'cursor' in locals() and cursor is not None:
                cursor.close()
            if conn.is_connected():
                conn.close()