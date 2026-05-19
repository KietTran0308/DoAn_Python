class SkNs:
    def __init__(self, ma_sk, ma_ns):
        self._ma_sk = ma_sk
        self._ma_ns = ma_ns
    
    @property
    def ma_sk(self):
        return self._ma_sk
    
    @ma_sk.setter
    def ma_sk(self, value):
        self._ma_sk = value
    
    @property
    def ma_ns(self):
        return self._ma_ns
    
    @ma_ns.setter
    def ma_ns(self, value):
        self._ma_ns = value