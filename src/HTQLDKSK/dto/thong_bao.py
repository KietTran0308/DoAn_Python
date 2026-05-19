class ThongBao:
    def __init__(self, ma_tb, ma_tk, tieu_de, noi_dung, trang_thai_doc, thoi_gian_gui):
        self._ma_tb = ma_tb
        self._ma_tk = ma_tk
        self._tieu_de = tieu_de
        self._noi_dung = noi_dung
        self._trang_thai_doc = trang_thai_doc
        self._thoi_gian_gui = thoi_gian_gui
    
    @property
    def ma_tb(self):
        return self._ma_tb
    
    @ma_tb.setter
    def ma_tb(self, value):
        self._ma_tb = value
    
    @property
    def ma_tk(self):
        return self._ma_tk
    
    @ma_tk.setter
    def ma_tk(self, value):
        self._ma_tk = value
    
    @property
    def tieu_de(self):
        return self._tieu_de
    
    @tieu_de.setter
    def tieu_de(self, value):
        self._tieu_de = value
    
    @property
    def noi_dung(self):
        return self._noi_dung
    
    @noi_dung.setter
    def noi_dung(self, value):
        self._noi_dung = value
    
    @property
    def trang_thai_doc(self):
        return self._trang_thai_doc
    
    @trang_thai_doc.setter
    def trang_thai_doc(self, value):
        self._trang_thai_doc = value
    
    @property
    def thoi_gian_gui(self):
        return self._thoi_gian_gui
    
    @thoi_gian_gui.setter
    def thoi_gian_gui(self, value):
        self._thoi_gian_gui = value