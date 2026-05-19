class ThanhToan:
    def __init__(self, ma_tt, ma_dh, ma_pttt, ma_tt_tra_ve, tong_tien, thoi_gian, trang_thai):
        self._ma_tt = ma_tt
        self._ma_dh = ma_dh
        self._ma_pttt = ma_pttt
        self._ma_tt_tra_ve = ma_tt_tra_ve
        self._tong_tien = tong_tien
        self._thoi_gian = thoi_gian
        self._trang_thai = trang_thai
    
    @property
    def ma_tt(self):
        return self._ma_tt
    
    @ma_tt.setter
    def ma_tt(self, value):
        self._ma_tt = value
    
    @property
    def ma_dh(self):
        return self._ma_dh
    
    @ma_dh.setter
    def ma_dh(self, value):
        self._ma_dh = value
    
    @property
    def ma_pttt(self):
        return self._ma_pttt
    
    @ma_pttt.setter
    def ma_pttt(self, value):
        self._ma_pttt = value
    
    @property
    def ma_tt_tra_ve(self):
        return self._ma_tt_tra_ve
    
    @ma_tt_tra_ve.setter
    def ma_tt_tra_ve(self, value):
        self._ma_tt_tra_ve = value
    
    @property
    def tong_tien(self):
        return self._tong_tien
    
    @tong_tien.setter
    def tong_tien(self, value):
        self._tong_tien = value
    
    @property
    def thoi_gian(self):
        return self._thoi_gian
    
    @thoi_gian.setter
    def thoi_gian(self, value):
        self._thoi_gian = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value