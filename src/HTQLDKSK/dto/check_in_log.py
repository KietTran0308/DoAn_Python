class CheckInLog:
    def __init__(self, ma_log, ma_ve, ma_tk, trang_thai, tg_quet, ten_cong):
        self._ma_log = ma_log
        self._ma_ve = ma_ve
        self._ma_tk = ma_tk
        self._trang_thai = trang_thai
        self._tg_quet = tg_quet
        self._ten_cong = ten_cong
    
    @property
    def ma_log(self):
        return self._ma_log
    
    @ma_log.setter
    def ma_log(self, value):
        self._ma_log = value
    
    @property
    def ma_ve(self):
        return self._ma_ve
    
    @ma_ve.setter
    def ma_ve(self, value):
        self._ma_ve = value
    
    @property
    def ma_tk(self):
        return self._ma_tk
    
    @ma_tk.setter
    def ma_tk(self, value):
        self._ma_tk = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value
    
    @property
    def tg_quet(self):
        return self._tg_quet
    
    @tg_quet.setter
    def tg_quet(self, value):
        self._tg_quet = value
    
    @property
    def ten_cong(self):
        return self._ten_cong
    
    @ten_cong.setter
    def ten_cong(self, value):
        self._ten_cong = value