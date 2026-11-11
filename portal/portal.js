(function () {
  window.PortalUI = {
    toast(msg, type = 'info') {
      let el = document.getElementById('portalToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'portalToast';
        el.className = 'toast portal-chrome';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.border =
        type === 'error'
          ? '1px solid #ef4444'
          : type === 'success'
            ? '1px solid #10b981'
            : '1px solid rgba(255,255,255,0.16)';
      el.classList.add('visible');
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.classList.remove('visible'), 3200);
    },

    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    formatBytes(bytes) {
      const n = Number(bytes || 0);
      if (!n) return '-';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      return (n / (1024 * 1024)).toFixed(2) + ' MB';
    },

    formatDate(iso) {
      if (!iso) return '-';
      try {
        return new Date(iso).toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return String(iso);
      }
    },

    async customerLogin(username, password) {
      const res = await fetch('/api/customer', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: String(username || '').trim(),
          password: String(password || '').trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Kullanıcı adı veya şifre hatalı!');
      }
      return data;
    },

    async customerLogout() {
      await fetch('/api/customer', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      }).catch(() => {});
    },

    getTokenKey(folderSlug) {
      return 'hr_folder_token_' + folderSlug;
    },

    getFolderToken(folderSlug) {
      try {
        return sessionStorage.getItem(this.getTokenKey(folderSlug)) || '';
      } catch {
        return '';
      }
    },

    setFolderToken(folderSlug, token) {
      try {
        if (token) sessionStorage.setItem(this.getTokenKey(folderSlug), token);
        else sessionStorage.removeItem(this.getTokenKey(folderSlug));
      } catch {}
    },

    getSlugFromPath(prefix) {
      const url = new URL(window.location.href);
      const qSlug = url.searchParams.get('slug');
      if (qSlug) return qSlug.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf(prefix);
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].trim();
      return '';
    },

    async copyText(text, label = 'Panoya kopyalandı!') {
      try {
        await navigator.clipboard.writeText(text);
        this.toast(label, 'success');
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.toast(label, 'success');
      }
    },

    sanitizeReportHtmlClient(rawHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml || '', 'text/html');
      doc.querySelectorAll('script, iframe, object, embed, base, meta[http-equiv]').forEach(el => el.remove());
      doc.querySelectorAll('*').forEach(el => {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const val = (attr.value || '').trim().toLowerCase();
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
          } else if ((name === 'href' || name === 'src') && val.startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
      const styles = Array.from(doc.querySelectorAll('style'))
        .map(s => s.textContent || '')
        .join('\n');
      const pages = Array.from(doc.querySelectorAll('.tkm-a4-page'));
      const bodyHtml = pages.length
        ? pages.map(p => p.outerHTML).join('')
        : (doc.body ? doc.body.innerHTML : '');
      return { styles, bodyHtml };
    }
  };
})();
