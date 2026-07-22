// DocYourHome — Database Module

const DB_NAME = 'homedue';
// (unused — app.js API_URL is the actual backup endpoint)

class HomeDueDB {
    constructor() {
        this.ready = false;
        this.store = { tasks: [], userTasks: [], customTasks: [], completedLog: [], contractors: [], equipment: [], documents: [] };
    }

    async init() {
        try {
            this._loadStore();
            if (this.store.tasks.length === 0) await this._seed();
            this.ready = true;
            return true;
        } catch (e) {
            console.error('DB init failed:', e);
            return false;
        }
    }

    _loadStore() {
        const saved = localStorage.getItem('homedue_store');
        if (saved) {
            try { this.store = JSON.parse(saved); } catch(e) {}
        }
        if (!this.store.documents) this.store.documents = [];
        if (!this.store.customTasks) this.store.customTasks = [];
    }

    _saveStore() {
        try { localStorage.setItem('homedue_store', JSON.stringify(this.store)); } catch(e) {}
    }

    _where(arr, fn) { const r=[]; for(const i of arr) if(fn(i)) r.push(i); return r; }

    async _seed() {
        try {
            const resp = await fetch('tasks.json');
            const data = await resp.json();
            this.store.tasks = data.tasks || [];
            this._saveStore();
        } catch(e) {
            console.error('Seed failed:', e);
            this.store.tasks = [];
        }
    }

    async getCategories() {
        const map = {};
        for (const t of this.store.tasks) map[t.category] = (map[t.category] || 0) + 1;
        for (const t of this.store.customTasks) map[t.category] = (map[t.category] || 0) + 1;
        return Object.entries(map).map(([category, count]) => ({ category, count })).sort((a, b) => a.category.localeCompare(b.category));
    }

    async getTasksByCategory(category) {
        const tasks = this._where(this.store.tasks, t => t.category === category);
        const customTasks = this._where(this.store.customTasks, t => t.category === category);
        const merged = [...tasks, ...customTasks];
        return merged.map(t => {
            const ut = this.store.userTasks.find(u => u.task_id === t.id) || {};
            return { ...t, active: ut.active || 0, last_completed: ut.last_completed || null, next_due: ut.next_due || null, custom_freq: ut.custom_freq || null };
        });
    }

    async toggleTask(taskId, active) {
        const nextDue = new Date(); nextDue.setDate(nextDue.getDate() + 7);
        const existing = this.store.userTasks.findIndex(u => u.task_id === taskId);
        const entry = { task_id: taskId, active: active ? 1 : 0, next_due: active ? nextDue.toISOString().split('T')[0] : null, last_completed: null };
        if (existing >= 0) this.store.userTasks[existing] = { ...this.store.userTasks[existing], ...entry };
        else this.store.userTasks.push(entry);
        this._saveStore();
    }

