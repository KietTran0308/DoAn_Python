class PhuongThucTT:
    def __init__(self, ma_pttt, ten_pttt, icon_url, trang_thai):
        self._ma_pttt = ma_pttt
        self._ten_pttt = ten_pttt
        self._icon_url = icon_url
        self._trang_thai = trang_thai
    
    @property
    def ma_pttt(self):
        return self._ma_pttt
    
    @ma_pttt.setter
    def ma_pttt(self, value):
        self._ma_pttt = value
    
    @property
    def ten_pttt(self):
        return self._ten_pttt
    
    @ten_pttt.setter
    def ten_pttt(self, value):
        self._ten_pttt = value
    
    @property
    def icon_url(self):
        return self._icon_url
    
    @icon_url.setter
    def icon_url(self, value):
        self._icon_url = value
    
    @property
    def trang_thai(self):
        return self._trang_thai
    
    @trang_thai.setter
    def trang_thai(self, value):
        self._trang_thai = value