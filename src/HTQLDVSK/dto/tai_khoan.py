class TaiKhoan:
    def __init__(self, ma_tk, ten_tk, mat_khau, trang_thai):
        self._ma_tk = ma_tk
        self._ten_tk = ten_tk
        self._mat_khau = mat_khau
        self._trang_thai = trang_thai
    
    @property
    def ma_tk(self):
        return self._ma_tk
    
    @ma_tk.setter
    def ma_tk(self, value):
        self._ma_tk = value
    
    @property
    def ten_tk(self):
        return self._ten_tk
    
    @ten_tk.setter
    def ten_tk(self, value):
        self._ten_tk = value
    
    @property
    def mat_khau(self):
        return self._mat_khau
    
    @mat_khau.setter
    def mat_khau(self, value):
        self._mat_khau = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value