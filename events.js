(() => {
  const config = window.YCF_EVENTS_CONFIG || {};
  const grid = document.getElementById('dynamicEvents');
  if (!grid || !config.sheetUrl) return;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalizeHeader = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const parseCSV = (text) => {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);
    if (!rows.length) return [];
    const headers = rows.shift().map(normalizeHeader);
    return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
  };

  const toCsvUrl = (url) => {
    const match = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return url;
    const gidMatch = String(url).match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
  };

  const parseDate = (date, time = '') => {
    if (!date) return null;
    const direct = new Date(`${date}${time ? ' ' + time : ''}`);
    if (!Number.isNaN(direct.getTime())) return direct;
    const parts = String(date).split(/[\/-]/).map(v => v.trim());
    if (parts.length === 3) {
      const [a,b,c] = parts;
      const iso = c.length === 4 ? `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}` : `${a}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`;
      const fallback = new Date(`${iso}${time ? ' ' + time : ''}`);
      if (!Number.isNaN(fallback.getTime())) return fallback;
    }
    return null;
  };

  const formatDate = (date) => date ? new Intl.DateTimeFormat('en', { day:'2-digit', month:'short', year:'numeric' }).format(date) : '';

  const render = (events) => {
    if (!events.length) {
      grid.innerHTML = '<div class="event-card"><div class="date-icon">📅</div><h3>No upcoming events</h3><p>Please check back soon for new Youth Connect Foundation activities.</p></div>';
      return;
    }
    grid.innerHTML = events.map(event => {
      const dateObj = parseDate(event.date, event.time);
      const dateText = formatDate(dateObj) || event.date || '';
      const meta = [dateText, event.time, event.location].filter(Boolean).map(escapeHtml).join(' • ');
      const link = event.registration_link || event.registration_url || event.link || '';
      const title = escapeHtml(event.title || event.event_title || 'Youth Connect Event');
      const description = escapeHtml(event.description || event.details || '');
      return `<div class="event-card"><div class="date-icon">📅</div><h3>${title}</h3>${meta ? `<div class="event-meta">${meta}</div>` : ''}${description ? `<p>${description}</p>` : ''}${link ? `<a class="event-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">Register / Learn More →</a>` : ''}</div>`;
    }).join('');
  };

  fetch(toCsvUrl(config.sheetUrl), { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('Unable to load events'); return response.text(); })
    .then(text => {
      const now = new Date(); now.setHours(0,0,0,0);
      const rows = parseCSV(text)
        .filter(row => !['hidden','draft','inactive'].includes(String(row.status || '').toLowerCase()))
        .map(row => ({ ...row, _date: parseDate(row.date, row.time) }))
        .filter(row => config.showPastEvents || !row._date || row._date >= now)
        .sort((a,b) => (a._date?.getTime() || Number.MAX_SAFE_INTEGER) - (b._date?.getTime() || Number.MAX_SAFE_INTEGER))
        .slice(0, Number(config.maxEvents) || 4);
      render(rows);
    })
    .catch(error => console.warn('Youth Connect events feed:', error.message));
})();
