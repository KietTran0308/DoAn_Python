# from  dao.van_hanh_dao import VanHanhDAO

# class VanHanhBUS:
#     def __init__(self, db_connection):
#         self.dao = VanHanhDAO(db_connection)

#     # Hàm xử lý logic khi nhân viên cầm máy quét mã QR của khách
#     def xu_ly_quet_ve(self, qr_code, ma_tk_nhan_vien, ten_cong):
#         # Bước 1: Tra cứu xem mã QR này có tồn tại trong hệ thống không
#         ve_info = self.dao.tim_ve_theo_qr(qr_code)

#         # Nếu vé không tồn tại (QR giả mạo)
#         if not ve_info:
#             # Vẫn ghi log lại để cảnh báo có người dùng vé giả (trạng thái 0 = Thất bại)
#             self.dao.ghi_log_check_in(None, ma_tk_nhan_vien, 0, ten_cong)
#             return {"hợp_lệ": False, "tin_nhắn": "Vé không hợp lệ hoặc QR giả mạo!"}

#         # Lấy mã vé thật từ database
#         ma_ve = ve_info['MA_VE']

#         # Bước 2: Kiểm tra xem vé này đã được sử dụng trước đó chưa
#         # (Chỗ này cần thêm 1 hàm DAO check xem ma_ve này đã có trong bảng check_in_log với trạng thái thành công chưa,
#         # vì lý do ngắn gọn tôi giả sử biến is_used lưu kết quả kiểm tra đó)
#         is_used = False  # Giả lập vé chưa dùng

#         if is_used:
#             # Nếu vé đã quét rồi (người dùng copy vé của nhau) -> Ghi log thất bại
#             self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 0, ten_cong)
#             return {"hợp_lệ": False, "tin_nhắn": "Vé này đã được sử dụng để vào cổng trước đó!"}

#         # Bước 3: Vé hợp lệ và chưa sử dụng -> Ghi log thành công (trạng thái 1)
#         self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 1, ten_cong)

#         return {"hợp_lệ": True, "tin_nhắn": "Check-in thành công. Mời khách vào!"}


from dao.van_hanh_dao import VanHanhDAO


class VanHanhBUS:
    def __init__(self, db_connection):
        self.dao = VanHanhDAO(db_connection)

    def xu_ly_quet_ve(self, qr_code, ma_tk_nhan_vien, ten_cong):
        ve_info = self.dao.tim_ve_theo_qr(qr_code)

        if not ve_info:
            self.dao.ghi_log_check_in(None, ma_tk_nhan_vien, 0, ten_cong)
            return {
                "hop_le": False,
                "tin_nhan": "Vé không hợp lệ hoặc mã QR giả mạo!"
            }

        ma_ve = ve_info['MA_VE']

        if self.dao.kiem_tra_da_su_dung(ma_ve):
            self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 0, ten_cong)
            return {
                "hop_le": False,
                "tin_nhan": "Vé này đã được sử dụng trước đó!"
            }

        self.dao.ghi_log_check_in(ma_ve, ma_tk_nhan_vien, 1, ten_cong)
        return {
            "hop_le": True,
            "tin_nhan": "Check-in thành công. Mời khách vào!",
            "ten_su_kien": ve_info['TEN_SK'],
            "ten_khach": f"{ve_info['HO']} {ve_info['TEN']}",
            "email": ve_info['EMAIL'],
            "gia_ve": float(ve_info['GIA_VE_LUC_MUA'])
        }

    def lay_lich_su(self, ma_sk):
        rows = self.dao.get_lich_su_by_su_kien(ma_sk)
        result = []
        for r in rows:
            result.append({
                "ma_log": r['MA_LOG'],
                "tg_quet": r['TG_QUET'].strftime('%d/%m/%Y %H:%M:%S'),
                "ten_cong": r['TEN_CONG'],
                "trang_thai": "Thành công" if r['TRANG_THAI'] == 1 else "Thất bại",
                "qr_code": r['QR_CODE'],
                "ten_khach": f"{r['HO']} {r['TEN']}",
                "email": r['EMAIL'],
                "nhan_vien": f"{r.get('HO_NV', '')} {r.get('TEN_NV', '')}".strip(),
                "gia_ve": float(r['GIA_VE_LUC_MUA'])
            })
        return result