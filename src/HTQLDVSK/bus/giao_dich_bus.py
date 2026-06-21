import uuid
from dao.giao_dich_dao import GiaoDichDAO

class GiaoDichBUS:
    def __init__(self, db_connection):
        self.dao = GiaoDichDAO(db_connection)

    def xu_ly_dat_ve(self, ma_tk, ma_sk, danh_sach_ghe, ma_gg_id=None, tien_giam=0):
        tong_tien = sum(ghe['gia_tien'] for ghe in danh_sach_ghe)
        tien_con_lai = tong_tien - tien_giam

        don_hang_data = (ma_tk, ma_gg_id, ma_sk, tong_tien, tien_giam, tien_con_lai, 0)
        ma_dh = self.dao.create_don_hang(don_hang_data)

        if not ma_dh:
            return False

        ve_data_list = []
        for ghe in danh_sach_ghe:
            qr_code = str(uuid.uuid4())
            ve_data_list.append((ghe['ma_kv'], ghe['ma_ghe'], ma_dh, qr_code, ghe['gia_tien']))

        self.dao.create_ve(ve_data_list)

        return ma_dh