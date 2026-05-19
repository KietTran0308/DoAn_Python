class NqCn:
    def __init__(self, ma_nq, ten_cn, xem, them, sua, xoa):
        self._ma_nq = ma_nq
        self._ten_cn = ten_cn
        self._xem = xem
        self._them = them
        self._sua = sua
        self._xoa = xoa
    
    @property
    def ma_nq(self):
        return self._ma_nq
    
    @ma_nq.setter
    def ma_nq(self, value):
        self._ma_nq = value
    
    @property
    def ten_cn(self):
        return self._ten_cn
    
    @ten_cn.setter
    def ten_cn(self, value):
        self._ten_cn = value
    
    @property
    def xem(self):
        return self._xem
    
    @xem.setter
    def xem(self, value):
        self._xem = value
    
    @property
    def them(self):
        return self._them
    
    @them.setter
    def them(self, value):
        self._them = value
    
    @property
    def sua(self):
        return self._sua
    
    @sua.setter
    def sua(self, value):
        self._sua = value
    
    @property
    def xoa(self):
        return self._xoa
    
    @xoa.setter
    def xoa(self, value):
        self._xoa = value