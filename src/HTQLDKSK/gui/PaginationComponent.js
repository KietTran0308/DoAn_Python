class PaginationBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['total-pages', 'current-page'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const totalPages = parseInt(this.getAttribute('total-pages')) || 1;
        const currentPage = parseInt(this.getAttribute('current-page')) || 1;

        // CSS đóng gói nội bộ (Không ảnh hưởng ra ngoài)
        this.shadowRoot.innerHTML = `
            <style>
                .pagination-container {
                    margin-top: 20px;
                    text-align: center;
                    font: bold 16px 'Space Grotesk', sans-serif;
                }
                .page-item {
                    display: inline-block;
                    padding: 6px 14px;
                    margin: 0 4px;
                    background-color: white;
                    border: 1px solid #464555;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                    font-size: 14px;
                    color: #262532;
                    user-select: none;
                }
                .page-item:hover {
                    background-color: rgba(124, 204, 255, 0.1);
                    border-color: #7CCDFF;
                    color: #ffffff;
                }
                .page-item.active {
                    background-color: #7CCDFF;
                    color: #100F1A;
                    border-color: #7CCDFF;
                }
                .page-item.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
            </style>
            <div class="pagination-container"></div>
        `;

        const container = this.shadowRoot.querySelector('.pagination-container');

        // Nút Prev (<)
        const prevBtn = document.createElement('span');
        prevBtn.className = `page-item ${currentPage <= 1 ? 'disabled' : ''}`;
        prevBtn.textContent = '<';
        if (currentPage > 1) prevBtn.onclick = () => this.changePage(currentPage - 1);
        container.appendChild(prevBtn);

        // Các nút số trang (1, 2, 3...)
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('span');
            pageBtn.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            if (i !== currentPage) pageBtn.onclick = () => this.changePage(i);
            container.appendChild(pageBtn);
        }

        // Nút Next (>)
        const nextBtn = document.createElement('span');
        nextBtn.className = `page-item ${currentPage >= totalPages ? 'disabled' : ''}`;
        nextBtn.textContent = '>';
        if (currentPage < totalPages) nextBtn.onclick = () => this.changePage(currentPage + 1);
        container.appendChild(nextBtn);
    }

    changePage(newPage) {
        // Bắn sự kiện ra ngoài hệ thống
        this.dispatchEvent(new CustomEvent('page-changed', {
            detail: { page: newPage },
            bubbles: true,
            composed: true
        }));
    }
}

// Đăng ký thẻ HTML mới
customElements.define('pagination-box', PaginationBox);