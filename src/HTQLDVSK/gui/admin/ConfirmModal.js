class ConfirmModalManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'custom-confirm-modal';
        this.container.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 10005; justify-content: center; align-items: center; backdrop-filter: blur(3px);';

        this.container.innerHTML = `
            <div style="width: 420px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.4); transform: scale(0.9); transition: 0.2s; opacity: 0;" id="confirm-box">
                <div style="padding: 15px 25px; background: #e74c3c; color: white; display: flex; align-items: center; gap: 12px;" id="confirm-header">
                    <span style="font-size: 22px;">⚠️</span>
                    <h3 id="confirm-title" style="margin: 0; font-size: 16px;">Xác nhận</h3>
                </div>
                <div style="padding: 25px; color: #262532; font-size: 15px; line-height: 1.6;" id="confirm-message">
                    Bạn có chắc chắn không?
                </div>
                <div style="padding: 15px 25px; background: #f8f9fa; border-top: 1px solid #ddd; display: flex; justify-content: flex-end; gap: 12px;">
                    <button id="confirm-btn-cancel" style="padding: 10px 20px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer; font-weight: bold; color: #444; transition: 0.2s;">Hủy bỏ</button>
                    <button id="confirm-btn-ok" style="padding: 10px 20px; border: none; background: #e74c3c; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">Đồng ý</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);

        this.btnCancel = document.getElementById('confirm-btn-cancel');
        this.btnOk = document.getElementById('confirm-btn-ok');
        this.box = document.getElementById('confirm-box');
        this.title = document.getElementById('confirm-title');
        this.message = document.getElementById('confirm-message');
        this.header = document.getElementById('confirm-header');

        this.btnCancel.onclick = () => this.hide();
    }

    show({ title = 'Xác nhận', message, onConfirm, okText = 'Đồng ý', cancelText = 'Hủy bỏ', okColor = '#e74c3c' }) {
        this.title.textContent = title;
        this.message.innerHTML = message;
        this.btnOk.textContent = okText;
        this.btnCancel.textContent = cancelText;

        this.btnOk.style.background = okColor;
        this.header.style.background = okColor;

        this.container.style.display = 'flex';
        // Reflow để kích hoạt animation
        void this.box.offsetWidth;
        this.box.style.transform = 'scale(1)';
        this.box.style.opacity = '1';

        this.btnOk.onclick = () => {
            this.hide();
            if (onConfirm) onConfirm();
        };
    }

    hide() {
        this.box.style.transform = 'scale(0.9)';
        this.box.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 200);
    }
}
// Khởi tạo toàn cục
window.ConfirmModal = new ConfirmModalManager();