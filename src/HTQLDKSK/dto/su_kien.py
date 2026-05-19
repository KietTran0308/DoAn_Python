class SuKien:
    def __init__(self, ma_sk, ma_dmsk, ma_dd, ten_sk, mo_ta, image_url, tg_bat_dau, tg_ket_thuc, trang_thai):
        self._ma_sk = ma_sk
        self._ma_dmsk = ma_dmsk
        self._ma_dd = ma_dd
        self._ten_sk = ten_sk
        self._mo_ta = mo_ta
        self._image_url = image_url
        self._tg_bat_dau = tg_bat_dau
        self._tg_ket_thuc = tg_ket_thuc
        self._trang_thai = trang_thai
    
    @property
    def ma_sk(self):
        return self._ma_sk
    
    @ma_sk.setter
    def ma_sk(self, value):
        self._ma_sk = value
    
    @property
    def ma_dmsk(self):
        return self._ma_dmsk
    
    @ma_dmsk.setter
    def ma_dmsk(self, value):
        self._ma_dmsk = value
    
    @property
    def ma_dd(self):
        return self._ma_dd
    
    @ma_dd.setter
    def ma_dd(self, value):
        self._ma_dd = value
    
    @property
    def ten_sk(self):
        return self._ten_sk
    
    @ten_sk.setter
    def ten_sk(self, value):
        self._ten_sk = value
    
    @property
    def mo_ta(self):
        return self._mo_ta
    
    @mo_ta.setter
    def mo_ta(self, value):
        self._mo_ta = value
    
    @property
    def image_url(self):
        return self._image_url
    
    @image_url.setter
    def image_url(self, value):
        self._image_url = value
    
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
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value