    async markComplete(taskId, notes = '', cost = 0) {
        const today = new Date().toISOString().split('T')[0];
        const task = this.store.tasks.find(t => t.id === taskId);
        const freq = task?.freqDays || 90;
        const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + (freq > 0 ? freq : 365));
        const nextDue = nextDate.toISOString().split('T')[0];
        const existing = this.store.userTasks.findIndex(u => u.task_id === taskId);
        const entry = { task_id: taskId, active: 1, last_completed: today, next_due: nextDue };
        if (existing >= 0) this.store.userTasks[existing] = { ...this.store.userTasks[existing], ...entry };
        else this.store.userTasks.push(entry);
        const taskName = task?.name || taskId;
        this.store.completedLog.push({ id: Date.now(), task_id: taskId, task_name: taskName, completed_date: today, notes, cost });
        this._saveStore();
    }

    async getDashboardData() {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
        const nwStr = nextWeek.toISOString().split('T')[0];
        const overdue = [], dueSoon = [], upcoming = [];
        for (const ut of this.store.userTasks) {
            if (!ut.active || !ut.next_due) continue;
            const task = this.store.tasks.find(t => t.id === ut.task_id);
            if (!task) continue;
            const item = { ...task, next_due: ut.next_due };
            if (ut.next_due < today) overdue.push(item);
            else if (ut.next_due <= nwStr) dueSoon.push(item);
            else upcoming.push(item);
        }
        return { overdue: overdue.sort((a,b)=>a.next_due<b.next_due?-1:1), dueSoon: dueSoon.sort((a,b)=>a.next_due<b.next_due?-1:1), upcoming: upcoming.sort((a,b)=>a.next_due<b.next_due?-1:1) };
    }

    async getStats() {
        return { total: this.store.tasks.length + this.store.customTasks.length, active: this.store.userTasks.filter(u=>u.active).length, completed: this.store.completedLog.length };
    }

    async getCompletionHistory(limit = 50) {
        return this.store.completedLog.slice(-limit).reverse();
    }

    async saveContractor(taskId, name, phone) {
        const existing = this.store.userTasks.findIndex(u => u.task_id === taskId);
        if (existing >= 0) { this.store.userTasks[existing].contractor_name = name; this.store.userTasks[existing].contractor_phone = phone; }
        const cIdx = this.store.contractors.findIndex(c => c.name === name);
        if (cIdx >= 0) this.store.contractors[cIdx] = { name, phone, lastUsed: new Date().toISOString() };
        else this.store.contractors.push({ name, phone, lastUsed: new Date().toISOString() });
        this._saveStore();
    }

    async getContractors() { return this.store.contractors.sort((a,b)=>a.lastUsed<b.lastUsed?1:-1); }

    async addEquipment(item) {
        const eq = { id: Date.now().toString(), name: item.name, brand: item.brand || '', model: item.model || '', serial: item.serial || '', purchaseDate: item.purchaseDate || '', warrantyYears: item.warrantyYears || 0, notes: item.notes || '', manualPhotoPaths: item.manualPhotoPaths || [], createdDate: new Date().toISOString().split('T')[0] };
        this.store.equipment.push(eq);
        this._saveStore();
        return eq;
    }

    async getEquipment() { return this.store.equipment.slice().reverse(); }

    async getEquipmentById(id) { return this.store.equipment.find(e => e.id === id); }

    async deleteEquipment(id) {
        this.store.equipment = this.store.equipment.filter(e => e.id !== id);
        this._saveStore();
    }

    async addManualPhoto(equipId, photoPath) {
        const eq = this.store.equipment.find(e => e.id === equipId);
        if (eq) { eq.manualPhotoPaths.push(photoPath); this._saveStore(); }
    }

    // ========================
    //  DOCUMENTS
    // ========================
    async addDocument(item) {
        const doc = { id: Date.now().toString(), name: item.name, category: item.category || 'Other', docType: item.docType || 'image', photoPath: item.photoPath, imageDataUrl: item.imageDataUrl || '', date: new Date().toISOString().split('T')[0], notes: item.notes || '' };
        this.store.documents.push(doc);
        this._saveStore();
        return doc;
    }

    async getDocuments() { if (!this.store.documents) this.store.documents = []; return this.store.documents.slice().reverse(); }

    async deleteDocument(id) {
        this.store.documents = this.store.documents.filter(d => d.id !== id);
        this._saveStore();
    }

    // ========================
    //  CUSTOM TASKS
    // ========================
    async addCustomTask(name, category, freqDays, season) {
        const newId = 'custom-' + Date.now();
        const customTask = { id: newId, name, category, freqDays: parseInt(freqDays) || 90, season: season || 'Year-round', notes: '' };
        if (!this.store.customTasks) this.store.customTasks = [];
        this.store.customTasks.push(customTask);
        this._saveStore();
        return customTask;
    }

    async updateCustomFreq(taskId, customFreqDays) {
        const existing = this.store.userTasks.find(u => u.task_id === taskId);
        const freqVal = parseInt(customFreqDays) || null;
        if (existing) {
            existing.custom_freq = freqVal;
        } else {
            this.store.userTasks.push({ task_id: taskId, active: 0, custom_freq: freqVal, last_completed: null, next_due: null });
        }
        // Recalculate next due if active
        if (freqVal && existing?.active) {
            const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + freqVal);
            existing.next_due = nextDate.toISOString().split('T')[0];
        }
        this._saveStore();
    }

    async deleteCustomTask(taskId) {
        if (!taskId.startsWith('custom-')) return; // only custom tasks can be deleted
        this.store.customTasks = (this.store.customTasks || []).filter(t => t.id !== taskId);
        this.store.userTasks = this.store.userTasks.filter(u => u.task_id !== taskId);
        this._saveStore();
    }

    async exportBackup() { return { version:'1.0', exported:new Date().toISOString(), tasks:this.store.tasks, customTasks:this.store.customTasks, userTasks:this.store.userTasks, completionLog:this.store.completedLog, contractors:this.store.contractors, equipment:this.store.equipment, documents:this.store.documents }; }

    async importBackup(data) {
        if (data.userTasks) this.store.userTasks = data.userTasks;
        if (data.completionLog) this.store.completionLog = data.completionLog;
        if (data.contractors) this.store.contractors = data.contractors;
        if (data.equipment) this.store.equipment = data.equipment;
        if (data.documents) this.store.documents = data.documents;
        this._saveStore();
    }
}

const db = new HomeDueDB();