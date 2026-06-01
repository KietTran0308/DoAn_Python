from bus.tai_khoan_bus import TaiKhoanBUS

class AuthAPI:
    def __init__(self, db_connection):
        self.bus = TaiKhoanBUS(db_connection)

    def login(self, username, password):
        return self.bus.xac_thuc(
            username,
            password
        )

    def register(
        self,
        username,
        password,
        ho,
        ten,
        email,
        sdt
    ):
        return self.bus.dang_ky(
            username,
            password,
            ho,
            ten,
            email,
            sdt
        )