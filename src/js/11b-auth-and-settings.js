// ============================================================================
// HIZLI RAPOR - 11B-AUTH-AND-SETTINGS.JS
// Açıklama: Kullanıcı Hesapları, Kimlik Yönetimi, Şirket/Marka ve Uygulama Ayarları
// ============================================================================

// ============================================================================

// 14. ENLAB KULLANICI HESAP, ŞİFRE & KİMLİK YÖNETİM SİSTEMİ (OFFLINE-FIRST)

// ============================================================================



const AuthManager = {

    STORAGE_USERS_KEY: 'enlab_user_accounts_v1',

    STORAGE_SESSION_KEY: 'enlab_current_user_id',



    getUsers() {

        try {

            const raw = localStorage.getItem(this.STORAGE_USERS_KEY);

            if (raw) {

                const list = JSON.parse(raw);

                if (Array.isArray(list)) return list;

            }

        } catch (e) {}

        return [];

    },



    saveUsers(users) {

        try {

            localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(users));

        } catch (e) {}

    },



    getCurrentUser() {

        const users = this.getUsers();

        const curId = localStorage.getItem(this.STORAGE_SESSION_KEY);

        if (curId) {

            const found = users.find(u => String(u.id) === String(curId));

            if (found) return found;

        }

        return null;

    },



    upsertCloudUser(data) {

        const users = this.getUsers();

        const cloudId = String(data.cloudId || data.id || '').trim();

        const uname = String(data.username || '').trim();

        const localId = 'cloud_' + cloudId;

        const idx = users.findIndex(u =>
            (cloudId && String(u.cloudId) === cloudId)
            || String(u.id) === localId
            || (uname && String(u.username || '').trim().toLowerCase() === uname.toLowerCase())
        );

        const existing = idx >= 0 ? users[idx] : {};

        const record = {

            id: localId,

            cloudId,

            tenantId: String(data.tenantId || existing.tenantId || ''),

            tenantName: String(data.tenantName || existing.tenantName || ''),

            username: uname || existing.username || '',

            password: (data.password !== null && data.password !== undefined && data.password !== '')
                ? String(data.password).trim()
                : (existing.password || ''),

            role: String(data.role || existing.role || 'inspector'),

            fullName: String(data.fullName || existing.fullName || uname).trim(),

            title: String(data.title || existing.title || 'Elektrik Mühendisi').trim(),

            ministryRegNo: String(data.ministryRegNo !== undefined ? data.ministryRegNo : (existing.ministryRegNo || '')).trim(),

            diplomaNoDate: String(data.diplomaNoDate !== undefined ? data.diplomaNoDate : (existing.diplomaNoDate || '')).trim(),

            emoNo: String(data.emoNo !== undefined ? data.emoNo : (existing.emoNo || '')).trim(),

            cloudToken: data.cloudToken || existing.cloudToken || '',

            isCloudManaged: true,

            lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),

            createdAt: existing.createdAt || new Date().toISOString()

        };

        if (idx >= 0) {

            users[idx] = record;

        } else {

            users.push(record);

        }

        this.saveUsers(users);

        localStorage.setItem(this.STORAGE_SESSION_KEY, record.id);

        if (typeof updateHeaderUserWidget === 'function') updateHeaderUserWidget();

        return record;

    },



    login(username, password) {

        const users = this.getUsers();

        const uTrim = String(username || '').trim().toLowerCase();

        const pTrim = String(password || '').trim();



        const user = users.find(u => 

            u.username.trim().toLowerCase() === uTrim && 

            String(u.password).trim() === pTrim

        );



        if (user) {

            localStorage.setItem(this.STORAGE_SESSION_KEY, user.id);

            updateHeaderUserWidget();

            return { success: true, user };

        }

        return { success: false, message: 'Kullanıcı adı veya şifre hatalı!' };

    },



    register(data) {

        const users = this.getUsers();

        const uTrim = String(data.username || '').trim().toLowerCase();



        if (!data.fullName || !data.username || !data.password) {

            return { success: false, message: 'Lütfen Ad Soyad, Kullanıcı Adı ve Şifre alanlarını doldurun.' };

        }



        const exists = users.find(u => u.username.trim().toLowerCase() === uTrim);

        if (exists) {

            return { success: false, message: 'Bu kullanıcı adı zaten kullanılmaktadır!' };

        }



        const newUser = {

            id: 'usr_' + Date.now(),

            username: String(data.username).trim(),

            password: String(data.password).trim(),

            fullName: String(data.fullName).trim(),

            title: String(data.title || 'Elektrik Mühendisi').trim(),

            ministryRegNo: String(data.ministryRegNo || '').trim(),

            diplomaNoDate: String(data.diplomaNoDate || '').trim(),

            emoNo: String(data.emoNo || '').trim(),

            createdAt: new Date().toISOString()

        };



        users.push(newUser);

        this.saveUsers(users);

        localStorage.setItem(this.STORAGE_SESSION_KEY, newUser.id);

        updateHeaderUserWidget();

        return { success: true, user: newUser };

    },



    updateProfile(userId, fields) {

        const users = this.getUsers();

        const idx = users.findIndex(u => String(u.id) === String(userId));

        if (idx >= 0) {

            Object.assign(users[idx], fields);

            this.saveUsers(users);

            updateHeaderUserWidget();

            return { success: true, user: users[idx] };

        }

        return { success: false, message: 'Kullanıcı bulunamadı.' };

    },



    logout() {

        localStorage.removeItem(this.STORAGE_SESSION_KEY);

        updateHeaderUserWidget();

        const dock = document.getElementById('bottomActionDock');

        if (dock) dock.classList.add('hidden');

        renderAuthScreen('login');

        showToast('Oturum kapatıldı.');

    }

};



