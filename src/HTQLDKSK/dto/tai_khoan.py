class TaiKhoan:

    def __init__(self, ma_tk, ten_tk, mat_khau, trang_thai):
        self.ma_tk = ma_tk
        self.ten_tk = ten_tk
        self.mat_khau = mat_khau
        self.trang_thai = trang_thai

        def get_ma_tk(self):
            return self.ma_tk

        def get_ten_tk(self):
            return self.ten_tk

        def get_mat_khau(self):
            return self.mat_khau

        def get_trang_thai(self):
            return self.trang_thai

        def set_ma_tk(self, ma_tk):
            self.ma_tk = ma_tk

        def set_ten_tk(self, ten_tk):
            self.ten_tk = ten_tk
        
        def set_mat_khau(self, mat_khau):
            self.mat_khau = mat_khau