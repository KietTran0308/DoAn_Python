class Ghe:
    def __init__(self, ma_ghe, ma_hg, day_ghe, so_ghe, trang_thai, tg_khoa_ghe):
        self._ma_ghe = ma_ghe
        self._ma_hg = ma_hg
        self._day_ghe = day_ghe
        self._so_ghe = so_ghe
        self._trang_thai = trang_thai
        self._tg_khoa_ghe = tg_khoa_ghe
    
    @property
    def ma_ghe(self):
        return self._ma_ghe
    
    @ma_ghe.setter
    def ma_ghe(self, value):
        self._ma_ghe = value
    
    @property
    def ma_hg(self):
        return self._ma_hg
    
    @ma_hg.setter
    def ma_hg(self, value):
        self._ma_hg = value
    
    @property
    def day_ghe(self):
        return self._day_ghe
    
    @day_ghe.setter
    def day_ghe(self, value):
        self._day_ghe = value
    
    @property
    def so_ghe(self):
        return self._so_ghe
    
    @so_ghe.setter
    def so_ghe(self, value):
        self._so_ghe = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value
    
    @property
    def tg_khoa_ghe(self):
        return self._tg_khoa_ghe
    
    @tg_khoa_ghe.setter
    def tg_khoa_ghe(self, value):
        self._tg_khoa_ghe = value