function updateHeaderUserWidget() {

    const el = document.getElementById('headerUserWidget');

    if (!el) return;

    const cur = AuthManager.getCurrentUser();

    if (cur) {

        const isSettings = AppState.currentRoute === 'settings';

        el.innerHTML = `

            <button onclick="navigateTo('${isSettings ? 'home' : 'settings'}')"

                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"

                title="${isSettings ? 'Ana Sayfaya Dön' : 'Uygulama, Şirket ve Rapor Ayarları'}">

                <i class="fa-solid ${isSettings ? 'fa-arrow-left text-sky-400' : 'fa-gear text-amber-400'}"></i>

                <span>${isSettings ? 'Geri' : 'Ayarlar'}</span>

            </button>

        `;

    } else {

        el.innerHTML = `

            <button onclick="renderAuthScreen('login')" class="px-2 py-1 rounded-lg bg-sky-600 text-[11px] hover:bg-sky-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition">

                <i class="fa-solid fa-right-to-bracket"></i>

                <span>Giriş</span>

            </button>

        `;

    }

}



function renderAuthScreen(activeTab = 'login') {

    const container = document.getElementById('pageContent');

    if (!container) return;

    container.scrollTop = 0;



    const dock = document.getElementById('bottomActionDock');

    if (dock) dock.classList.add('hidden');



    const users = AuthManager.getUsers();



    container.innerHTML = `

        <div class="max-w-md mx-auto my-4 sm:my-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden modal-sheet-animate">

            <!-- BRAND HEADER -->

            <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 text-center flex items-center justify-center gap-3">

                <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-slate-950 text-lg font-black shadow-md shrink-0">

                    <i class="fa-solid fa-bolt"></i>

                </div>

                <h1 class="font-black text-base tracking-tight">Personel Girişi</h1>

            </div>



            <!-- FORM AREA -->

            <div class="p-4 space-y-4">

                ${renderLoginFormHtml(users)}

            </div>

        </div>

    `;

}



function renderLoginFormHtml(users) {

    return `

        <div class="space-y-3.5 text-xs">

            ${users.length > 0 ? `

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Cihazdaki Kayıtlı Hesaplar</label>

                    <div class="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">

                        ${users.map(u => `

                            <button type="button" onclick="selectQuickUser('${escapeForJs(u.username)}')"

                                class="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-500 text-left flex items-center justify-between transition active:scale-98">

                                <div class="min-w-0">

                                    <div class="font-bold text-slate-900 truncate">${escapeHtml(u.fullName)}</div>

                                    <div class="text-[10px] text-slate-500 truncate">${escapeHtml(u.tenantName || u.title || 'Mühendis')}</div>

                                </div>

                                <span class="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded">@${escapeHtml(u.username)}</span>

                            </button>

                        `).join('')}

                    </div>

                </div>

            ` : ''}



            <div>

                <label class="block font-bold text-slate-700 mb-1">Kullanıcı Adı</label>

                <input type="text" id="loginUsername" placeholder="Kullanıcı adı"

                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-sky-500 focus:outline-none bg-white">

            </div>



            <div>

                <label class="block font-bold text-slate-700 mb-1">Şifre</label>

                <div class="relative">

                    <input type="password" id="loginPassword" placeholder="••••••••"

                        onkeydown="if(event.key==='Enter') handleLoginSubmit()"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10 text-xs font-semibold focus:border-sky-500 focus:outline-none bg-white">

                    <button type="button" onclick="togglePasswordVisibility('loginPassword', this)"

                        class="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5 text-xs">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                </div>

            </div>



            <div id="loginSyncStatus" class="hidden p-2.5 rounded-xl text-[11px] font-semibold"></div>



            <button type="button" id="loginSubmitBtn" onclick="handleLoginSubmit()"

                class="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">

                <i class="fa-solid fa-right-to-bracket"></i>

                <span>Giriş Yap</span>

            </button>

        </div>

    `;

}



function renderRegisterFormHtml() {

    return `

        <div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Adı Soyadı <span class="text-rose-500">*</span></label>

                <input type="text" id="regFullName" placeholder="Örn: Yusuf Kılıç"

                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 bg-white">

            </div>



            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Meslek / Unvan</label>

                    <select id="regTitle" class="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold bg-white">

                        <option value="Elektrik Mühendisi">Elektrik Mühendisi</option>

                        <option value="Elektrik-Elektronik Mühendisi">Elektrik-Elektronik Mühendisi</option>

                        <option value="Elektrik Teknikeri">Elektrik Teknikeri</option>

                        <option value="Teknik Öğretmen">Teknik Öğretmen</option>

                        <option value="Muayene Uzmanı">Muayene Uzmanı</option>

                    </select>

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Bakanlık Kayıt No</label>

                    <input type="text" id="regMinistry" placeholder="Örn: K2024119876"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

            </div>



            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Diploma No / Mezuniyet</label>

                    <input type="text" id="regDiploma" placeholder="Örn: 249538 / 28.09.2022"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Oda / EMO Sicil No</label>

                    <input type="text" id="regEmo" placeholder="Örn: 64215"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

            </div>



            <div class="pt-1 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Kullanıcı Adı <span class="text-rose-500">*</span></label>

                    <input type="text" id="regUsername" placeholder="Örn: yusuf"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Şifre <span class="text-rose-500">*</span></label>

                    <input type="password" id="regPassword" placeholder="Şifrenizi belirleyin"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white">

                </div>

            </div>



            <button type="button" onclick="handleRegisterSubmit()"

                class="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">

                <i class="fa-solid fa-user-check"></i>

                <span>Hesabı Oluştur ve Giriş Yap</span>

            </button>

        </div>

    `;

}



function selectQuickUser(username) {

    const input = document.getElementById('loginUsername');

    if (input) {

        input.value = username;

        document.getElementById('loginPassword')?.focus();

    }

}



