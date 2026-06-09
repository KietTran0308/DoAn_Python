import mysql.connector
from mysql.connector import Error

class DatabaseConnection:
    HOST = "localhost"
    PORT = 3306
    DATABASE = "hethongsukien"
    USER = "root"
    PASSWORD = ""

    @staticmethod
    def get_connection():
        try:
            # Thực hiện kết nối
            conn = mysql.connector.connect(
                host=DatabaseConnection.HOST,
                port=DatabaseConnection.PORT,
                database=DatabaseConnection.DATABASE,
                user=DatabaseConnection.USER,
                password=DatabaseConnection.PASSWORD
            )

            if conn.is_connected():
                print("Ket noi thanh cong")
                return conn

        except Error as e:
            print("Ket noi that bai")
            print(f"Error: {e}")
            return None