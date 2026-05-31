from bus.nguoi_dung_bus import NguoiDungBUS

class AuthAPI:
    def __init__(self, db_connection):
        self.bus = NguoiDungBUS(db_connection)

    # API Login
    def login(self, username, password):

        ket_qua = self.bus.xu_ly_dang_nhap(
            username,
            password
        )

        return ket_qua

    # API Register
    def register(
        self,
        username,
        password,
        ho,
        ten,
        email,
        sdt
    ):

        ket_qua = self.bus.xu_ly_dang_ky(
            username,
            password,
            ho,
            ten,
            email,
            sdt
        )

        return ket_qua