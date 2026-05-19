class GiamGia:
    def __init__(self, ma_gg, code, loai_giam, gia_tri_giam, dieu_kien, tg_bat_dau, tg_ket_thuc, giam_toi_da, gioi_han):
        self._ma_gg = ma_gg
        self._code = code
        self._loai_giam = loai_giam
        self._gia_tri_giam = gia_tri_giam
        self._dieu_kien = dieu_kien
        self._tg_bat_dau = tg_bat_dau
        self._tg_ket_thuc = tg_ket_thuc
        self._giam_toi_da = giam_toi_da
        self._gioi_han = gioi_han
    
    @property
    def ma_gg(self):
        return self._ma_gg
    
    @ma_gg.setter
    def ma_gg(self, value):
        self._ma_gg = value
    
    @property
    def code(self):
        return self._code
    
    @code.setter
    def code(self, value):
        self._code = value
    
    @property
    def loai_giam(self):
        return self._loai_giam
    
    @loai_giam.setter
    def loai_giam(self, value):
        self._loai_giam = value
    
    @property
    def gia_tri_giam(self):
        return self._gia_tri_giam
    
    @gia_tri_giam.setter
    def gia_tri_giam(self, value):
        self._gia_tri_giam = value
    
    @property
    def dieu_kien(self):
        return self._dieu_kien
    
    @dieu_kien.setter
    def dieu_kien(self, value):
        self._dieu_kien = value
    
    @property
    def tg_bat_dau(self):
        return self._tg_bat_dau
    
    @tg_bat_dau.setter
    def tg_bat_dau(self, value):
        self._tg_bat_dau = value
    
    @property
    def tg_ket_thuc(self):
        return self._tg_ket_thuc
    
    @tg_ket_thuc.setter
    def tg_ket_thuc(self, value):
        self._tg_ket_thuc = value
    
    @property
    def giam_toi_da(self):
        return self._giam_toi_da
    
    @giam_toi_da.setter
    def giam_toi_da(self, value):
        self._giam_toi_da = value
    
    @property
    def gioi_han(self):
        return self._gioi_han
    
    @gioi_han.setter
    def gioi_han(self, value):
        self._gioi_han = value