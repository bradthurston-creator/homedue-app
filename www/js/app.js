// DocYourHome — Main App
// Navigation, rendering, backup, purchase gating.
// Visual layer rebuilt: custom icon system, Home Health Score, premium task cards, dark mode.

const API_URL = 'http://129.121.78.85:5052';

const App = {
    currentScreen: null,
    recoveryKey: null,
    hasCloud: false,
    theme: 'light',
    _currentTaskId: null,
    _detailReturnScreen: 'dashboard',
    _currentNotes: '',
    _currentCost: 0,
    _currentPhoto: null,
    _currentContractor: null,

    async init() {
        this._initTheme();
        await db.init();
        this.recoveryKey = localStorage.getItem('homedue_key');
        if (!this.recoveryKey) {
            this.recoveryKey = this._generateKey();
            localStorage.setItem('homedue_key', this.recoveryKey);
        }
        this.hasCloud = localStorage.getItem('homedue_cloud') === 'true';
        const setupDone = localStorage.getItem('homedue_setup_done');
        if (setupDone) {
            this.showScreen('dashboard');
        } else {
            this._renderOnboarding();
        }
    },

    // ========================
    //  THEME
    // ========================
    _initTheme() {
        const saved = localStorage.getItem('homedue_theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme = saved || (prefersDark ? 'dark' : 'light');
        this._applyTheme();
    },

    _applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('homedue_theme', this.theme);
        this._applyTheme();
        if (this.currentScreen === 'settings') this._renderSettings();
    },

    _generateKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let key = '';
        for (let i = 0; i < 12; i++) {
            key += chars[Math.floor(Math.random() * chars.length)];
            if (i % 4 === 3 && i < 11) key += '-';
        }
        return key;
    },

    // ========================
    //  ONBOARDING
    // ========================
    async _renderOnboarding() {
        const cats = await db.getCategories();
        document.querySelectorAll('.app-shell').forEach(s => s.style.display = 'none');
        const target = document.getElementById('screen-dashboard');
        target.style.display = 'flex';
        const c = document.getElementById('dashboard-content');

        let html = `
            <div class="onboard-hero">
                <div class="onboard-hero__icon">${Icon('house2', {size: 34})}</div>
                <h2 class="onboard-hero__title">Welcome to DocYourHome</h2>
                <p class="onboard-hero__sub">Tap a category to pick individual tasks you want to track. We'll remind you when they're due.</p>
            </div>
            <div class="onboard-counter" id="onboard-counter">0 tasks selected</div>
            <div id="onboard-category-list" class="category-grid">`;
        cats.forEach(cat => {
            html += `
                <div class="category-card" data-cat="${cat.category}" onclick="App._showOnboardCategoryTasks('${cat.category}')">
                    <div class="category-card__icon">${CategoryIcon(cat.category, {size: 22})}</div>
                    <div class="category-card__name">${cat.category}</div>
                    <div class="category-card__count" id="onboard-count-${cat.category.replace(/\s/g, '-')}">${cat.count} tasks</div>
                </div>`;
        });
        html += `</div>
            <div id="onboard-task-area"></div>
            <div class="onboard-footer">
                <button class="btn btn--primary btn--full" onclick="App._finishSetup()">Get Started</button>
                <p class="onboard-footer__hint">Only tasks you toggle on will appear on your dashboard.</p>
            </div>`;
        c.innerHTML = html;
        this._onboardSelected = new Set();
    },

    async _showOnboardCategoryTasks(category) {
        const tasks = await db.getTasksByCategory(category);
        const area = document.getElementById('onboard-task-area');
        const icon = CategoryIcon(category, {size: 22});
        let html = `
            <div style="display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) 0;">
                <button class="btn btn--ghost btn--sm" onclick="document.getElementById('onboard-task-area').innerHTML=''">${Icon('chevronDown', {size: 18})} Back</button>
                <span style="font-weight:700;font-size:var(--t-base);">${category}</span>
            </div>
            <div class="task-list">`;
        tasks.forEach(t => {
            html += `
                <div class="task-card" style="cursor:default;">
                    <div class="task-card__icon">${icon}</div>
                    <div class="task-card__body">
                        <div class="task-card__title">${t.name}</div>
                        <div class="task-card__meta-row"><span>Every ${t.freqDays || '—'} days · ${t.season || 'Year-round'}</span></div>
                    </div>
                    <label class="toggle" onclick="event.stopPropagation(); App._toggleOnboardTask('${t.id}')">
                        <input class="toggle__input" type="checkbox" id="otask-${t.id}">
                        <span class="toggle__track"><span class="toggle__thumb"></span></span>
                    </label>
                </div>`;
        });
        html += '</div>';
        area.innerHTML = html;
        area.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _toggleOnboardTask(taskId) {
        const cb = document.getElementById(`otask-${taskId}`);
        if (!cb) return;
        const checked = !cb.checked;
        cb.checked = checked;
        if (checked) this._onboardSelected.add(taskId);
        else this._onboardSelected.delete(taskId);
        document.getElementById('onboard-counter').textContent =
            `${this._onboardSelected.size} task${this._onboardSelected.size !== 1 ? 's' : ''} selected`;
    },

    async _finishSetup() {
        if (this._onboardSelected.size === 0) {
            this.showToast('Toggle on at least one task', 'info');
            return;
        }
        const allTasks = await Promise.all(
            (await db.getCategories()).map(c => db.getTasksByCategory(c.category))
        );
        const flat = allTasks.flat();
        this._onboardSelected.forEach(id => {
            const task = flat.find(t => t.id === id);
            if (!task) return;
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + Math.min(task.freqDays || 14, 14));
            db.store.userTasks.push({
                task_id: id, active: 1, last_completed: null,
                next_due: nextDue.toISOString().split('T')[0]
            });
        });
        db._saveStore();
        localStorage.setItem('homedue_setup_done', 'true');
        this.showToast('Setup complete', 'done');
        this.showScreen('dashboard');
    },

    // ========================
    //  PURCHASE GATING
    // ========================
    async purchaseApp() {
        localStorage.setItem('homedue_purchased', 'true');
        this.showToast('DocYourHome unlocked', 'done');
        this.showScreen('settings');
    },

    async purchaseCloud() {
        localStorage.setItem('homedue_cloud', 'true');
        this.hasCloud = true;
        this.showToast('Cloud backup activated', 'done');
        this.showScreen('settings');
    },

    isPurchased() {
        return localStorage.getItem('homedue_purchased') === 'true';
    },

    // ========================
    //  CLOUD BACKUP
    // ========================
    async backupNow() {
        if (!this.hasCloud) { this.showToast('Cloud backup requires DocYourHome Cloud'); return; }
        this.showToast('Backing up…');
        try {
            const data = await db.exportBackup();
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('file', blob, 'backup.json');
            await fetch(`${API_URL}/backup/${this.recoveryKey}`, { method: 'POST', body: formData });
            localStorage.setItem('homedue_last_backup', Date.now().toString());
            this.showToast('Backup saved to cloud', 'done');
            if (this.currentScreen === 'settings') this._renderSettings();
        } catch (e) {
            this.showToast('Backup failed — check connection');
        }
    },

    async restoreBackup() {
        if (!this.hasCloud) { this.showToast('Cloud backup requires DocYourHome Cloud'); return; }
        this.showToast('Restoring…');
        try {
            const resp = await fetch(`${API_URL}/backup/${this.recoveryKey}`);
            if (resp.status === 404) { this.showToast('No backup found for this key'); return; }
            const data = await resp.json();
            await db.importBackup(data);
            this.showToast('Restored from cloud', 'done');
            this.showScreen('dashboard');
        } catch (e) {
            this.showToast('Restore failed — check connection');
        }
    },

    // ========================
    //  NAVIGATION
    // ========================
    async showScreen(screen, params = {}) {
        this.currentScreen = screen;
        document.querySelectorAll('.app-shell').forEach(s => s.style.display = 'none');
        const target = document.getElementById(`screen-${screen}`);
        if (target) target.style.display = 'flex';

        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('tab-item--active'));
        const navMap = {
            'dashboard': '#nav-dashboard', 'categories': '#nav-categories',
            'contractors': '#nav-contractors', 'records': '#nav-records', 'settings': '#nav-settings'
        };
        if (navMap[screen]) {
            document.querySelectorAll(navMap[screen]).forEach(b => b.classList.add('tab-item--active'));
        } else if (screen === 'category') {
            document.querySelectorAll('#nav-categories').forEach(b => b.classList.add('tab-item--active'));
        }

        switch (screen) {
            case 'dashboard': await this._renderDashboard(); break;
            case 'categories': await this._renderCategories(); break;
            case 'category': await this._renderCategoryTasks(params.category); break;
            case 'settings': await this._renderSettings(); break;
            case 'contractors': await this._renderContractors(); break;
            case 'records': await this._renderRecords(); break;
            case 'taskdetail': await this._renderTaskDetail(params.taskId); break;
            case 'equipmentdetail': await this._renderEquipmentDetail(params.equipId); break;
        }
    },

    // ========================
    //  HOME HEALTH SCORE
    // ========================
    _computeHealthScore(data, stats) {
        // Score starts at 100, docked for overdue/soon items, boosted by completion history.
        let score = 100;
        const overduePenalty = Math.min(data.overdue.length * 8, 55);
        const soonPenalty = Math.min(data.dueSoon.length * 2, 15);
        score -= overduePenalty;
        score -= soonPenalty;
        const untracked = stats.active === 0;
        if (untracked) score = 70; // Nothing tracked yet — neutral, not a false "perfect"
        score = Math.max(15, Math.min(100, Math.round(score)));
        let label, tone;
        if (score >= 90) { label = 'Excellent'; tone = 'done'; }
        else if (score >= 70) { label = 'Good'; tone = 'done'; }
        else if (score >= 45) { label = 'Needs attention'; tone = 'soon'; }
        else { label = 'Falling behind'; tone = 'overdue'; }

        // Build the "why" — the specific factors driving the score, most impactful first
        const reasons = [];
        if (untracked) {
            reasons.push({ text: 'Nothing tracked yet — score is neutral until you add tasks', tone: 'info' });
        } else {
            if (data.overdue.length > 0) {
                const perTask = Math.min(8, Math.round(overduePenalty / data.overdue.length));
                reasons.push({ text: `${data.overdue.length} overdue task${data.overdue.length !== 1 ? 's' : ''} (\u2212${perTask} pts each)`, tone: 'overdue' });
            }
            if (data.dueSoon.length > 0) {
                reasons.push({ text: `${data.dueSoon.length} task${data.dueSoon.length !== 1 ? 's' : ''} due this week (\u22122 pts each)`, tone: 'soon' });
            }
            if (stats.completed > 0) {
                reasons.push({ text: `${stats.completed} task${stats.completed !== 1 ? 's' : ''} completed on time`, tone: 'done' });
            }
            if (reasons.length === 0) {
                reasons.push({ text: 'Every tracked task is up to date', tone: 'done' });
            }
        }

        return { score, label, tone, reasons };
    },

    _healthCard(data, stats) {
        const h = this._computeHealthScore(data, stats);
        const circumference = 2 * Math.PI * 26;
        const offset = circumference - (h.score / 100) * circumference;
        const reasonsHtml = h.reasons.map(r => `
            <div class="health-reason">
                <span class="health-reason__dot health-reason__dot--${r.tone}"></span>
                <span class="health-reason__text">${r.text}</span>
            </div>`).join('');
        return `
            <div class="health-card">
                <div class="health-card__glow"></div>
                <div class="health-card__top">
                    <div>
                        <div class="health-card__label">Home Health Score</div>
                        <div class="health-card__score">${h.score}<span class="health-card__score-suffix">/100</span></div>
                    </div>
                    <div class="health-ring">
                        <svg width="64" height="64" viewBox="0 0 64 64">
                            <circle class="health-ring__track" cx="32" cy="32" r="26"/>
                            <circle class="health-ring__value" cx="32" cy="32" r="26" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                        </svg>
                    </div>
                </div>
                <div class="health-card__sub">${h.label}${data.overdue.length ? ` · ${data.overdue.length} task${data.overdue.length !== 1 ? 's' : ''} need attention` : ' · Everything on track'}</div>
                <div class="health-card__reasons">${reasonsHtml}</div>
                <div class="health-card__chip-row">
                    <div class="health-chip">${Icon('checklist', {size: 13})} ${stats.active} tracked</div>
                    <div class="health-chip">${Icon('check', {size: 13})} ${stats.completed} done</div>
                </div>
            </div>`;
    },

    // ========================
    //  DASHBOARD
    // ========================
    async _renderDashboard() {
        const c = document.getElementById('dashboard-content');
        c.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;

        const data = await db.getDashboardData();
        const stats = await db.getStats();

        let html = this._healthCard(data, stats);

        if (data.overdue.length > 0) {
            html += `<div class="section-header">
                <span class="section-header__title"><span class="status-dot status-dot--overdue"></span>Overdue</span>
                <span class="section-header__count">${data.overdue.length}</span>
            </div><div class="task-list">`;
            data.overdue.forEach(t => html += this._taskCard(t, 'overdue'));
            html += '</div>';
        }
        if (data.dueSoon.length > 0) {
            html += `<div class="section-header">
                <span class="section-header__title"><span class="status-dot status-dot--soon"></span>Due This Week</span>
                <span class="section-header__count">${data.dueSoon.length}</span>
            </div><div class="task-list">`;
            data.dueSoon.forEach(t => html += this._taskCard(t, 'soon'));
            html += '</div>';
        }
        if (data.upcoming.length > 0) {
            html += `<div class="section-header">
                <span class="section-header__title"><span class="status-dot status-dot--info"></span>Coming Up</span>
                <span class="section-header__count">${data.upcoming.length}</span>
            </div><div class="task-list">`;
            data.upcoming.slice(0, 8).forEach(t => html += this._taskCard(t, ''));
            html += '</div>';
        }
        if (data.overdue.length === 0 && data.dueSoon.length === 0 && data.upcoming.length === 0) {
            html += `<div class="empty-state">
                <div class="empty-state__illustration">${Icon('layers', {size: 36})}</div>
                <div class="empty-state__title">Nothing tracked yet</div>
                <p class="empty-state__text">Head to Categories and turn on the parts of your home you want DocYourHome to watch for you.</p>
                <div class="empty-state__action"><button class="btn btn--primary" onclick="App.showScreen('categories')">Browse Categories</button></div>
            </div>`;
        }
        c.innerHTML = html;
    },

    _taskCard(task, status) {
        const cls = status === 'overdue' ? 'task-card--overdue' : status === 'soon' ? 'task-card--soon' : '';
        const days = task.next_due ? this._daysUntil(task.next_due) : null;
        let badge = '';
        if (days !== null) {
            if (days <= 0) badge = `<span class="task-card__badge task-card__badge--overdue">${Math.abs(days)}d overdue</span>`;
            else if (days <= 7) badge = `<span class="task-card__badge task-card__badge--soon">Due in ${days}d</span>`;
            else badge = `<span class="task-card__badge task-card__badge--ok">Due in ${days}d</span>`;
        }
        return `
            <div class="task-card ${cls}" onclick="App.showScreen('taskdetail', {taskId: '${task.id}'})">
                <div class="task-card__icon">${CategoryIcon(task.category, {size: 20})}</div>
                <div class="task-card__body">
                    <div class="task-card__title">${task.name}</div>
                    <div class="task-card__meta-row">
                        ${badge}
                        <span class="task-card__dot"></span>
                        <span>${task.category}</span>
                    </div>
                </div>
            </div>`;
    },

    _daysUntil(dateStr) {
        return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    },

    // ========================
    //  CATEGORIES
    // ========================
    async _renderCategories() {
        const c = document.getElementById('categories-content');
        c.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;
        const cats = await db.getCategories();
        let html = '<div class="category-grid">';
        cats.forEach(cat => {
            html += `<div class="category-card" onclick="App.showScreen('category', {category: '${cat.category}'})">
                <div class="category-card__icon">${CategoryIcon(cat.category, {size: 22})}</div>
                <div class="category-card__name">${cat.category}</div>
                <div class="category-card__count">${cat.count} tasks</div>
            </div>`;
        });
        html += '</div>';
        c.innerHTML = html;
    },

    // ========================
    //  CATEGORY TASKS
    // ========================
    async _renderCategoryTasks(category) {
        const c = document.getElementById('category-content');
        const title = document.getElementById('category-title');
        if (title) title.textContent = category;
        c.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;

        const tasks = await db.getTasksByCategory(category);

        let html = `<div class="card" style="display:flex;align-items:center;gap:var(--s-3);padding:var(--s-4);margin-bottom:var(--s-5);">
            <div class="task-card__icon">${CategoryIcon(category, {size: 22})}</div>
            <div>
                <div style="font-weight:700;color:var(--text-primary);font-size:var(--t-md);">${category}</div>
                <div style="font-size:var(--t-xs);color:var(--text-tertiary);">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</div>
            </div>
        </div>`;

        if (tasks.length === 0) {
            html = `<div class="empty-state">
                <div class="empty-state__illustration">${Icon('folder', {size: 32})}</div>
                <div class="empty-state__title">No tasks here</div>
                <p class="empty-state__text">This category doesn't have any tasks defined yet.</p>
            </div>`;
        } else {
            html += '<div class="task-list">';
            tasks.forEach(t => {
                const active = t.active === 1;
                const freqText = (t.custom_freq || t.freqDays) > 0 ? `Every ${t.custom_freq || t.freqDays} days` : 'As needed';
                const isOverdue = active && t.next_due && new Date(t.next_due) < new Date();
                html += `
                    <div class="task-card ${isOverdue ? 'task-card--overdue' : ''}" onclick="App.showScreen('taskdetail', {taskId: '${t.id}'})">
                        <div class="task-card__icon">${CategoryIcon(category, {size: 20})}</div>
                        <div class="task-card__body">
                            <div class="task-card__title">${t.name}</div>
                            <div class="task-card__meta-row">
                                <span>${freqText}</span><span class="task-card__dot"></span><span>${t.season}</span>
                            </div>
                        </div>
                        <div class="flex-row gap-2" onclick="event.stopPropagation()">
                            <label class="toggle">
                                <input class="toggle__input" type="checkbox" ${active ? 'checked' : ''} onchange="App.toggleTask('${t.id}', this.checked)">
                                <span class="toggle__track"><span class="toggle__thumb"></span></span>
                            </label>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
        c.innerHTML = html;
    },

    async toggleTask(taskId, active) {
        await db.toggleTask(taskId, active);
        this.showToast(active ? 'Task activated' : 'Task turned off');
    },

    async markDone(taskId) {
        await db.markComplete(taskId);
        this.showToast('Marked complete', 'done');
        this.showScreen(this.currentScreen);
    },

    // ========================
    //  SETTINGS
    // ========================
    async _renderSettings() {
        const stats = await db.getStats();
        const c = document.getElementById('settings-content');

        const lastBackup = localStorage.getItem('homedue_last_backup');
        const backupDate = lastBackup ? new Date(parseInt(lastBackup)).toLocaleDateString() : 'Never';
        const isDark = this.theme === 'dark';

        c.innerHTML = `
            <div class="settings-group">
                <div class="settings-group__title">Appearance</div>
                <div class="card">
                    <div class="settings-row">
                        <span class="settings-row__label flex-row gap-2">${Icon(isDark ? 'moon' : 'sun', {size: 18})} ${isDark ? 'Dark' : 'Light'} Mode</span>
                        <label class="toggle">
                            <input class="toggle__input" type="checkbox" ${isDark ? 'checked' : ''} onchange="App.toggleTheme()">
                            <span class="toggle__track"><span class="toggle__thumb"></span></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group__title">Your Home</div>
                <div class="card">
                    <div class="settings-row"><span class="settings-row__label">Task library</span><span class="settings-row__value">${stats.total}</span></div>
                    <div class="settings-row"><span class="settings-row__label">Active</span><span class="settings-row__value">${stats.active}</span></div>
                    <div class="settings-row"><span class="settings-row__label">Completed</span><span class="settings-row__value">${stats.completed}</span></div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group__title">Recovery Key</div>
                <div class="card" style="padding:var(--s-4);">
                    <p style="font-size:var(--t-sm);color:var(--text-secondary);margin-bottom:var(--s-3);">Use this key to restore your data from cloud backup on a new device.</p>
                    <div class="recovery-key-display">${this.recoveryKey}</div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group__title">Cloud Backup</div>
                <div class="card" style="padding:var(--s-4);">
                    <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--s-3);">
                        <span style="font-size:var(--t-sm);color:var(--text-secondary);">Status</span>
                        <span class="cloud-status ${this.hasCloud ? 'cloud-status--active' : 'cloud-status--inactive'}">${this.hasCloud ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p class="text-muted-sm" style="margin-bottom:var(--s-3);">Last backup: ${backupDate}</p>
                    ${this.hasCloud
                        ? `<div class="modal-actions" style="margin-top:0;">
                            <button class="btn btn--primary btn--full" onclick="App.backupNow()">Back Up Now</button>
                            <button class="btn btn--secondary btn--full" onclick="App.restoreBackup()">Restore</button>
                           </div>`
                        : `<button class="btn btn--primary btn--full" onclick="App.purchaseCloud()">Activate Cloud Backup — $9.99/yr</button>`
                    }
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group__title">About</div>
                <div class="card">
                    <div class="settings-row"><span class="settings-row__label">Version</span><span class="settings-row__value">1.0</span></div>
                    <div class="settings-row"><span class="settings-row__label">Price</span><span class="settings-row__value">$4.99</span></div>
                </div>
            </div>
            <p class="text-muted-sm" style="text-align:center;padding-top:var(--s-4);">Built for people who take care of their home.</p>`;
    },

    // ========================
    //  CONTRACTORS
    // ========================
    async _renderContractors() {
        const contractors = await db.getContractors();
        const c = document.getElementById('contractors-content');

        if (contractors.length === 0) {
            c.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__illustration">${Icon('hardhat', {size: 34})}</div>
                    <div class="empty-state__title">No contractors yet</div>
                    <p class="empty-state__text">Save the people you trust so you can call them again in one tap.</p>
                    <div class="empty-state__action"><button class="btn btn--primary" onclick="App._showAddContractor()">Add Contractor</button></div>
                </div>`;
            return;
        }

        let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:var(--s-3);">
            <button class="btn btn--secondary btn--sm" onclick="App._showAddContractor()">${Icon('plus', {size: 14})} Add</button>
        </div><div class="contractor-list">`;
        contractors.forEach(ct => {
            const initial = ct.name ? ct.name.charAt(0).toUpperCase() : '?';
            const lastUsed = ct.lastUsed ? new Date(ct.lastUsed).toLocaleDateString() : 'Never';
            html += `
                <div class="contractor-card">
                    <div class="contractor-card__avatar">${initial}</div>
                    <div class="contractor-card__info">
                        <div class="contractor-card__name">${ct.name}</div>
                        <div class="contractor-card__phone">${ct.phone || 'No phone'}</div>
                        <div class="contractor-card__meta">Last used ${lastUsed}</div>
                    </div>
                    <button class="contractor-card__call-btn" onclick="window.open('tel:${ct.phone}')" aria-label="Call ${ct.name}">
                        ${Icon('phone', {size: 17})}
                    </button>
                </div>`;
        });
        html += '</div>';
        c.innerHTML = html;
    },

    // ========================
    //  RECORDS (History + Equipment + Documents)
    // ========================
    async _renderRecords() {
        const c = document.getElementById('records-content');
        try {
            const history = await db.getCompletionHistory();
            const equipment = await db.getEquipment();
            const documents = await db.getDocuments();

            let html = `
                <div class="segmented">
                    <button class="segmented__btn segmented__btn--active" id="records-tab-history" onclick="App._showRecordsTab('history')">History</button>
                    <button class="segmented__btn" id="records-tab-equipment" onclick="App._showRecordsTab('equipment')">Equipment</button>
                    <button class="segmented__btn" id="records-tab-documents" onclick="App._showRecordsTab('documents')">Documents</button>
                </div>
                <div id="records-history">`;

            if (history.length === 0) {
                html += `<div class="empty-state">
                    <div class="empty-state__illustration">${Icon('history', {size: 32})}</div>
                    <div class="empty-state__title">No history yet</div>
                    <p class="empty-state__text">Completed tasks will show up here with dates, notes, and cost.</p>
                </div>`;
            } else {
                html += '<div class="task-list">';
                history.forEach(h => {
                    html += `
                        <div class="task-card" style="cursor:default;">
                            <div class="task-card__icon">${Icon('check', {size: 18})}</div>
                            <div class="task-card__body">
                                <div class="task-card__title">${h.task_name || h.task_id}</div>
                                <div class="task-card__meta-row">
                                    <span>${h.completed_date}</span>
                                    ${h.cost ? `<span class="task-card__dot"></span><span>$${h.cost}</span>` : ''}
                                    ${h.notes ? `<span class="task-card__dot"></span><span>${h.notes}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
                });
                html += '</div>';
            }
            html += '</div>';

            html += `<div id="records-equipment" style="display:none;">
                <div style="display:flex;justify-content:flex-end;margin-bottom:var(--s-3);">
                    <button class="btn btn--secondary btn--sm" onclick="App._showAddEquipment()">${Icon('plus', {size: 14})} Add Equipment</button>
                </div>`;

            if (equipment.length === 0) {
                html += `<div class="empty-state">
                    <div class="empty-state__illustration">${Icon('camera', {size: 32})}</div>
                    <div class="empty-state__title">No equipment yet</div>
                    <p class="empty-state__text">Add your appliances and snap a photo of the manual so it's always on hand.</p>
                </div>`;
            } else {
                equipment.forEach(eq => {
                    html += `
                        <div class="equipment-card" onclick="App.showScreen('equipmentdetail', {equipId: '${eq.id}'})">
                            <div class="equipment-card__icon">${Icon('receipt', {size: 20})}</div>
                            <div class="equipment-card__body">
                                <div class="equipment-card__name">${eq.name}</div>
                                <div class="equipment-card__meta">${[eq.brand, eq.model].filter(Boolean).join(' ') || 'No details'}${eq.manualPhotoPaths.length ? ` · ${eq.manualPhotoPaths.length} photo${eq.manualPhotoPaths.length !== 1 ? 's' : ''}` : ''}</div>
                            </div>
                            <div class="equipment-card__actions" onclick="event.stopPropagation();">
                                <button class="icon-btn" onclick="App._takeEquipmentPhoto('${eq.id}')" aria-label="Add photo">${Icon('camera', {size: 18})}</button>
                                <button class="icon-btn icon-btn--danger" onclick="App._deleteEquipment('${eq.id}')" aria-label="Remove">${Icon('x', {size: 18})}</button>
                            </div>
                        </div>`;
                });
            }
            html += '</div>';

            // Documents tab
            html += `<div id="records-documents" style="display:none;">
                <div style="display:flex;justify-content:flex-end;margin-bottom:var(--s-3);">
                    <button class="btn btn--secondary btn--sm" onclick="App._addDocument()">${Icon('plus', {size: 14})} Add Document</button>
                </div>`;

            if (documents.length === 0) {
                html += `<div class="empty-state">
                    <div class="empty-state__illustration">${Icon('folder', {size: 32})}</div>
                    <div class="empty-state__title">No documents yet</div>
                    <p class="empty-state__text">Snap photos of manuals, warranties, receipts, paint colors — anything you want to keep.</p>
                </div>`;
            } else {
                html += '<div class="doc-grid">';
                documents.forEach(d => {
                    const catColors = { Manual: '#4A7FA6', Warranty: '#B8935B', Receipt: '#3E6B54', Photo: '#6B5B8A', Other: '#5C6472' };
                    const catColor = catColors[d.category] || '#5C6472';
                    html += `
                        <div class="doc-card">
                            <div class="doc-card__image">
                                <img src="${d.photoPath}" alt="${d.name}" loading="lazy">
                            </div>
                            <div class="doc-card__body">
                                <div class="doc-card__name">${d.name}</div>
                                <span class="doc-card__category" style="background:${catColor}20;color:${catColor};">${d.category}</span>
                                <span class="doc-card__date">${d.date}</span>
                            </div>
                            <button class="doc-card__delete" onclick="App._deleteDocument('${d.id}')" aria-label="Delete">${Icon('x', {size: 14})}</button>
                        </div>`;
                });
                html += '</div>';
            }
            html += '</div>';

            c.innerHTML = html;
        } catch (e) {
            console.error('Records error:', e);
            c.innerHTML = `<div class="empty-state"><p class="empty-state__text">Something went wrong loading your records.</p></div>`;
        }
    },

    _showRecordsTab(tab) {
        document.getElementById('records-history').style.display = tab === 'history' ? 'block' : 'none';
        document.getElementById('records-equipment').style.display = tab === 'equipment' ? 'block' : 'none';
        document.getElementById('records-documents').style.display = tab === 'documents' ? 'block' : 'none';
        document.getElementById('records-tab-history').classList.toggle('segmented__btn--active', tab === 'history');
        document.getElementById('records-tab-equipment').classList.toggle('segmented__btn--active', tab === 'equipment');
        document.getElementById('records-tab-documents').classList.toggle('segmented__btn--active', tab === 'documents');
    },

    _showAddEquipment() {
        const name = prompt('Appliance name:');
        if (!name) return;
        const brand = prompt('Brand:') || '';
        const model = prompt('Model:') || '';
        const serial = prompt('Serial number:') || '';
        const purchase = prompt('Purchase date (YYYY-MM-DD):') || '';
        const warranty = prompt('Warranty (years):') || '0';
        db.addEquipment({ name, brand, model, serial, purchaseDate: purchase, warrantyYears: parseInt(warranty) || 0 });
        this._renderRecords();
    },

    async _deleteEquipment(id) {
        if (confirm('Remove this equipment?')) {
            await db.deleteEquipment(id);
            this._renderRecords();
        }
    },

    // ========================
    //  DOCUMENTS
    // ========================
    async _addDocument() {
        const name = prompt('Document name:');
        if (!name) return;
        const categories = ['Manual', 'Warranty', 'Receipt', 'Photo', 'Other'];
        const catStr = prompt(`Category (${categories.join(', ')}):`);
        const category = categories.includes(catStr) ? catStr : 'Other';
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.Camera) {
                const photo = await Capacitor.Plugins.Camera.getPhoto({ quality: 70, allowEditing: false, saveToGallery: false, resultType: 'Uri' });
                if (photo && photo.path) {
                    await db.addDocument({ name, category, photoPath: photo.path });
                    this.showToast('Document saved', 'done');
                    this._renderRecords();
                }
            } else {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                            await db.addDocument({ name, category, photoPath: ev.target.result });
                            this.showToast('Document saved', 'done');
                            this._renderRecords();
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            }
        } catch (e) {
            console.error('Add document error:', e);
            this.showToast('Could not capture photo');
        }
    },

    async _deleteDocument(id) {
        if (confirm('Delete this document?')) {
            await db.deleteDocument(id);
            this.showToast('Document deleted');
            this._renderRecords();
        }
    },

    // ========================
    //  EQUIPMENT DETAIL
    // ========================
    async _renderEquipmentDetail(equipId) {
        const equip = await db.getEquipmentById(equipId);
        const c = document.getElementById('equipmentdetail-content');
        const title = document.getElementById('equipmentdetail-title');

        if (!equip) {
            c.innerHTML = `<div class="empty-state"><div class="empty-state__title">Not found</div></div>`;
            return;
        }

        if (title) title.textContent = equip.name;

        const warrantyEnd = equip.purchaseDate && equip.warrantyYears ?
            new Date(new Date(equip.purchaseDate).setFullYear(new Date(equip.purchaseDate).getFullYear() + parseInt(equip.warrantyYears))).toLocaleDateString() : null;

        let html = `
            <div class="task-detail__hero">
                <div class="task-detail__icon">${Icon('receipt', {size: 24})}</div>
                <div>
                    <div class="task-detail__name">${equip.name}</div>
                    <div class="task-detail__category">${[equip.brand, equip.model].filter(Boolean).join(' ') || 'Equipment'}</div>
                </div>
            </div>

            <div class="detail-meta">
                <div class="detail-meta__header">${Icon('checklist', {size: 16})}<span class="detail-meta__title">Details</span></div>
                ${equip.brand ? `<div class="detail-meta__row"><span class="detail-meta__label">Brand</span><span class="detail-meta__value">${equip.brand}</span></div>` : ''}
                ${equip.model ? `<div class="detail-meta__row"><span class="detail-meta__label">Model</span><span class="detail-meta__value">${equip.model}</span></div>` : ''}
                ${equip.serial ? `<div class="detail-meta__row"><span class="detail-meta__label">Serial</span><span class="detail-meta__value">${equip.serial}</span></div>` : ''}
                ${equip.purchaseDate ? `<div class="detail-meta__row"><span class="detail-meta__label">Purchased</span><span class="detail-meta__value">${equip.purchaseDate}</span></div>` : ''}
                ${warrantyEnd ? `<div class="detail-meta__row"><span class="detail-meta__label">Warranty until</span><span class="detail-meta__value">${warrantyEnd}</span></div>` : ''}
            </div>`;

        // Photos section
        if (equip.manualPhotoPaths && equip.manualPhotoPaths.length > 0) {
            html += `<div class="settings-group"><div class="settings-group__title">Manual Photos</div>`;
            equip.manualPhotoPaths.forEach(p => {
                html += `<div class="detail-photo"><img src="${p}" alt="Manual photo" style="width:100%;border-radius:var(--r-md);"></div>`;
            });
            html += `</div>`;
        } else {
            html += `<div class="empty-state" style="padding:var(--s-6);">
                <div class="empty-state__illustration" style="width:56px;height:56px;">${Icon('camera', {size: 24})}</div>
                <p class="empty-state__title" style="font-size:var(--t-base);">No photos yet</p>
                <p class="empty-state__text">Tap the camera icon to photograph the manual.</p>
            </div>`;
        }

        if (equip.notes) {
            html += `<div class="detail-notes" style="margin-top:var(--s-4);">
                <div class="detail-notes__header"><span class="detail-notes__title">Notes</span></div>
                <div class="detail-notes__text">${equip.notes}</div>
            </div>`;
        }

        html += `<div style="display:flex;gap:var(--s-3);margin-top:var(--s-5);">
            <button class="btn btn--secondary btn--full btn--sm" onclick="App._takeEquipmentPhoto('${equip.id}')">${Icon('camera', {size: 14})} Add Photo</button>
            <button class="btn btn--danger btn--full btn--sm" onclick="App._deleteEquipmentFromDetail('${equip.id}')">Remove</button>
        </div>`;

        c.innerHTML = html;
    },

    async _deleteEquipmentFromDetail(id) {
        if (confirm('Remove this equipment?')) {
            await db.deleteEquipment(id);
            this.showToast('Equipment removed');
            this.showScreen('records');
        }
    },

    async _takeEquipmentPhoto(equipId) {
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.Camera) {
                const photo = await Capacitor.Plugins.Camera.getPhoto({ quality: 70, allowEditing: false, saveToGallery: false, resultType: 'Uri' });
                if (photo && photo.path) {
                    await db.addManualPhoto(equipId, photo.path);
                    this.showToast('Photo saved', 'done');
                    this._renderRecords();
                }
            } else {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const path = 'manual_' + equipId + '_' + Date.now() + '.jpg';
                        await db.addManualPhoto(equipId, path);
                        this.showToast('Photo saved', 'done');
                        this._renderRecords();
                    }
                };
                input.click();
            }
        } catch (e) {
            this.showToast('Camera not available');
        }
    },

    _showAddContractor() {
        document.getElementById('input-new-contractor-name').value = '';
        document.getElementById('input-new-contractor-phone').value = '';
        this._openModal('modal-add-contractor');
    },

    async _saveNewContractor() {
        const name = document.getElementById('input-new-contractor-name').value.trim();
        const phone = document.getElementById('input-new-contractor-phone').value.trim();
        if (!name) { this.showToast('Enter a name'); return; }
        await db.saveContractor(null, name, phone);
        this._closeModal('modal-add-contractor');
        this.showToast('Contractor added', 'done');
        this.showScreen('contractors');
    },

    // ========================
    //  TASK DETAIL
    // ========================
    async _renderTaskDetail(taskId) {
        this._detailReturnScreen = this.currentScreen === 'taskdetail' ? this._detailReturnScreen : this.currentScreen;
        this._currentTaskId = taskId;

        const cats = await db.getCategories();
        let task = null;
        for (const cat of cats) {
            const tasks = await db.getTasksByCategory(cat.category);
            const found = tasks.find(t => t.id === taskId);
            if (found) { task = found; break; }
        }
        if (!task) { this.showToast('Task not found'); this.showScreen('dashboard'); return; }

        const existingNote = db.store.completedLog.find(l => l.task_id === taskId);
        const userTask = db.store.userTasks.find(u => u.task_id === taskId);
        this._currentNotes = existingNote?.notes || '';
        this._currentCost = existingNote?.cost || 0;
        this._currentContractor = userTask?.contractor_name || null;

        const title = document.getElementById('taskdetail-title');
        if (title) title.textContent = task.name;

        const active = task.active === 1;
        const days = task.next_due ? this._daysUntil(task.next_due) : null;

        let statusBadge;
        if (!active) statusBadge = `<span class="task-detail__status-badge task-detail__status-badge--inactive">Inactive</span>`;
        else if (days !== null && days <= 0) statusBadge = `<span class="task-detail__status-badge task-detail__status-badge--overdue">Overdue ${Math.abs(days)}d</span>`;
        else if (days !== null && days <= 7) statusBadge = `<span class="task-detail__status-badge task-detail__status-badge--soon">Due in ${days}d</span>`;
        else if (days !== null) statusBadge = `<span class="task-detail__status-badge task-detail__status-badge--ok">Due in ${days}d</span>`;
        else statusBadge = `<span class="task-detail__status-badge task-detail__status-badge--inactive">Not scheduled</span>`;

        const freqText = (task.custom_freq || task.freqDays) > 0 ? `Every ${task.custom_freq || task.freqDays} days` : 'As needed';
        const lastDone = userTask?.last_completed ? new Date(userTask.last_completed).toLocaleDateString() : 'Never';

        let html = `
            <div class="task-detail">
                <div class="task-detail__hero">
                    <div class="task-detail__icon">${CategoryIcon(task.category, {size: 26})}</div>
                    <div>
                        <div class="task-detail__name">${task.name}</div>
                        <div class="task-detail__category">${task.category}</div>
                        ${statusBadge}
                    </div>
                </div>

                <button class="task-detail__complete-btn ${active ? 'task-detail__complete-btn--ready' : 'task-detail__complete-btn--done'}"
                    ${active ? `onclick="App._openModal('modal-complete')"` : ''}>
                    ${Icon('check', {size: 18, strokeWidth: 2.5})}
                    ${active ? 'Mark Complete' : 'Task Inactive'}
                </button>

                <div class="detail-actions">
                    <div class="detail-action" onclick="App._showNoteModal()">
                        <div class="detail-action__icon">${Icon('checklist', {size: 18})}</div>
                        <div class="detail-action__content">
                            <div class="detail-action__title">Notes</div>
                            <div class="detail-action__subtitle">${this._currentNotes ? this._currentNotes : 'Add a note about this task'}</div>
                        </div>
                        ${this._currentNotes ? `<span class="detail-action__value">${Icon('check', {size: 15})}</span>` : ''}
                        <span class="detail-action__chevron">${Icon('chevronRight', {size: 16})}</span>
                    </div>
                    <div class="detail-action" onclick="App._showCostModal()">
                        <div class="detail-action__icon">${Icon('receipt', {size: 18})}</div>
                        <div class="detail-action__content">
                            <div class="detail-action__title">Cost</div>
                            <div class="detail-action__subtitle">${this._currentCost > 0 ? 'Recorded' : 'Track what you spent'}</div>
                        </div>
                        <span class="detail-action__value">${this._currentCost > 0 ? '$' + parseFloat(this._currentCost).toFixed(2) : ''}</span>
                        <span class="detail-action__chevron">${Icon('chevronRight', {size: 16})}</span>
                    </div>
                    <div class="detail-action" onclick="App._showContractorModal()">
                        <div class="detail-action__icon">${Icon('hardhat', {size: 18})}</div>
                        <div class="detail-action__content">
                            <div class="detail-action__title">Contractor</div>
                            <div class="detail-action__subtitle">${this._currentContractor || 'Assign a pro'}</div>
                        </div>
                        <span class="detail-action__chevron">${Icon('chevronRight', {size: 16})}</span>
                    </div>
                    <div class="detail-action" onclick="App._showPhotoModal()">
                        <div class="detail-action__icon">${Icon('camera', {size: 18})}</div>
                        <div class="detail-action__content">
                            <div class="detail-action__title">Photo</div>
                            <div class="detail-action__subtitle">Attach a photo of completed work</div>
                        </div>
                        <span class="detail-action__chevron">${Icon('chevronRight', {size: 16})}</span>
                    </div>
                </div>

                <div class="detail-meta">
                    <div class="detail-meta__header">${Icon('checklist', {size: 16})}<span class="detail-meta__title">Task Info</span></div>
                    <div class="detail-meta__row"><span class="detail-meta__label">Frequency</span><span class="detail-meta__value">${freqText}</span></div>
                    <div class="detail-meta__row"><span class="detail-meta__label">Season</span><span class="detail-meta__value">${task.season || 'Year-round'}</span></div>
                    <div class="detail-meta__row"><span class="detail-meta__label">Last Done</span><span class="detail-meta__value">${lastDone}</span></div>
                    <div class="detail-meta__row"><span class="detail-meta__label">Next Due</span><span class="detail-meta__value">${task.next_due || '—'}</span></div>
                </div>

                ${this._currentCost > 0 ? `
                <div class="detail-cost">
                    <span class="detail-cost__label">Total Cost</span>
                    <span class="detail-cost__value">$${parseFloat(this._currentCost).toFixed(2)}</span>
                </div>` : ''}

                ${userTask?.photo_path ? `<div class="detail-photo"><img src="${userTask.photo_path}" alt="Completed work"></div>` : ''}

                ${this._currentContractor ? `
                <div class="detail-meta">
                    <div class="detail-meta__header">${Icon('hardhat', {size: 16})}<span class="detail-meta__title">Contractor</span></div>
                    <div class="detail-meta__row"><span class="detail-meta__label">Name</span><span class="detail-meta__value">${this._currentContractor}</span></div>
                    ${userTask?.contractor_phone ? `<div class="detail-meta__row"><span class="detail-meta__label">Phone</span><span class="detail-meta__value">${userTask.contractor_phone}</span></div>` : ''}
                </div>` : ''}
            </div>`;

        document.getElementById('taskdetail-content').innerHTML = html;
    },

    // ========================
    //  MODAL SYSTEM
    // ========================
    _openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('modal-overlay--open'); },
    _closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('modal-overlay--open'); },

    _showNoteModal() {
        document.getElementById('input-note').value = this._currentNotes || '';
        this._openModal('modal-note');
    },
    _saveNote() {
        this._currentNotes = document.getElementById('input-note').value.trim();
        this._closeModal('modal-note');
        this.showToast('Note saved', 'done');
        this.showScreen('taskdetail', { taskId: this._currentTaskId });
    },

    _showCostModal() {
        document.getElementById('input-cost').value = this._currentCost > 0 ? this._currentCost : '';
        this._openModal('modal-cost');
    },
    _saveCost() {
        const val = parseFloat(document.getElementById('input-cost').value);
        this._currentCost = val > 0 ? val : 0;
        this._closeModal('modal-cost');
        this.showToast('Cost saved', 'done');
        this.showScreen('taskdetail', { taskId: this._currentTaskId });
    },

    async _showContractorModal() {
        const contractors = await db.getContractors();
        document.getElementById('input-contractor-name').value = this._currentContractor || '';
        const existing = contractors.find(c => c.name === this._currentContractor);
        document.getElementById('input-contractor-phone').value = existing?.phone || '';
        document.getElementById('modal-contractor-title').textContent = this._currentContractor ? 'Edit Contractor' : 'Add Contractor';
        this._openModal('modal-contractor');
    },
    _saveContractor() {
        const name = document.getElementById('input-contractor-name').value.trim();
        const phone = document.getElementById('input-contractor-phone').value.trim();
        if (!name) { this.showToast('Enter a name'); return; }
        this._currentContractor = name;
        db.saveContractor(this._currentTaskId, name, phone);
        this._closeModal('modal-contractor');
        this.showToast('Contractor saved', 'done');
        this.showScreen('taskdetail', { taskId: this._currentTaskId });
    },

    _showPhotoModal() {
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('photo-upload-zone').style.display = 'flex';
        this._currentPhoto = null;
        this._openModal('modal-photo');
    },
    _selectPhoto() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this._currentPhoto = ev.target.result;
                document.getElementById('photo-upload-zone').style.display = 'none';
                document.getElementById('photo-preview').style.display = 'block';
                document.getElementById('photo-preview-img').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    _removePhoto() {
        this._currentPhoto = null;
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('photo-upload-zone').style.display = 'flex';
    },
    _savePhoto() {
        if (!this._currentPhoto) { this.showToast('Select a photo first'); return; }
        db.savePhoto(this._currentTaskId, this._currentPhoto);
        this._closeModal('modal-photo');
        this.showToast('Photo attached', 'done');
        this.showScreen('taskdetail', { taskId: this._currentTaskId });
    },

    _confirmComplete() {
        this._closeModal('modal-complete');
        const taskId = this._currentTaskId;
        db.markComplete(taskId, this._currentNotes, this._currentCost);
        this.showToast('Task completed', 'done');
        this.showScreen('taskdetail', { taskId });
    },

    _deleteCurrentTask() {
        if (!this._currentTaskId) return;
        db.toggleTask(this._currentTaskId, false);
        this.showToast('Task deactivated');
        this.showScreen(this._detailReturnScreen || 'dashboard');
    },

    // ========================
    //  TOAST
    // ========================
    showToast(msg, tone) {
        const t = document.getElementById('toast');
        if (!t) return;
        let iconHtml = '';
        if (tone === 'done') iconHtml = Icon('check', {size: 15});
        else if (tone === 'info') iconHtml = Icon('sparkle', {size: 15});
        t.innerHTML = `${iconHtml}<span>${msg}</span>`;
        t.classList.add('toast--visible');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('toast--visible'), 2500);
    }
};