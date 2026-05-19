class DiaDiem:
    def __init__(self, ma_dd, ten_dd, dia_chi, tong_so_cot, tong_so_hang):
        self._ma_dd = ma_dd
        self._ten_dd = ten_dd
        self._dia_chi = dia_chi
        self._tong_so_cot = tong_so_cot
        self._tong_so_hang = tong_so_hang
    
    @property
    def ma_dd(self):
        return self._ma_dd
    
    @ma_dd.setter
    def ma_dd(self, value):
        self._ma_dd = value
    
    @property
    def ten_dd(self):
        return self._ten_dd
    
    @ten_dd.setter
    def ten_dd(self, value):
        self._ten_dd = value
    
    @property
    def dia_chi(self):
        return self._dia_chi
    
    @dia_chi.setter
    def dia_chi(self, value):
        self._dia_chi = value
    
    @property
    def tong_so_cot(self):
        return self._tong_so_cot
    
    @tong_so_cot.setter
    def tong_so_cot(self, value):
        self._tong_so_cot = value
    
    @property
    def tong_so_hang(self):
        return self._tong_so_hang
    
    @tong_so_hang.setter
    def tong_so_hang(self, value):
        self._tong_so_hang = value