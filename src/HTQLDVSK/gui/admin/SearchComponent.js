class SearchBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const placeholderText = this.getAttribute('placeholder') || 'Tìm kiếm...';

        this.shadowRoot.innerHTML = `
            <style>
                .reusable-search-box {
                    width: 25vw;
                    /* Gộp padding: trên-phải-dưới-trái. Trái 50px để chừa chỗ cho icon */
                    padding: 8px 8px 8px 50px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font: normal 18px 'Merriweather', sans-serif;

                    /* Tích hợp icon */
                    background-image: url('../../img/Search.png');
                    background-position: 8px center;
                    background-repeat: no-repeat;
                    background-size: 30px;

                    /* Hiệu ứng chuyển đổi mượt mà */
                    transition: all 0.2s ease-in-out;
                }

                .reusable-search-box:focus {
                    border-color: #80ceff;
                    outline: none;
                    box-shadow: 0 0 5px rgba(128, 206, 255, 0.5);
                }
            </style>
            
            <input type="text" class="reusable-search-box" placeholder="${placeholderText}">
        `;


        const inputEl = this.shadowRoot.querySelector('input');
        inputEl.addEventListener('input', (e) => {
            // Bắn một sự kiện custom ra bên ngoài để file JS chính (như CN11_SuKien.js) có thể bắt được
            this.dispatchEvent(new CustomEvent('search-changed', {
                detail: {value: e.target.value},
                bubbles: true,
                composed: true // Quan trọng: Cho phép event vượt ra khỏi Shadow DOM
            }));
        });
    }
}

// Đăng ký thẻ HTML tùy chỉnh
customElements.define('search-box', SearchBox);