function togglePasswordVisibility(inputId, btn) {

    const el = document.getElementById(inputId);

    if (!el) return;

    if (el.type === 'password') {

        el.type = 'text';

        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

    } else {

        el.type = 'password';

        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';

    }

}



async function handleLoginSubmit() {

    const u = (document.getElementById('loginUsername')?.value || '').trim();

    const p = (document.getElementById('loginPassword')?.value || '').trim();

    if (!u || !p) return showToast('Lütfen kullanıcı adı ve şifre girin', 'warning');



    const btn = document.getElementById('loginSubmitBtn');

    const statusEl = document.getElementById('loginSyncStatus');

    const setStatus = (msg, cls) => {

        if (!statusEl) return;

        statusEl.textContent = msg;

        statusEl.className = `p-2.5 rounded-xl text-[11px] font-semibold ${cls}`;

        statusEl.classList.remove('hidden');

    };



    if (btn) {

        btn.disabled = true;

        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Buluta bağlanılıyor...</span>';

    }

    setStatus('Firma hesabınız doğrulanıyor, cihazlarınız ve iş klasörleriniz alınıyor...', 'bg-sky-50 text-sky-800 border border-sky-200');



    try {

        if (window.CloudAppSync && typeof window.CloudAppSync.loginOnline === 'function') {

            const cloudRes = await window.CloudAppSync.loginOnline(u, p);

            if (cloudRes.success) {

                showToast(`Hoş geldiniz, ${cloudRes.user?.fullName || u}! (${cloudRes.deviceCount} cihaz, ${cloudRes.workOrderCount} iş klasörü)`);

                navigateTo('home');

                return;

            }

            if (cloudRes.authError) {

                setStatus(cloudRes.message || 'Kullanıcı adı veya şifre hatalı!', 'bg-rose-50 text-rose-800 border border-rose-200');

                showToast(cloudRes.message || 'Kullanıcı adı veya şifre hatalı!', 'error');

                return;

            }

        }



        // Yalnızca sunucuya ulaşılamadığında (çevrimdışı) daha önce giriş yapılmış yerel hesaba düş

        const res = AuthManager.login(u, p);

        if (res.success) {

            showToast(`Çevrimdışı giriş yapıldı: ${res.user.fullName}`, 'info');

            navigateTo('home');

        } else {

            const offlineMsg = 'İnternete ulaşılamadı ve bu cihazda kayıtlı çevrimdışı oturum bulunamadı. İlk girişte internet bağlantısı gereklidir.';

            setStatus(offlineMsg, 'bg-amber-50 text-amber-900 border border-amber-200');

            showToast(offlineMsg, 'error');

        }

    } finally {

        if (btn) {

            btn.disabled = false;

            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Giriş Yap ve Cihazları / İşleri Yükle</span>';

        }

    }

}



function handleRegisterSubmit() {

    const fullName = document.getElementById('regFullName')?.value;

    const title = document.getElementById('regTitle')?.value;

    const ministryRegNo = document.getElementById('regMinistry')?.value;

    const diplomaNoDate = document.getElementById('regDiploma')?.value;

    const emoNo = document.getElementById('regEmo')?.value;

    const username = document.getElementById('regUsername')?.value;

    const password = document.getElementById('regPassword')?.value;



    const res = AuthManager.register({

        fullName, title, ministryRegNo, diplomaNoDate, emoNo, username, password

    });



    if (res.success) {

        showToast(`Hesabınız oluşturuldu! Hoş geldiniz, ${res.user.fullName}`);

        navigateTo('home');

    } else {

        showToast(res.message, 'error');

    }

}



// --- KULLANICI PROFİL DÜZENLEME & ÇIKIŞ MODALİ ---

function openUserProfileModal() {

    const user = AuthManager.getCurrentUser();

    if (!user) return renderAuthScreen('login');

    const isManaged = Boolean(user.isCloudManaged);



    openModal(

        '<i class="fa-solid fa-user-gear mr-2 text-amber-500"></i>Yetkili Muayene Personeli Profili',

        `

        <div class="space-y-3 text-xs">

            <div class="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between">

                <div class="flex items-center gap-2.5">

                    <div class="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">

                        <i class="fa-solid fa-user-tie"></i>

                    </div>

                    <div>

                        <div class="font-bold text-sm">${escapeHtml(user.fullName)}</div>

                        <div class="text-[11px] text-slate-300">@${escapeHtml(user.username)} · ${escapeHtml(user.title || 'Mühendis')}</div>

                    </div>

                </div>

                <button type="button" onclick="closeModal(); AuthManager.logout();"

                    class="px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition">

                    <i class="fa-solid fa-power-off"></i>

                    <span>Çıkış Yap</span>

                </button>

            </div>



            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Adı Soyadı</label>

                <input type="text" id="profFullName" value="${escapeHtml(user.fullName || '')}" ${isManaged ? 'readonly' : ''}

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Meslek / Unvan</label>

                    <input type="text" id="profTitle" value="${escapeHtml(user.title || 'Elektrik Mühendisi')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Bakanlık Kayıt No</label>

                    <input type="text" id="profMinistry" value="${escapeHtml(user.ministryRegNo || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Diploma No / Tarih</label>

                    <input type="text" id="profDiploma" value="${escapeHtml(user.diplomaNoDate || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">EMO / Oda Sicil No</label>

                    <input type="text" id="profEmo" value="${escapeHtml(user.emoNo || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

            </div>



            ${isManaged ? '' : `
            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Şifre Değiştir (İsteğe Bağlı)</label>

                <input type="password" id="profPassword" value="${escapeHtml(user.password || '')}"

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

            </div>
            `}

        </div>

        `,

        `

        <button onclick="closeModal()" class="px-3 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">Kapat</button>

        ${isManaged ? '' : `
        <button onclick="saveUserProfileSubmit('${user.id}')" class="px-4 py-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-lg active:scale-95 shadow-sm">

            <i class="fa-solid fa-floppy-disk mr-1"></i>Bilgileri Kaydet

        </button>
        `}

        `

    );

}



