from dto.nghe_si import NgheSi

class NgheSiDAO:
    def __init__(self, db_connection):
        self.db = db_connection

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        query = "SELECT MA_NS, TEN_NS, TIEU_SU, IMAGE_URL FROM nghe_si ORDER BY MA_NS DESC"
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()

        # Ánh xạ từ DB sang object DTO
        return [NgheSi(r['MA_NS'], r['TEN_NS'], r['TIEU_SU'], r['IMAGE_URL']) for r in rows]

    def insert(self, ns: NgheSi):
        cursor = self.db.cursor()
        query = "INSERT INTO nghe_si (TEN_NS, TIEU_SU, IMAGE_URL) VALUES (%s, %s, %s)"
        cursor.execute(query, (ns.ten_ns, ns.tieu_su, ns.image_url))
        self.db.commit()
        cursor.close()
        return True

    def update(self, ns: NgheSi):
        cursor = self.db.cursor()
        query = "UPDATE nghe_si SET TEN_NS = %s, TIEU_SU = %s, IMAGE_URL = %s WHERE MA_NS = %s"
        cursor.execute(query, (ns.ten_ns, ns.tieu_su, ns.image_url, ns.ma_ns))
        self.db.commit()
        cursor.close()
        return True

    def delete(self, ma_ns):
        cursor = self.db.cursor()
        query = "DELETE FROM nghe_si WHERE MA_NS = %s"
        cursor.execute(query, (ma_ns,))
        self.db.commit()
        cursor.close()
        return True