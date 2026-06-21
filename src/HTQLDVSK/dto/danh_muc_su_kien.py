class DanhMucSuKien:
    # Thêm so_luong_sk vào constructor với giá trị mặc định là 0
    def __init__(self, ma_dmsk, ten_dm, image_url, so_luong_sk=0):
        self._ma_dmsk = ma_dmsk
        self._ten_dm = ten_dm
        self._image_url = image_url
        self._so_luong_sk = so_luong_sk

    @property
    def ma_dmsk(self): return self._ma_dmsk

    @ma_dmsk.setter
    def ma_dmsk(self, value): self._ma_dmsk = value

    @property
    def ten_dm(self): return self._ten_dm

    @ten_dm.setter
    def ten_dm(self, value): self._ten_dm = value

    @property
    def image_url(self): return self._image_url

    @image_url.setter
    def image_url(self, value): self._image_url = value

    @property
    def so_luong_sk(self): return self._so_luong_sk

    @so_luong_sk.setter
    def so_luong_sk(self, value): self._so_luong_sk = value

    def to_dict(self):
        return {
            "MA_DMSK": self._ma_dmsk,
            "TEN_DM": self._ten_dm,
            "IMAGE_URL": self._image_url,
            "SO_LUONG_SK": self._so_luong_sk
        }