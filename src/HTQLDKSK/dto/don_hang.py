class DonHang:
    def __init__(self, ma_dh, ma_tk, ma_sk, tong_tien_ban_dau, so_tien_duoc_giam, tong_tien_con_lai, tg_tao_dh, trang_thai):
        self._ma_dh = ma_dh
        self._ma_tk = ma_tk
        self._ma_sk = ma_sk
        self._tong_tien_ban_dau = tong_tien_ban_dau
        self._so_tien_duoc_giam = so_tien_duoc_giam
        self._tong_tien_con_lai = tong_tien_con_lai
        self._tg_tao_dh = tg_tao_dh
        self._trang_thai = trang_thai
    
    @property
    def ma_dh(self):
        return self._ma_dh
    
    @ma_dh.setter
    def ma_dh(self, value):
        self._ma_dh = value
    
    @property
    def ma_tk(self):
        return self._ma_tk
    
    @ma_tk.setter
    def ma_tk(self, value):
        self._ma_tk = value
    
    @property
    def ma_sk(self):
        return self._ma_sk
    
    @ma_sk.setter
    def ma_sk(self, value):
        self._ma_sk = value
    
    @property
    def tong_tien_ban_dau(self):
        return self._tong_tien_ban_dau
    
    @tong_tien_ban_dau.setter
    def tong_tien_ban_dau(self, value):
        self._tong_tien_ban_dau = value
    
    @property
    def so_tien_duoc_giam(self):
        return self._so_tien_duoc_giam
    
    @so_tien_duoc_giam.setter
    def so_tien_duoc_giam(self, value):
        self._so_tien_duoc_giam = value
    
    @property
    def tong_tien_con_lai(self):
        return self._tong_tien_con_lai
    
    @tong_tien_con_lai.setter
    def tong_tien_con_lai(self, value):
        self._tong_tien_con_lai = value
    
    @property
    def tg_tao_dh(self):
        return self._tg_tao_dh
    
    @tg_tao_dh.setter
    def tg_tao_dh(self, value):
        self._tg_tao_dh = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value