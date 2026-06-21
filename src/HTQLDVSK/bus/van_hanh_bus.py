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
            "ten_su_kien": ve_info.get('TEN_SK', ''),
            "ten_khach": f"{ve_info.get('HO', '')} {ve_info.get('TEN', '')}".strip(),
            "email": ve_info.get('EMAIL', ''),
            "gia_ve": float(ve_info.get('GIA_VE_LUC_MUA', 0))
        }

    def _format_row(self, r):
        """Chuyển một row DB thành dict chuẩn trả về cho frontend."""
        return {
            "ma_log": r['MA_LOG'],
            "tg_quet": r['TG_QUET'].strftime('%d/%m/%Y %H:%M:%S'),
            "ten_cong": r.get('TEN_CONG') or 'N/A',
            "trang_thai": 1 if r['TRANG_THAI'] == 1 else 0,
            "qr_code": r.get('QR_CODE') or '(Vé giả - không có QR)',
            "ten_khach": f"{r.get('HO') or ''} {r.get('TEN') or ''}".strip() or 'Không xác định',
            "email": r.get('EMAIL') or '',
            "nhan_vien": f"{r.get('HO_NV') or ''} {r.get('TEN_NV') or ''}".strip() or 'N/A',
            "gia_ve": float(r.get('GIA_VE_LUC_MUA') or 0),
            "ten_su_kien": r.get('TEN_SK') or '',
            "ma_sk": r.get('MA_SK')
        }

    def lay_lich_su(self, ma_sk):
        """Lịch sử check-in của một sự kiện cụ thể."""
        rows = self.dao.get_lich_su_by_su_kien(ma_sk)
        return [self._format_row(r) for r in rows]

    def lay_tat_ca_lich_su(self):
        """Toàn bộ lịch sử check-in (Admin xem tổng)."""
        rows = self.dao.get_all_lich_su()
        return [self._format_row(r) for r in rows]