function saveUserProfileSubmit(userId) {

    const fullName = document.getElementById('profFullName')?.value;

    const title = document.getElementById('profTitle')?.value;

    const ministryRegNo = document.getElementById('profMinistry')?.value;

    const diplomaNoDate = document.getElementById('profDiploma')?.value;

    const emoNo = document.getElementById('profEmo')?.value;

    const password = document.getElementById('profPassword')?.value;



    const res = AuthManager.updateProfile(userId, {

        fullName, title, ministryRegNo, diplomaNoDate, emoNo, password

    });



    if (res.success) {

        showToast('Profil ve rapor onay bilgileriniz güncellendi!');

        closeModal();

        if (AppState.currentRoute === 'inspection-complete') {

            paintInspectionEditorUI();

        }

    } else {

        showToast(res.message, 'error');

    }

}



window.AuthManager = AuthManager;

window.renderAuthScreen = renderAuthScreen;

window.handleLoginSubmit = handleLoginSubmit;

window.handleRegisterSubmit = handleRegisterSubmit;

window.selectQuickUser = selectQuickUser;

window.togglePasswordVisibility = togglePasswordVisibility;

window.openUserProfileModal = openUserProfileModal;

window.saveUserProfileSubmit = saveUserProfileSubmit;

window.updateHeaderUserWidget = updateHeaderUserWidget;



// ============================================================================

// COMPANY & REPORT BRANDING UI MODAL HANDLERS

// ============================================================================

function openCompanySettingsModal() {

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if (curUser && curUser.isCloudManaged) {

        showToast('Firma ve rapor antet bilgileri yalnızca firma yöneticisi web panelinden değiştirilebilir.', 'warning');

        return;

    }

    const s = CompanySettingsManager.getSettings();

    const currentLogo = CompanySettingsManager.getLogoSrc();

    const currentTurkak = CompanySettingsManager.getTurkakLogoSrc();

    

    window._pendingBrandLogos = {

        companyLogo: s.customCompanyLogo,

        turkakLogo: s.customTurkakLogo,

        clearedCompanyLogo: false,

        clearedTurkakLogo: false

    };



    openModal(

        '<i class="fa-solid fa-building-shield mr-2 text-sky-400"></i>Şirket, Logo & Rapor Şablon Ayarları',

        `

        <div class="space-y-4 text-xs">

            <!-- LOGO AYARLARI -->

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">

                <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">

                    <i class="fa-solid fa-image text-amber-500"></i>

                    <span>Şirket Kurumsal Logosu</span>

                </div>

                

                <div class="flex items-center gap-4">

                    <div class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img id="previewCompanyLogo" src="${currentLogo}" alt="Logo" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="space-y-1.5 flex-1 min-w-0">

                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg font-bold text-[11px] cursor-pointer transition shadow-xs">

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            <span>Yeni Logo Yükle (PNG/JPG)</span>

                            <input type="file" accept="image/*" class="hidden" onchange="handleBrandLogoSelected(this, 'company')">

                        </label>

                        <button type="button" onclick="revertBrandLogo('company')" class="block text-[11px] text-slate-500 hover:text-rose-600 font-semibold underline">

                            Varsayılan Logoya Dön

                        </button>

                    </div>

                </div>

            </div>



            <!-- FİRMA RESMİ BİLGİLERİ -->

            <div class="space-y-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Firma Tam Ticari Unvanı (Rapor Başlığı) *</label>

                    <input type="text" id="cfgCompanyFullName" value="${escapeHtml(s.companyFullName)}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white">

                </div>



                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Firma Kısa Adı (Üst Başlık)</label>

                        <input type="text" id="cfgCompanyShortName" value="${escapeHtml(s.companyShortName)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Adres / Şehir</label>

                        <input type="text" id="cfgCompanyAddress" value="${escapeHtml(s.companyAddress)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Telefon / Faks</label>

                        <input type="text" id="cfgCompanyPhone" value="${escapeHtml(s.companyPhone)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">E-Posta & Web</label>

                        <input type="text" id="cfgCompanyWeb" value="${escapeHtml(s.companyWeb)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                </div>

            </div>



            <!-- AKREDİTASYON (TÜRKAK VB.) AYARLARI -->

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">

                <div class="flex items-center justify-between">

                    <label class="font-bold text-slate-800 text-xs flex items-center gap-2 cursor-pointer">

                        <input type="checkbox" id="cfgShowTurkak" ${s.showTurkakLogo ? 'checked' : ''} class="w-4 h-4 accent-sky-600 rounded">

                        <span>Raporda Akreditasyon Logosu Göster</span>

                    </label>

                </div>



                <div class="flex items-center gap-4 pt-1">

                    <div class="w-16 h-20 rounded-xl border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img id="previewTurkakLogo" src="${currentTurkak}" alt="TÜRKAK" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="space-y-1.5 flex-1 min-w-0">

                        <label class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 rounded-lg font-bold text-[10px] cursor-pointer transition">

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            <span>Özel Akreditasyon Logosu</span>

                            <input type="file" accept="image/*" class="hidden" onchange="handleBrandLogoSelected(this, 'turkak')">

                        </label>

                        <button type="button" onclick="revertBrandLogo('turkak')" class="block text-[10px] text-slate-500 hover:text-rose-600 underline">

                            Varsayılan TÜRKAK Logosuna Dön

                        </button>

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2 pt-1">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Akreditasyon No</label>

                        <input type="text" id="cfgAccreditationNo" value="${escapeHtml(s.accreditationNo)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Standart Kodu</label>

                        <input type="text" id="cfgAccreditationStandard" value="${escapeHtml(s.accreditationStandard)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                </div>

            </div>



            <!-- RAPOR KODLARI VE DİPNOT FERAGATNAME -->

            <div class="space-y-2.5">

                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Rapor No Ön Eki</label>

                        <input type="text" id="cfgReportNoPrefix" value="${escapeHtml(s.reportNoPrefix)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white" placeholder="Örn: TKM-">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Form Revizyon Bilgisi</label>

                        <input type="text" id="cfgDefaultRevision" value="${escapeHtml(s.defaultRevisionInfo)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                </div>



                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Rapor Altı Yasal Uyarı (Feragatname Metni)</label>

                    <textarea id="cfgFooterDisclaimer" rows="3"

                        class="w-full border border-slate-300 rounded-lg p-2 text-slate-800 text-[11px] leading-relaxed bg-white focus:outline-none focus:border-sky-500">${escapeHtml(s.footerDisclaimer)}</textarea>

                    <div class="text-[10px] text-slate-400 mt-0.5"><code>{COMPANY_NAME}</code> = Şirket adı</div>

                </div>

            </div>

        </div>

        `,

        `

        <button type="button" onclick="resetCompanySettingsSubmit()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-lg transition mr-auto">

            <i class="fa-solid fa-rotate-left mr-1"></i>Varsayılana Sıfırla

        </button>

        <button type="button" onclick="closeModal()" class="px-3.5 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">İptal</button>

        <button type="button" onclick="saveCompanySettingsSubmit()" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition">

            <i class="fa-solid fa-floppy-disk mr-1"></i>Ayarları Kaydet

        </button>

        `

    );

}



