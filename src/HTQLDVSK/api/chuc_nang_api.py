from flask import Blueprint, jsonify
from bus.chuc_nang_bus import ChucNangBUS

# Tạo một Blueprint tên là 'chuc_nang_bp'
chuc_nang_bp = Blueprint('chuc_nang_bp', __name__)

@chuc_nang_bp.route('/api/chuc-nang', methods=['GET'])
def api_get_chuc_nang():
    data_tree = ChucNangBUS.lay_menu_dong()
    return jsonify(data_tree), 200

# Lưu ý: Không còn dòng if __name__ == '__main__': app.run(...) ở đây nữa!