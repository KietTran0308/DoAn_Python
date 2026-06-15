(() => {
    let rolesData = [];
    let functionsData = [];
    let currentPermissions = []; // Dữ liệu quyền gốc
    let editingPermissions = []; // Dữ liệu quyền nháp khi đang Sửa

    let isEditing = false;
    let currentSelectedRole = null;

    // --- CẤU HÌNH PHÂN TRANG ---
    let currentPage = 1;
    const rowsPerPage = 10;

    async function init() {
        await loadBaseDataFromAPI();
        renderRoleSelect();
        setupEvents();

        if (rolesData.length > 0) {
            document.getElementById('role-select').value = rolesData[0].MA_NQ;
            loadPermissionsForRole(rolesData[0].MA_NQ);
        }
    }

    async function loadBaseDataFromAPI() {
        try {
            // Tải song song Nhóm quyền và Chức năng để tối ưu tốc độ
            const [rolesRes, funcsRes] = await Promise.all([
                fetch('http://localhost:8000/api/nhom-quyen'),
                fetch('http://localhost:8000/api/chuc-nang')
            ]);
            rolesData = await rolesRes.json();
            functionsData = await funcsRes.json();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu cấu hình phân quyền:", error);
            alert("Lỗi kết nối Server.");
        }
    }

    function renderRoleSelect() {
        const select = document.getElementById('role-select');
        select.replaceChildren();
        rolesData.forEach(role => {
            const option = document.createElement('option');
            option.value = role.MA_NQ;
            option.textContent = role.TEN_NQ;
            select.appendChild(option);
        });
    }

    function setupEvents() {
        const select = document.getElementById('role-select');
        const btnToggle = document.getElementById('btn-toggle-edit');

        select.addEventListener('change', (e) => {
            isEditing = false;
            updateToggleButtonUI();
            loadPermissionsForRole(parseInt(e.target.value));
        });

        btnToggle.addEventListener('click', () => {
            if (!isEditing) {
                isEditing = true;
                // Sao chép sâu (deep copy) dữ liệu gốc ra bản nháp để sửa
                editingPermissions = JSON.parse(JSON.stringify(currentPermissions));
                updateToggleButtonUI();
                renderPermissionTable();
            } else {
                savePermissions();
            }
        });
    }

    function updateToggleButtonUI() {
        const btnToggle = document.getElementById('btn-toggle-edit');
        if (isEditing) {
            btnToggle.style.backgroundColor = '#28a745';
            btnToggle.innerHTML = '<span>💾 Lưu Phân Quyền</span>';
        } else {
            btnToggle.style.backgroundColor = '#f39c12';
            btnToggle.innerHTML = '<span>✏️ Sửa Phân Quyền</span>';
        }
    }

    async function loadPermissionsForRole(roleId) {
        currentSelectedRole = roleId;
        currentPage = 1;

        try {
            const response = await fetch(`http://localhost:8000/api/phan-quyen/${roleId}`);
            if (!response.ok) throw new Error("API Lỗi");
            currentPermissions = await response.json();

            // Đồng bộ dữ liệu nháp
            editingPermissions = JSON.parse(JSON.stringify(currentPermissions));
            renderPermissionTable();
        } catch (error) {
            console.error("Lỗi tải quyền của nhóm:", error);
        }
    }

    function renderPermissionTable() {
        const tbody = document.getElementById('permission-table-body');
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageFunctions = functionsData.slice(startIndex, startIndex + rowsPerPage);

        const activePermissions = isEditing ? editingPermissions : currentPermissions;

        pageFunctions.forEach(fn => {
            // Tìm hoặc khởi tạo mặc định (0) nếu bảng nq_cn chưa có dòng này
            let perm = activePermissions.find(p => p.MA_CN === fn.MA_CN);
            if (!perm) {
                perm = { MA_CN: fn.MA_CN, XEM: 0, THEM: 0, SUA: 0, XOA: 0 };
                activePermissions.push(perm);
            }

            let isParentXemOn = true;
            if (fn.MA_CN_CHA !== null) {
                const parentPerm = activePermissions.find(p => p.MA_CN === fn.MA_CN_CHA);
                isParentXemOn = parentPerm ? parentPerm.XEM === 1 : false;
            }

            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            if (fn.MA_CN_CHA === null) {
                tdName.style.cssText = "font-weight: bold; color: #262532; padding-left: 20px;";
                tr.style.backgroundColor = '#f8f9fa';
                tdName.textContent = fn.TEN_CN;
            } else {
                tdName.style.paddingLeft = '50px';
                tdName.textContent = '↳ ' + fn.TEN_CN;
            }
            tr.appendChild(tdName);

            const actions = ['XEM', 'THEM', 'SUA', 'XOA'];
            actions.forEach(action => {
                const td = document.createElement('td');
                td.style.textAlign = 'center';

                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.disabled = !isEditing;

                if (isEditing) {
                    if (action === 'XEM') {
                        if (fn.MA_CN_CHA !== null && !isParentXemOn) chk.disabled = true;
                    } else {
                        if (perm['XEM'] === 0 || (fn.MA_CN_CHA !== null && !isParentXemOn)) {
                            chk.disabled = true;
                        }
                    }
                }

                chk.checked = (perm[action] === 1) && !chk.disabled;

                chk.addEventListener('change', (e) => {
                    if (!isEditing) return;
                    const isChecked = e.target.checked ? 1 : 0;
                    perm[action] = isChecked;

                    if (action === 'XEM') {
                        if (isChecked === 0) {
                            perm['THEM'] = 0; perm['SUA'] = 0; perm['XOA'] = 0;

                            if (fn.MA_CN_CHA === null) {
                                functionsData.filter(f => f.MA_CN_CHA === fn.MA_CN).forEach(child => {
                                    let cPerm = activePermissions.find(p => p.MA_CN === child.MA_CN);
                                    if (!cPerm) {
                                        cPerm = { MA_CN: child.MA_CN, XEM: 0, THEM: 0, SUA: 0, XOA: 0 };
                                        activePermissions.push(cPerm);
                                    }
                                    cPerm.XEM = 0; cPerm.THEM = 0; cPerm.SUA = 0; cPerm.XOA = 0;
                                });
                            }
                        } else {
                            if (fn.MA_CN_CHA !== null) {
                                let pPerm = activePermissions.find(p => p.MA_CN === fn.MA_CN_CHA);
                                if (pPerm) pPerm.XEM = 1;
                            }
                        }
                    } else {
                        if (isChecked === 1) {
                            perm['XEM'] = 1;
                            if (fn.MA_CN_CHA !== null) {
                                let pPerm = activePermissions.find(p => p.MA_CN === fn.MA_CN_CHA);
                                if (pPerm) pPerm.XEM = 1;
                            }
                        }
                    }
                    renderPermissionTable();
                });

                td.appendChild(chk);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        renderPagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('permission-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.ceil(functionsData.length / rowsPerPage);
        if (totalPages <= 1) return;

        const btnStyle = "padding: 5px 12px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; user-select: none;";
        const activeStyle = "background: #007bff; color: white; border-color: #007bff;";

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            pageSpan.style.cssText = btnStyle;

            if (i === currentPage) {
                pageSpan.style.cssText += activeStyle;
            }

            pageSpan.addEventListener('click', () => {
                currentPage = i;
                renderPermissionTable();
            });

            paginationContainer.appendChild(pageSpan);
        }
    }

    async function savePermissions() {
        // Lọc bỏ những dòng không chọn bất kỳ quyền nào (all 0) để không tạo rác Database
        const payload = editingPermissions.filter(p => p.XEM === 1 || p.THEM === 1 || p.SUA === 1 || p.XOA === 1);

        try {
            const response = await fetch(`http://localhost:8000/api/phan-quyen/${currentSelectedRole}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Cập nhật phân quyền thành công!');
                currentPermissions = JSON.parse(JSON.stringify(editingPermissions));
                isEditing = false;
                updateToggleButtonUI();
                renderPermissionTable();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            console.error("Lỗi khi gửi dữ liệu phân quyền lên Server:", error);
            alert("Lỗi kết nối Server.");
        }
    }

    init();
})();