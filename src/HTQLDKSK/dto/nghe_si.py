class NgheSi:
    def __init__(self, ma_ns, ten_ns, tieu_su, image_url):
        self._ma_ns = ma_ns
        self._ten_ns = ten_ns
        self._tieu_su = tieu_su
        self._image_url = image_url
    
    @property
    def ma_ns(self):
        return self._ma_ns
    
    @ma_ns.setter
    def ma_ns(self, value):
        self._ma_ns = value
    
    @property
    def ten_ns(self):
        return self._ten_ns
    
    @ten_ns.setter
    def ten_ns(self, value):
        self._ten_ns = value
    
    @property
    def tieu_su(self):
        return self._tieu_su
    
    @tieu_su.setter
    def tieu_su(self, value):
        self._tieu_su = value
    
    @property
    def image_url(self):
        return self._image_url
    
    @image_url.setter
    def image_url(self, value):
        self._image_url = value