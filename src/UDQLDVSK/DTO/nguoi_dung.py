class NguoiDung:
    def __init__(self, ma_tk, ho, ten, email, sdt, avatar_url):
        self._ma_tk = ma_tk
        self._ho = ho
        self._ten = ten
        self._email = email
        self._sdt = sdt
        self._avatar_url = avatar_url
    
    @property
    def ma_tk(self):
        return self._ma_tk
    
    @ma_tk.setter
    def ma_tk(self, value):
        self._ma_tk = value
    
    @property
    def ho(self):
        return self._ho
    
    @ho.setter
    def ho(self, value):
        self._ho = value
    
    @property
    def ten(self):
        return self._ten
    
    @ten.setter
    def ten(self, value):
        self._ten = value
    
    @property
    def email(self):
        return self._email
    
    @email.setter
    def email(self, value):
        self._email = value
    
    @property
    def sdt(self):
        return self._sdt
    
    @sdt.setter
    def sdt(self, value):
        self._sdt = value
    
    @property
    def avatar_url(self):
        return self._avatar_url
    
    @avatar_url.setter
    def avatar_url(self, value):
        self._avatar_url = value