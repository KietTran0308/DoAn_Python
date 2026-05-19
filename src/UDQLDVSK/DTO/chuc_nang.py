class ChucNang:
    def __init__(self, ma_cn, ten_cn):
        self._ma_cn = ma_cn
        self._ten_cn = ten_cn
    
    @property
    def ma_cn(self):
        return self._ma_cn
    
    @ma_cn.setter
    def ma_cn(self, value):
        self._ma_cn = value
    
    @property
    def ten_cn(self):
        return self._ten_cn
    
    @ten_cn.setter
    def ten_cn(self, value):
        self._ten_cn = value