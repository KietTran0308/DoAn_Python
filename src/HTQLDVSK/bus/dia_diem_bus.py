import json
from dao.dia_diem_dao import DiaDiemDAO
from dto.dia_diem import DiaDiem

class DiaDiemBUS:
    def __init__(self, db_connection):
        self.dao = DiaDiemDAO(db_connection)

    # Hàm lấy sơ đồ chỗ ngồi hoàn chỉnh để Frontend render giao diện
    def load_so_do_cho_ngoi(self, ma_sk):
        danh_sach_khu_vuc = self.dao.get_khu_vuc_by_su_kien(ma_sk)
        if not danh_sach_khu_vuc:
            return []

        for khu_vuc in danh_sach_khu_vuc:
            danh_sach_ghe = self.dao.get_ghe_by_khu_vuc(khu_vuc['MA_KV'])
            khu_vuc['danh_sach_ghe'] = danh_sach_ghe

        return danh_sach_khu_vuc

    def getList(self):
        dsDD = self.dao.getList()
        return dsDD

    def add_dia_diem(self, data):
        if not data.get('TEN_DD') or not data.get('DIA_CHI'):
            raise ValueError("Tên và địa chỉ địa điểm không được để trống!")

        # Loại bỏ việc fix cứng số 10
        return self.dao.insert_dia_diem(data)

    def update_dia_diem(self, ma_dd, data):
        if not data.get('TEN_DD') or not data.get('DIA_CHI'):
            raise ValueError("Tên và địa chỉ địa điểm không được để trống!")

        layout_json = data.get('LAYOUT_DATA', None)
        if isinstance(layout_json, (list, dict)):
            layout_json = json.dumps(layout_json)

        updated_dd = DiaDiem(ma_dd, data['TEN_DD'], data['DIA_CHI'],
                             data.get('TONG_SO_COT', 0), data.get('TONG_SO_HANG', 0),
                             layout_json)

        # 1. Cập nhật thông tin trên bảng dia_diem
        self.dao.update(updated_dd)

        # 2. Xử lý bóc tách JSON và lưu vào bảng ghe_vat_ly
        if layout_json and layout_json != '[]':
            try:
                seat_list = json.loads(layout_json)
                self.dao.sync_ghe_vat_ly(ma_dd, seat_list)
            except Exception as e:
                raise ValueError(f"Dữ liệu Layout không hợp lệ: {str(e)}")

        return True

    def delete_dia_diem(self, ma_dd):
        return self.dao.delete_dia_diem(ma_dd)