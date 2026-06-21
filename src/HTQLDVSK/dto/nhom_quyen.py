class NhomQuyen:
    def __init__(self, ma_nq, ten_nq):
        self._ma_nq = ma_nq
        self._ten_nq = ten_nq
    
    @property
    def ma_nq(self):
        return self._ma_nq
    
    @ma_nq.setter
    def ma_nq(self, value):
        self._ma_nq = value
    
    @property
    def ten_nq(self):
        return self._ten_nq
    
    @ten_nq.setter
    def ten_nq(self, value):
        self._ten_nq = value