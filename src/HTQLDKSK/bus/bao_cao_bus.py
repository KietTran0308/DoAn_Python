from dao.bao_cao_dao import BaoCaoDAO

class BaoCaoBUS:
    def __init__(self, db_connection):
        self.dao = BaoCaoDAO(db_connection)

    def get_doanh_thu_data(self):
        orders = self.dao.get_all_orders_for_report()
        for o in orders:
            # Format datetime sang chuỗi ISO 8601 để Javascript dễ xử lý
            if o.get('TG_TAO_DH'):
                o['TG_TAO_DH'] = o['TG_TAO_DH'].strftime('%Y-%m-%dT%H:%M:%S')

            # Ép kiểu Decimal sang float
            o['TONG_TIEN_BAN_DAU'] = float(o['TONG_TIEN_BAN_DAU'] or 0)
            o['SO_TIEN_DUOC_GIAM'] = float(o['SO_TIEN_DUOC_GIAM'] or 0)
            o['TONG_TIEN_CON_LAI'] = float(o['TONG_TIEN_CON_LAI'] or 0)

        return orders