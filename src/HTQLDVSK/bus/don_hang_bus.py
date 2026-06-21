from dao.don_hang_dao import DonHangDAO

class DonHangBUS:
    def __init__(self, db_connection):
        self.dao = DonHangDAO(db_connection)

    def lay_danh_sach_don_hang(self):
        data = self.dao.lay_tat_ca_don_hang()

        for dh in data:
            # Chuyển đổi đối tượng datetime thành chuỗi chuẩn ISO 8601 để JS dễ dàng đọc được
            if 'TG_TAO_DH' in dh and dh['TG_TAO_DH']:
                dh['TG_TAO_DH'] = dh['TG_TAO_DH'].strftime('%Y-%m-%dT%H:%M:%S')

            # Chuyển đổi kiểu Decimal của SQL sang dạng float cho JSON
            dh['TONG_TIEN_BAN_DAU'] = float(dh['TONG_TIEN_BAN_DAU']) if dh['TONG_TIEN_BAN_DAU'] else 0.0
            dh['SO_TIEN_DUOC_GIAM'] = float(dh['SO_TIEN_DUOC_GIAM']) if dh['SO_TIEN_DUOC_GIAM'] else 0.0
            dh['TONG_TIEN_CON_LAI'] = float(dh['TONG_TIEN_CON_LAI']) if dh['TONG_TIEN_CON_LAI'] else 0.0

        return data

    def lay_danh_sach_khuyen_mai(self):
        data = self.dao.lay_tat_ca_giam_gia()

        for km in data:
            # 1. Ép kiểu Datetime thành chuỗi ISO 8601 để phù hợp thẻ <input type="datetime-local">
            if 'TG_BAT_DAU' in km and km['TG_BAT_DAU']:
                km['TG_BAT_DAU'] = km['TG_BAT_DAU'].strftime('%Y-%m-%dT%H:%M:%S')
            if 'TG_KET_THUC' in km and km['TG_KET_THUC']:
                km['TG_KET_THUC'] = km['TG_KET_THUC'].strftime('%Y-%m-%dT%H:%M:%S')

            # 2. Ép kiểu Decimal sang Float để tránh lỗi khi chuyển thành JSON
            km['GIA_TRI_GIAM'] = float(km['GIA_TRI_GIAM']) if km['GIA_TRI_GIAM'] else 0.0
            km['DIEU_KIEN'] = float(km['DIEU_KIEN']) if km['DIEU_KIEN'] else 0.0
            km['GIAM_TOI_DA'] = float(km['GIAM_TOI_DA']) if km['GIAM_TOI_DA'] else 0.0

        return data