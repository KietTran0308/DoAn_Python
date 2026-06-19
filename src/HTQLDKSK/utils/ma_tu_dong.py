from datetime import datetime


class MaTuDong:
    # ===== Loại đối tượng =====

    DIA_DIEM = 2
    VE = 3
    DON_HANG = 5
    GIAM_GIA = 6
    NGHE_SI = 7

    # ===== Số chữ số của phần tự tăng =====

    SO_CHU_SO = {
        DIA_DIEM: 5,
        VE: 6,
        DON_HANG: 6,
        GIAM_GIA: 5,
        NGHE_SI: 5
    }

    @staticmethod
    def _nam() -> int:
        """
        Lấy 2 số cuối của năm hiện tại. Ví dụ: 2026 -> 26
        """
        return datetime.now().year % 100

    @staticmethod
    def sinh_ma(loai: int, so_thu_tu: int) -> int:
        """
        Sinh mã theo định dạng:

        [loại][2 số cuối năm][số tự tăng]

        Ví dụ:
        22600001
        326000001
        """

        nam = MaTuDong._nam()
        so_chu_so = MaTuDong.SO_CHU_SO[loai]

        return int(
            f"{loai}{nam:02d}{so_thu_tu:0{so_chu_so}d}"
        )

    # ===== Hàm tiện ích =====

    @staticmethod
    def ma_dia_diem(so_thu_tu: int) -> int:
        return MaTuDong.sinh_ma(
            MaTuDong.DIA_DIEM,
            so_thu_tu
        )

    @staticmethod
    def ma_ve(so_thu_tu: int) -> int:
        return MaTuDong.sinh_ma(
            MaTuDong.VE,
            so_thu_tu
        )

    @staticmethod
    def ma_don_hang(so_thu_tu: int) -> int:
        return MaTuDong.sinh_ma(
            MaTuDong.DON_HANG,
            so_thu_tu
        )

    @staticmethod
    def ma_giam_gia(so_thu_tu: int) -> int:
        return MaTuDong.sinh_ma(
            MaTuDong.GIAM_GIA,
            so_thu_tu
        )

    @staticmethod
    def ma_nghe_si(so_thu_tu: int) -> int:
        return MaTuDong.sinh_ma(
            MaTuDong.NGHE_SI,
            so_thu_tu
        )


def lay_so_thu_tu_tiep(cursor, bang: str, cot_ma: str) -> int:
    """
    Lấy số thứ tự tiếp theo theo từng năm.

    Ví dụ:

    Năm 2026:
        22600001
        22600002

    Sang năm 2027:
        22700001

    Lưu ý:
    - Hàm này phải được gọi bên trong transaction.
    - Sau khi INSERT cần commit ngay.
    """

    nam = datetime.now().year % 100

    # Ví dụ:
    # __26%
    # Ký tự _ đại diện cho mã loại (1 chữ số)

    prefix = f"__{nam:02d}%"

    query = f"""
        SELECT COALESCE(MAX({cot_ma}), 0)
        FROM {bang}
        WHERE CAST({cot_ma} AS CHAR) LIKE %s
        FOR UPDATE
    """

    cursor.execute(query, (prefix,))

    max_ma = cursor.fetchone()[0]

    if max_ma == 0:
        return 1

    return int(str(max_ma)[3:]) + 1