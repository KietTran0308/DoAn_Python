from dao.don_hang_dao import DonHangDAO


class DonHangBUS:
    def __init__(self, db_connection):
        self.dao = DonHangDAO(db_connection)

    def lay_danh_sach_don_hang(self):
        data = self.dao.lay_tat_ca_don_hang()
        for dh in data:
            if dh.get('TG_TAO_DH'):
                dh['TG_TAO_DH'] = dh['TG_TAO_DH'].strftime('%Y-%m-%dT%H:%M:%S')
            dh['TONG_TIEN_BAN_DAU'] = float(dh['TONG_TIEN_BAN_DAU'] or 0)
            dh['SO_TIEN_DUOC_GIAM']  = float(dh['SO_TIEN_DUOC_GIAM']  or 0)
            dh['TONG_TIEN_CON_LAI']  = float(dh['TONG_TIEN_CON_LAI']  or 0)
        return data

    def lay_chi_tiet_don_hang(self, ma_dh):
        """
        Nhóm các vé theo tên hàng ghế, trả về list:
        [{ ten_ve, so_luong, don_gia }]
        """
        rows = self.dao.lay_chi_tiet_don_hang(ma_dh)
        nhom = {}
        for r in rows:
            ten_ve = r.get('TEN_HG') or r.get('TEN_KV') or 'Vé thường'
            gia    = float(r['GIA_VE_LUC_MUA'] or 0)
            if ten_ve not in nhom:
                nhom[ten_ve] = {'ten_ve': ten_ve, 'so_luong': 0, 'don_gia': gia}
            nhom[ten_ve]['so_luong'] += 1
        return list(nhom.values())

    def cap_nhat_trang_thai(self, ma_dh, trang_thai_moi):
        # Chỉ cho phép chuyển sang trạng thái hợp lệ
        TRANG_THAI_HOP_LE = {0, 1, 2, 3}
        if trang_thai_moi not in TRANG_THAI_HOP_LE:
            raise ValueError(f'Trạng thái {trang_thai_moi} không hợp lệ.')
        ok = self.dao.cap_nhat_trang_thai(ma_dh, trang_thai_moi)
        if not ok:
            raise ValueError(f'Không tìm thấy đơn hàng #{ma_dh}.')

    def lay_danh_sach_khuyen_mai(self):
        data = self.dao.lay_tat_ca_giam_gia()
        for km in data:
            if km.get('TG_BAT_DAU'):
                km['TG_BAT_DAU']  = km['TG_BAT_DAU'].strftime('%Y-%m-%dT%H:%M:%S')
            if km.get('TG_KET_THUC'):
                km['TG_KET_THUC'] = km['TG_KET_THUC'].strftime('%Y-%m-%dT%H:%M:%S')
            km['GIA_TRI_GIAM'] = float(km['GIA_TRI_GIAM'] or 0)
            km['DIEU_KIEN']    = float(km['DIEU_KIEN']    or 0)
            km['GIAM_TOI_DA']  = float(km['GIAM_TOI_DA']  or 0)
        return data