function handleBrandLogoSelected(fileInput, type) {

    const file = fileInput.files && fileInput.files[0];

    if (!file) return;



    compressLogoImage(file, 340, function(dataUrl) {

        if (!window._pendingBrandLogos) window._pendingBrandLogos = {};

        if (type === 'company') {

            window._pendingBrandLogos.companyLogo = dataUrl;

            window._pendingBrandLogos.clearedCompanyLogo = false;

            const preview = document.getElementById('previewCompanyLogo');

            if (preview) preview.src = dataUrl;

            showToast('Şirket logosu seçildi');

        } else if (type === 'turkak') {

            window._pendingBrandLogos.turkakLogo = dataUrl;

            window._pendingBrandLogos.clearedTurkakLogo = false;

            const preview = document.getElementById('previewTurkakLogo');

            if (preview) preview.src = dataUrl;

            showToast('Akreditasyon logosu seçildi');

        }

    });

}



function revertBrandLogo(type) {

    if (!window._pendingBrandLogos) window._pendingBrandLogos = {};

    if (type === 'company') {

        window._pendingBrandLogos.companyLogo = null;

        window._pendingBrandLogos.clearedCompanyLogo = true;

        const preview = document.getElementById('previewCompanyLogo');

        if (preview) preview.src = 'assets/tekkomer_logo.png';

        showToast('Varsayılan şirket logosu ayarlandı');

    } else if (type === 'turkak') {

        window._pendingBrandLogos.turkakLogo = null;

        window._pendingBrandLogos.clearedTurkakLogo = true;

        const preview = document.getElementById('previewTurkakLogo');

        if (preview) preview.src = 'assets/turkak_logo.jpg';

        showToast('Varsayılan TÜRKAK logosu ayarlandı');

    }

}



