class HangGhe:
    def __init__(self, ma_hg, ma_sk, ten_hg, gia_tien):
        self._ma_hg = ma_hg
        self._ma_sk = ma_sk
        self._ten_hg = ten_hg
        self._gia_tien = gia_tien
    
    @property
    def ma_hg(self):
        return self._ma_hg
    
    @ma_hg.setter
    def ma_hg(self, value):
        self._ma_hg = value
    
    @property
    def ma_sk(self):
        return self._ma_sk
    
    @ma_sk.setter
    def ma_sk(self, value):
        self._ma_sk = value
    
    @property
    def ten_hg(self):
        return self._ten_hg
    
    @ten_hg.setter
    def ten_hg(self, value):
        self._ten_hg = value
    
    @property
    def gia_tien(self):
        return self._gia_tien
    
    @gia_tien.setter
    def gia_tien(self, value):
        self._gia_tien = value