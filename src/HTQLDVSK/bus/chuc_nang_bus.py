# bus/chuc_nang_bus.py
from dao.chuc_nang_dao import ChucNangDAO

class ChucNangBUS:
    @staticmethod
    def lay_menu_dong():
        raw_data = ChucNangDAO.get_all()

        menu_tree = []
        menu_dict = {}

        for item in raw_data:
            item['children'] = []
            menu_dict[item['MA_CN']] = item

            if item['MA_CN_CHA'] is None:
                menu_tree.append(item)

        # Bước 2: Nối chức năng con vào đúng chức năng cha
        for item in raw_data:
            if item['MA_CN_CHA'] is not None:
                ma_cha = item['MA_CN_CHA']
                if ma_cha in menu_dict:
                    menu_dict[ma_cha]['children'].append(item)

        return menu_tree