function saveCompanySettingsSubmit() {

    const nameEl = document.getElementById('cfgCompanyFullName');

    const shortEl = document.getElementById('cfgCompanyShortName');

    const addrEl = document.getElementById('cfgCompanyAddress');

    const phoneEl = document.getElementById('cfgCompanyPhone');

    const webEl = document.getElementById('cfgCompanyWeb');

    const showTurkakEl = document.getElementById('cfgShowTurkak');

    const accNoEl = document.getElementById('cfgAccreditationNo');

    const accStdEl = document.getElementById('cfgAccreditationStandard');

    const repPrefixEl = document.getElementById('cfgReportNoPrefix');

    const revInfoEl = document.getElementById('cfgDefaultRevision');

    const discEl = document.getElementById('cfgFooterDisclaimer');



    const updateObj = {

        companyFullName: (nameEl ? nameEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyFullName,

        companyShortName: (shortEl ? shortEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyShortName,

        companyAddress: (addrEl ? addrEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyAddress,

        companyPhone: (phoneEl ? phoneEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyPhone,

        companyWeb: (webEl ? webEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyWeb,

        showTurkakLogo: showTurkakEl ? showTurkakEl.checked : true,

        accreditationNo: (accNoEl ? accNoEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.accreditationNo,

        accreditationStandard: (accStdEl ? accStdEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.accreditationStandard,

        reportNoPrefix: (repPrefixEl ? repPrefixEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.reportNoPrefix,

        defaultRevisionInfo: (revInfoEl ? revInfoEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.defaultRevisionInfo,

        footerDisclaimer: (discEl ? discEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.footerDisclaimer

    };



    if (window._pendingBrandLogos) {

        if (window._pendingBrandLogos.clearedCompanyLogo) {

            updateObj.customCompanyLogo = null;

        } else if (window._pendingBrandLogos.companyLogo) {

            updateObj.customCompanyLogo = window._pendingBrandLogos.companyLogo;

        }



        if (window._pendingBrandLogos.clearedTurkakLogo) {

            updateObj.customTurkakLogo = null;

        } else if (window._pendingBrandLogos.turkakLogo) {

            updateObj.customTurkakLogo = window._pendingBrandLogos.turkakLogo;

        }

    }



    const res = CompanySettingsManager.saveSettings(updateObj);

    if (res.success) {

        closeModal();

        showToast('Şirket ve rapor ayarları güncellendi!');

        if (AppState.currentRoute === 'home') {

            renderHome();

        } else if (AppState.currentRoute === 'settings' && typeof renderSettingsPage === 'function') {

            renderSettingsPage();

        }

    } else {

        showToast(res.message, 'error');

    }

}



function resetCompanySettingsSubmit() {

    if (!confirm('Tüm şirket, logo ve rapor kodlarını varsayılan ayarlara sıfırlamak istediğinize emin misiniz?')) return;

    CompanySettingsManager.resetToDefault();

    closeModal();

    showToast('Tüm ayarlar varsayılana sıfırlandı.');

    if (AppState.currentRoute === 'home') {

        renderHome();

    } else if (AppState.currentRoute === 'settings' && typeof renderSettingsPage === 'function') {

        renderSettingsPage();

    }

}



window.CompanySettingsManager = CompanySettingsManager;

window.compressLogoImage = compressLogoImage;

window.openCompanySettingsModal = openCompanySettingsModal;

window.handleBrandLogoSelected = handleBrandLogoSelected;

window.revertBrandLogo = revertBrandLogo;

window.saveCompanySettingsSubmit = saveCompanySettingsSubmit;

window.resetCompanySettingsSubmit = resetCompanySettingsSubmit;

window.LinyeMemoryManager = LinyeMemoryManager;

window.COMMON_LINYE_SUGGESTIONS = COMMON_LINYE_SUGGESTIONS;

window.renderLinyeDropdownItems = renderLinyeDropdownItems;

window.handleLinyeInputFocus = handleLinyeInputFocus;

window.handleLinyeInputType = handleLinyeInputType;

window.handleLinyeInputBlur = handleLinyeInputBlur;

window.selectLinyeSuggestion = selectLinyeSuggestion;

window.updateGroundingNetworkType = updateGroundingNetworkType;

window.isGroundingPointExpanded = isGroundingPointExpanded;

window.toggleGroundingPointAccordion = toggleGroundingPointAccordion;

window.setAllGroundingPointsExpanded = setAllGroundingPointsExpanded;

window.setGroundingPointBreakerPreset = setGroundingPointBreakerPreset;

window.undoDeleteGroundingPointRow = undoDeleteGroundingPointRow;





// ============================================================================

// MERKEZİ AYARLAR SEKME SAYFASI (Çevrimdışı Çoklu Şirket, Profil, Rapor Kodları & Yedek)

// ============================================================================

async function renderSettingsPage() {

    const container = document.getElementById('pageContent');

    if (!container) return;

    container.scrollTop = 0;



    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';



    OfflineDB.init();

    const db = OfflineDB.state || {};

    const workOrderCount = (db.workOrders || []).length;

    const inspectionCount = (db.inspections || []).length;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-2.5 pb-8">

            <!-- 1. ÜST BAŞLIK -->

            <div class="card-craft-white p-2.5 flex items-center justify-between gap-2">

                <div class="min-w-0">

                    <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate flex items-center gap-2">

                        <i class="fa-solid fa-sliders text-sky-600"></i>

                        <span>Uygulama & Şirket Ayarları</span>

                    </h1>

                </div>

                <span class="text-[10px] ${isManaged ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-sky-50 text-sky-700 border-sky-200'} border px-2 py-0.5 rounded-full font-bold shrink-0">

                    ${isManaged ? 'Bulut + Çevrimdışı' : '%100 Çevrimdışı'}

                </span>

            </div>



            <!-- 2. MUAYENE PERSONELİ & PROFİL KARTI -->

            <div class="card-craft-dark text-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">

                    <div class="text-xs font-bold text-amber-400 flex items-center gap-1.5">

                        <i class="fa-solid fa-user-shield"></i>

                        <span>Muayene Personeli & E-İmza Profili</span>

                    </div>

                    <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">

                        ${isManaged && curUser.tenantName ? escapeHtml(curUser.tenantName) : 'Aktif Personel'}

                    </span>

                </div>



                <div class="flex items-center gap-3">

                    <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-sm">

                        <i class="fa-solid fa-user-tie"></i>

                    </div>

                    <div class="flex-1 min-w-0">

                        <div class="font-bold text-base text-white truncate">

                            ${curUser ? escapeHtml(curUser.fullName) : 'Muayene Personeli Tanımsız'}

                        </div>

                        <div class="text-xs text-slate-300 mt-0.5 truncate">

                            ${curUser ? `${escapeHtml(curUser.title || 'Elektrik Mühendisi')} · Oda Sicil: <span class="text-amber-300 font-mono font-bold">${escapeHtml(curUser.emoNo || '-')}</span>` : ''}

                        </div>

                        ${curUser && curUser.ministryRegNo ? `
                        <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                            Bakanlık Sicil: ${escapeHtml(curUser.ministryRegNo)}
                        </div>
                        ` : ''}

                    </div>

                </div>



                ${isManaged ? `
                    <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Buluttan Senkronize Et</span>
                    </button>
                ` : ''}

                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">

                    <button onclick="openUserProfileModal()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-slate-600/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs">

                        <i class="fa-solid fa-id-card text-amber-400"></i>

                        <span>${isManaged ? 'Profil Bilgilerim' : 'Profilimi Düzenle'}</span>

                    </button>

                    <button onclick="AuthManager.logout()" class="w-full py-2.5 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm">

                        <i class="fa-solid fa-arrow-right-from-bracket"></i>

                        <span>Kullanıcı Değiştir</span>

                    </button>

                </div>

            </div>



            <!-- 2B. KİŞİSEL ÖLÇÜM CİHAZLARI (ÜZERİME ALINANLAR) -->

            ${typeof MeasuringDevicesManager !== 'undefined' ? MeasuringDevicesManager.renderSettingsCardHtml() : ''}



            <!-- 3. ŞİRKET & KURUMSAL LOGO YÖNETİMİ (ÇOKLU ŞİRKET / WHITE-LABEL) -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-building text-sky-600"></i>

                        <span>Şirket & Marka Bilgileri</span>

                    </div>

                </div>



                <div class="flex items-start gap-3.5 bg-slate-50 border border-slate-200/80 p-3 rounded-xl">

                    <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img src="${logoSrc}" alt="Şirket Logosu" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="flex-1 min-w-0">

                        <div class="font-bold text-xs text-slate-900 leading-snug truncate">

                            ${escapeHtml(branding.companyFullName)}

                        </div>

                        <div class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">

                            <span>Kısa Ad: <strong class="text-slate-700">${escapeHtml(branding.companyShortName)}</strong></span>

                            ${branding.showTurkakLogo ? '<span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]"><i class="fa-solid fa-certificate text-[10px]"></i> Akredite</span>' : '<span class="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">Özel Şablon</span>'}

                        </div>

                    </div>

                </div>



                ${isManaged ? `
                    <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center">
                        Firma bilgileri yönetici panelinden gelir.
                    </div>
                ` : `
                    <button onclick="openCompanySettingsModal()" class="w-full py-2.5 btn-craft-primary active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition">

                        <i class="fa-solid fa-pen-nib"></i>

                        <span>Şirket Adı, Logo ve Akreditasyonu Düzenle</span>

                    </button>
                `}

            </div>



            <!-- 4. RAPOR KODLARI -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-file-invoice text-emerald-600"></i>

                        <span>Rapor Kodları</span>

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2 text-xs">

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-[10px] text-slate-500 font-bold">Rapor No Ön Eki</div>

                        <div class="font-mono font-bold text-slate-800 text-sm mt-0.5">${escapeHtml(branding.reportNoPrefix || 'ENL-')}</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-[10px] text-slate-500 font-bold">Revizyon Formatı</div>

                        <div class="font-mono font-bold text-slate-800 text-xs mt-0.5 truncate">${escapeHtml(branding.defaultRevisionInfo || 'REV.00')}</div>

                    </div>

                </div>

            </div>



            <!-- 4B. TARİH, SAAT & GEÇERLİLİK SÜRESİ AYARLARI -->

            ${(() => {
                const dtPrefs = (typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.get() : { fixedStartTime: '', fixedEndTime: '', validityMonths: { '2201': 12, '2202': 12, '2205': 12, 'default': 12 } };
                const tpls = Array.isArray(window.ENLAB_REPORT_TEMPLATES) ? window.ENLAB_REPORT_TEMPLATES : [
                    { id: '2201', name: 'ELEKTRİK İÇ TESİSATI' },
                    { id: '2202', name: 'ALÇAK GERİLİM TOPRAKLAMA' },
                    { id: '2205', name: 'JENERATÖR' }
                ];
                return `
            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-clock text-sky-600"></i>

                        <span>Tarih, Saat &amp; Geçerlilik Süresi</span>

                    </div>

                    <span id="settingsDateTimeSavedBadge" class="hidden text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Kaydedildi</span>

                </div>

                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">

                    <div class="flex items-center justify-between gap-2">

                        <span class="font-bold text-slate-700">Sabit Kontrol Saati</span>

                        <button type="button" onclick="clearFixedReportTimesFromSettings()" class="text-[11px] font-bold text-sky-700 hover:underline">Sıfırla (Anlık Saat)</button>

                    </div>

                    <div class="grid grid-cols-2 gap-2">

                        <div>

                            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Sabit Başlangıç Saati</label>

                            <input type="time" id="settingsFixedStartTime" value="${escapeHtml(dtPrefs.fixedStartTime || '')}"

                                onchange="saveReportDateTimePrefsFromSettings()"

                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white">

                        </div>

                        <div>

                            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Sabit Bitiş Saati</label>

                            <input type="time" id="settingsFixedEndTime" value="${escapeHtml(dtPrefs.fixedEndTime || '')}"

                                onchange="saveReportDateTimePrefsFromSettings()"

                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white">

                        </div>

                    </div>

                </div>

                <div class="space-y-1.5 text-xs">

                    <div class="font-bold text-slate-700">Rapor Geçerlilik Süresi (Ay)</div>

                    <div class="grid grid-cols-1 gap-1.5">

                        ${tpls.map(t => {
                            const tid = String(t.id);
                            const label = (typeof getCleanTemplateTypeLabel === 'function') ? getCleanTemplateTypeLabel(tid, t.code) : (t.name || tid);
                            const val = dtPrefs.validityMonths[tid] ?? dtPrefs.validityMonths['default'] ?? 12;
                            return `
                            <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">

                                <span class="font-semibold text-slate-800 truncate">${escapeHtml(label)}</span>

                                <div class="flex items-center gap-1.5 shrink-0">

                                    <input type="number" min="1" max="120" value="${escapeHtml(String(val))}"

                                        onchange="saveReportValidityMonthFromSettings('${escapeForJs(tid)}', this.value)"

                                        class="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white">

                                    <span class="text-[11px] font-bold text-slate-500">Ay</span>

                                </div>

                            </div>`;
                        }).join('')}

                    </div>

                </div>

            </div>
                `;
            })()}



            <!-- 4B. BULUT MÜŞTERİ PORTALI (OTOMATİK GÖNDERİM & ŞİRKET ÖN EKİ) -->

            ${(() => {
                const pCfg = (typeof CloudPortal !== 'undefined' && CloudPortal.getConfig) ? CloudPortal.getConfig() : { portalUrl: 'https://hizli-rapor-portal.vercel.app', customPortalUrl: '', isCustomUrl: false, adminKey: '', defaultPin: '' };
                const activeComp = (typeof CloudPortal !== 'undefined' && CloudPortal.getActiveCompanyProfile) ? CloudPortal.getActiveCompanyProfile() : { companyName: branding.companyShortName || 'Hızlı Rapor', companySlug: 'hizli-rapor', isCustomized: false };
                const activeHost = (pCfg.portalUrl || 'https://hizli-rapor-portal.vercel.app').replace(/^https?:\/\//i, '');
                return `
            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-globe text-indigo-600"></i>

                        <span>Bulut Müşteri Portalı</span>

                    </div>

                    <code id="settingsPortalActiveHost" class="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${escapeHtml(activeHost)}</code>

                </div>

                <div class="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2">
                    <span>Aktif Şirket: <strong class="text-slate-900">${escapeHtml(activeComp.companyName)}</strong></span>
                    <span class="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">/p/${escapeHtml(activeComp.companySlug)}-...</span>
                    ${!activeComp.isCustomized && !isManaged ? `
                        <button type="button" onclick="openCompanySettingsModal()" class="text-[10px] font-bold text-indigo-700 underline shrink-0">Şirket Adını Düzenle</button>
                    ` : ''}
                </div>

                <div id="settingsPortalStatus" class="hidden"></div>

                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" onclick="CloudPortal.testPortalFromSettingsPage()" class="py-2 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
                        <i class="fa-solid fa-plug-circle-check"></i>
                        <span>Bağlantıyı Test Et</span>
                    </button>
                    <button type="button" onclick="CloudPortal.openPortalSiteFromSettings()" class="py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        <span>Portal Sitesini Aç</span>
                    </button>
                </div>

                <div class="pt-1 border-t border-slate-100">
                    <button type="button" onclick="document.getElementById('settingsPortalAdvancedWrap')?.classList.toggle('hidden')" class="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[11px] flex items-center justify-between border border-slate-200/80 transition">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-sliders text-slate-400"></i> Gelişmiş Ayarlar</span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                    </button>

                    <div id="settingsPortalAdvancedWrap" class="hidden mt-2 space-y-2 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Özel Alan Adı / Sunucu URL</label>
                            <input type="url" id="settingsPortalUrl" value="${escapeHtml(pCfg.customPortalUrl || '')}"
                                placeholder="https://hizli-rapor-portal.vercel.app (varsayılan)"
                                class="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Yönetici Anahtarı</label>
                            <div class="flex items-center gap-1.5">
                                <input type="password" id="settingsPortalKey" value="${escapeHtml(pCfg.adminKey || '')}"
                                    placeholder="Varsayılan bulutta boş bırakın"
                                    class="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                                <button type="button" onclick="const el=document.getElementById('settingsPortalKey'); if(el) el.type = el.type==='password' ? 'text' : 'password';"
                                    class="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs" title="Göster / Gizle">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Varsayılan Müşteri Klasör PIN</label>
                            <input type="text" id="settingsPortalPin" value="${escapeHtml(pCfg.defaultPin || '')}"
                                placeholder="Örn: 4829"
                                class="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                        </div>

                        <button type="button" onclick="CloudPortal.savePortalSettingsFromPage()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition">
                            <i class="fa-solid fa-floppy-disk"></i>
                            <span>Gelişmiş Ayarları Kaydet</span>
                        </button>
                    </div>
                </div>

            </div>
                `;
            })()}



            <!-- 5. VERİ YEDEKLEME VE KURTARMA MERKEZİ -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-database text-amber-500"></i>

                        <span>Veri Yedekleme ve Kurtarma</span>

                    </div>

                </div>



                <!-- Sayaçlar -->

                <div class="grid grid-cols-2 gap-2 text-center">

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-slate-800">${workOrderCount}</div>

                        <div class="text-xs font-bold text-slate-700">İş Klasörü</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-sky-700">${inspectionCount}</div>

                        <div class="text-xs font-bold text-slate-700">Rapor</div>

                    </div>

                </div>



                <!-- Aksiyonlar -->

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">

                    <button onclick="exportEmergencyBackup()" class="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition">

                        <i class="fa-solid fa-file-arrow-down"></i>

                        <span>Tam Yedek İndir (JSON)</span>

                    </button>

                    <label class="py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">

                        <i class="fa-solid fa-file-arrow-up text-sky-400"></i>

                        <span>Yedekten Geri Yükle</span>

                        <input type="file" accept=".json,application/json" class="hidden" onchange="importBackupFromFile(this)">

                    </label>

                </div>

            </div>

        </div>

    `;



    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    updateHeaderUserWidget();

}

window.renderSettingsPage = renderSettingsPage;

function flashSettingsDateTimeSaved() {
    const b = document.getElementById('settingsDateTimeSavedBadge');
    if (b) {
        b.classList.remove('hidden');
        clearTimeout(window._dtSavedTimer);
        window._dtSavedTimer = setTimeout(() => b.classList.add('hidden'), 1800);
    }
}

function saveReportDateTimePrefsFromSettings() {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    const st = document.getElementById('settingsFixedStartTime')?.value || '';
    const et = document.getElementById('settingsFixedEndTime')?.value || '';
    ReportDateTimePrefs.save({ fixedStartTime: st, fixedEndTime: et });
    flashSettingsDateTimeSaved();
}

function clearFixedReportTimesFromSettings() {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    ReportDateTimePrefs.clearFixedTimes();
    const sEl = document.getElementById('settingsFixedStartTime');
    const eEl = document.getElementById('settingsFixedEndTime');
    if (sEl) sEl.value = '';
    if (eEl) eEl.value = '';
    flashSettingsDateTimeSaved();
    showToast('Sabit saat sıfırlandı, anlık giriş saati kullanılacak.');
}

function saveReportValidityMonthFromSettings(templateId, months) {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    ReportDateTimePrefs.setValidityMonth(templateId, months);
    flashSettingsDateTimeSaved();
}

window.saveReportDateTimePrefsFromSettings = saveReportDateTimePrefsFromSettings;
window.clearFixedReportTimesFromSettings = clearFixedReportTimesFromSettings;
window.saveReportValidityMonthFromSettings = saveReportValidityMonthFromSettings;

window.promptSecurityPasswordConfirmation = promptSecurityPasswordConfirmation;

window.executeSecurityPasswordCheck = executeSecurityPasswordCheck;

