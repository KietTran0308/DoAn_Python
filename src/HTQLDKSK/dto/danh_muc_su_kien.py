class DanhMucSuKien:
    def __init__(self, ma_dmsk, ten_dm, image_url):
        self._ma_dmsk = ma_dmsk
        self._ten_dm = ten_dm
        self._image_url = image_url
    
    @property
    def ma_dmsk(self):
        return self._ma_dmsk
    
    @ma_dmsk.setter
    def ma_dmsk(self, value):
        self._ma_dmsk = value
    
    @property
    def ten_dm(self):
        return self._ten_dm
    
    @ten_dm.setter
    def ten_dm(self, value):
        self._ten_dm = value
    
    @property
    def image_url(self):
        return self._image_url
    
    @image_url.setter
    def image_url(self, value):
        self._image_url = value