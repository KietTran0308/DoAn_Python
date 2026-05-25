import mysql.connector
import json
import time

# Import tất cả các BUS
from BUS.nguoi_dung_bus import NguoiDungBUS
from BUS.su_kien_bus import SuKienBUS
from BUS.dia_diem_bus import DiaDiemBUS
from BUS.giao_dich_bus import GiaoDichBUS
from BUS.van_hanh_bus import VanHanhBUS

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'hethongsukien'
}

def in_tieu_de(text):
    print(f"\n{'='*50}\n▶ {text.upper()}\n{'='*50}")

def main():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ Đã kết nối Database thành công!")

        # Khởi tạo các module nghiệp vụ
        nguoi_dung_bus = NguoiDungBUS(connection)
        su_kien_bus = SuKienBUS(connection)
        dia_diem_bus = DiaDiemBUS(connection)
        giao_dich_bus = GiaoDichBUS(connection)
        van_hanh_bus = VanHanhBUS(connection)

        # ---------------------------------------------------------
        in_tieu_de("1. MÔ PHỎNG ĐĂNG NHẬP")
        ket_qua_login = nguoi_dung_bus.xu_ly_dang_nhap("khachhang1", "123456")
        print(json.dumps(ket_qua_login, indent=4, ensure_ascii=False))
        ma_tk_dang_nhap = ket_qua_login['data']['ma_tk']

        time.sleep(1) # Dừng 1s cho dễ theo dõi
        
        # ---------------------------------------------------------
        in_tieu_de("2. KHÁCH HÀNG XEM CHI TIẾT SỰ KIÊN (MA_SK = 1)")
        su_kien_info = su_kien_bus.lay_thong_tin_su_kien_day_du(1)
        print(f"Sự kiện: {su_kien_info['TEN_SK']} - Địa điểm: {su_kien_info['TEN_DD']}")

        time.sleep(1)
        
        # ---------------------------------------------------------
        in_tieu_de("3. KHÁCH HÀNG LOAD SƠ ĐỒ CHỖ NGỒI")
        so_do = dia_diem_bus.load_so_do_cho_ngoi(1)
        print(f"Đã load {len(so_do)} khu vực.")
        for kv in so_do:
            print(f" - {kv['TEN_KV']} (Giá: {kv['GIA_TIEN']:,.0f}đ): Có {len(kv['danh_sach_ghe'])} ghế")

        time.sleep(1)

        # ---------------------------------------------------------
        in_tieu_de("4. KHÁCH HÀNG TIẾN HÀNH ĐẶT VÉ (Giao Dịch)")
        # Khách chọn 2 ghế đầu tiên của khu vực 1 (VIP)
        ghe_dat = [
            {'ma_kv': 1, 'ma_ghe': 1, 'gia_tien': 2000000},
            {'ma_kv': 1, 'ma_ghe': 2, 'gia_tien': 2000000}
        ]
        print("Đang tạo đơn hàng và sinh mã QR...")
        ma_dh_moi = giao_dich_bus.xu_ly_dat_ve(ma_tk=ma_tk_dang_nhap, ma_sk=1, danh_sach_ghe=ghe_dat)
        print(f"🎉 Đã đặt vé thành công! Mã đơn hàng của bạn là: #{ma_dh_moi}")

        time.sleep(1)

        # ---------------------------------------------------------
        in_tieu_de("5. NHÂN VIÊN SOÁT VÉ (Vận Hành)")
        # Giả lập lấy mã QR của chiếc vé vừa tạo từ Database để test
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT QR_CODE FROM ve WHERE MA_DH = %s LIMIT 1", (ma_dh_moi,))
        ma_qr_thuc_te = cursor.fetchone()['QR_CODE']
        cursor.close()

        print(f"Khách đưa vé có mã QR: {ma_qr_thuc_te}")
        ket_qua_quet = van_hanh_bus.xu_ly_quet_ve(qr_code=ma_qr_thuc_te, ma_tk_nhan_vien=1, ten_cong="Cổng A1")
        print(f"Máy quét báo: {ket_qua_quet['tin_nhắn']}")

    except Exception as e:
        print(f"\n⛔ Lỗi hệ thống: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("\n🔒 Đã đóng kết nối Database.")

if __name__ == "__main__":
    main()