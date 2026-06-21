class GiaoDichDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def create_don_hang(self, don_hang_data):
        cursor = self.db.cursor()
        query = """
            INSERT INTO don_hang 
            (MA_TK, MA_GG, MA_SK, TONG_TIEN_BAN_DAU, SO_TIEN_DUOC_GIAM, TONG_TIEN_CON_LAI, TG_TAO_DH, TRANG_THAI)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
        """
        cursor.execute(query, don_hang_data)
        self.db.commit()
        ma_dh = cursor.lastrowid
        cursor.close()
        return ma_dh

    def create_ve(self, ve_data_list):
        cursor = self.db.cursor()
        query = """
            INSERT INTO ve (MA_KV, MA_GHE, MA_DH, QR_CODE, GIA_VE_LUC_MUA)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.executemany(query, ve_data_list)
        self.db.commit()
        cursor.close()