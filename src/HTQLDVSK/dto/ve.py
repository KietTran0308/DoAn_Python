class Ve:
    def __init__(self, ma_ve, ma_ghe, ma_dh, qr_code, gia_ve_luc_mua):
        self._ma_ve = ma_ve
        self._ma_ghe = ma_ghe
        self._ma_dh = ma_dh
        self._qr_code = qr_code
        self._gia_ve_luc_mua = gia_ve_luc_mua
    
    @property
    def ma_ve(self):
        return self._ma_ve
    
    @ma_ve.setter
    def ma_ve(self, value):
        self._ma_ve = value
    
    @property
    def ma_ghe(self):
        return self._ma_ghe
    
    @ma_ghe.setter
    def ma_ghe(self, value):
        self._ma_ghe = value
    
    @property
    def ma_dh(self):
        return self._ma_dh
    
    @ma_dh.setter
    def ma_dh(self, value):
        self._ma_dh = value
    
    @property
    def qr_code(self):
        return self._qr_code
    
    @qr_code.setter
    def qr_code(self, value):
        self._qr_code = value
    
    @property
    def gia_ve_luc_mua(self):
        return self._gia_ve_luc_mua
    
    @gia_ve_luc_mua.setter
    def gia_ve_luc_mua(self, value):
        self._gia_ve_luc_mua = value