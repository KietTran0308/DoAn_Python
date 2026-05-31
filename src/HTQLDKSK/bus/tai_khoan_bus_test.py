# # from dao.tai_khoan_dao import TaiKhoanDAO 
# # from dao.nguoi_dung_dao import NguoiDungDAO

# from dto.tai_khoan import TaiKhoan # import class TaiKhoan từ file tai_khoan.py
# from dto.nguoi_dung import NguoiDung

# import hashlib # thư viện mã hóa mật khẩu

# class TaiKhoanBUS:
#     def __init__(self):
#         self.tai_khoan_dao = TaiKhoanDAO()
#         self.nguoi_dung_dao = NguoiDungDAO()

#     def dang_nhap(self, ten_tk, mat_khau):
#         # Kiểm tra dữ liệu rỗng
#         if ten_tk == "" or mat_khau == "":
#             return None
        
#         # Mã hóa mật khẩu
#         mat_khau_ma_hoa = hashlib.sha256(
#             mat_khau.encode()
#         ).hexdigest()

#         # Tìm tài khoản trong database
#         tai_khoan = self.tai_khoan_dao.timBangTenTkHoacMatKhau(ten_tk, mat_khau_ma_hoa)

#         # Kiểm tra tài khoản tồn tại
#         if tai_khoan is not None:
#             if tai_khoan.trang_thai == 1: 
#                 return tai_khoan
            
#         return None
    
#     def dang_ky(self, ten_tk, mat_khau, ho, ten, email, sdt):
#         # Kiểm tra tên tài khoản đã tồn tại chưa
#         tai_khoan = self.tai_khoan_dao.timBangTenTk(ten_tk)

#         if tai_khoan is not None:
#             return False, "Tên tài khoản đã tồn tại"
        
#         # Kiểm tra email đã tồn tại chưa
#         nguoi_dung = self.nguoi_dung_dao.timBangEmail(email)

#         if nguoi_dung is not None:
#             return False, "Email đã được sử dụng"

#         # Mã hóa mật khẩu
#         mat_khau_ma_hoa = hashlib.sha256(
#             mat_khau.encode()
#         ).hexdigest()

#         # Tạo tài khoản mới
#         tai_khoan_moi = TaiKhoan(
#             ten_tk = ten_tk,
#             mat_khau = mat_khau_ma_hoa
#         )

#         # Lưu tài khoản vào database
#         if not self.tai_khoan_dao.them(tai_khoan_moi):
#             return False, "Đăng ký thất bại"

#         # Tạo thông tin người dùng mới
#         nguoi_dung_moi = NguoiDung(
#             ho = ho,
#             ten = ten,
#             email = email,
#             sdt = sdt
#         )

#         # Lưu thông tin người dùng vào database
#         if not self.nguoi_dung_dao.them(nguoi_dung_moi):
#             return False, "Đăng ký thất bại"

#         return True, "Đăng ký thành công"
    
#     def doi_mat_khau(self, ten_tk, mat_khau_cu, mat_khau_moi):
#         # Kiểm tra dữ liệu rỗng
#         if ten_tk == "" or mat_khau_cu == "" or mat_khau_moi == "":
#             return False, "Vui lòng điền đầy đủ thông tin"

#         # Mã hóa mật khẩu cũ
#         mat_khau_cu_ma_hoa = hashlib.sha256(
#             mat_khau_cu.encode()
#         ).hexdigest()

#         # Tìm tài khoản trong database
#         tai_khoan = self.tai_khoan_dao.timBangTenTk(ten_tk)

#         # Kiểm tra tài khoản tồn tại và mật khẩu cũ đúng
#         if tai_khoan is not None and tai_khoan.mat_khau == mat_khau_cu_ma_hoa:
#             # Mã hóa mật khẩu mới
#             mat_khau_moi_ma_hoa = hashlib.sha256(
#                 mat_khau_moi.encode()
#             ).hexdigest()

#             # Cập nhật mật khẩu mới cho tài khoản
#             tai_khoan.mat_khau = mat_khau_moi_ma_hoa

#             if self.tai_khoan_dao.cap_nhat(tai_khoan):
#                 return True, "Đổi mật khẩu thành công"
        
#         return False, "Đổi mật khẩu thất bại"