(() => {
  const config = window.YCF_EVENTS_CONFIG || {};
  const upcomingGrid = document.getElementById('upcomingEvents');
  const pastGrid = document.getElementById('pastEvents');
  if (!upcomingGrid || !pastGrid || !config.sheetUrl) return;

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
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gidMatch ? gidMatch[1] : '0'}`;
  };

  const pick = (row, names) => {
    for (const name of names) if (row[name]) return row[name];
    return '';
  };

  const parseDate = (dateValue, timeValue = '') => {
    if (!dateValue) return null;
    const date = String(dateValue).trim();
    const time = String(timeValue || '').trim();
    let parsed = new Date(`${date}${time ? ' ' + time : ''}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const parts = date.split(/[\/-]/).map(v => v.trim());
    if (parts.length === 3) {
      const [a, b, c] = parts;
      const iso = c.length === 4 ? `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}` : `${a}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`;
      parsed = new Date(`${iso}${time ? ' ' + time : ''}`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const normalizeEvent = (row) => {
    const date = pick(row, ['date','event_date','start_date','startdate']);
    const time = pick(row, ['time','event_time','start_time','starttime']);
    const start = parseDate(date, time);
    const endDate = pick(row, ['end_date','enddate']);
    const endTime = pick(row, ['end_time','endtime']);
    let end = parseDate(endDate || date, endTime);
    if (!end && start) {
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (end && !endTime) {
      end.setHours(23, 59, 59, 999);
    }
    return {
      title: pick(row, ['title','event_title','event_name','name']) || 'Youth Connect Event',
      type: pick(row, ['type','category','event_type']) || 'Event',
      date, time,
      location: pick(row, ['location','venue','place']),
      description: pick(row, ['description','details','summary','event_description']),
      link: pick(row, ['registration_link','registration_url','register_link','register_url','learn_more','link','url']),
      buttonText: pick(row, ['button_text','cta','cta_text']) || 'Register / Learn More',
      status: String(pick(row, ['status','visibility'])).toLowerCase(),
      start, end
    };
  };

  const dateParts = (event) => {
    if (!event.start) return { month: 'TBA', day: '—', year: '', weekday: '' };
    return {
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(event.start).toUpperCase(),
      day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(event.start),
      year: new Intl.DateTimeFormat('en', { year: 'numeric' }).format(event.start),
      weekday: new Intl.DateTimeFormat('en', { weekday: 'long' }).format(event.start).toUpperCase()
    };
  };

  const formatDate = (date) => date ? new Intl.DateTimeFormat('en', { day:'2-digit', month:'short', year:'numeric' }).format(date) : '';

  const renderCard = (event, isPast = false) => {
    const d = dateParts(event);
    const dateText = formatDate(event.start) || event.date || 'Date TBA';
    return `<article class="event-card${isPast ? ' past-event-card' : ''}">
      <div class="event-date-panel">
        <div class="event-month">${escapeHtml(d.month)}</div>
        <div class="event-day">${escapeHtml(d.day)}</div>
        <div class="event-year">${escapeHtml(d.year)}</div>
        <div class="event-weekday">${escapeHtml(d.weekday)}</div>
      </div>
      <div class="event-body">
        <div class="event-type">${escapeHtml(event.type)}</div>
        <h3>${escapeHtml(event.title)}</h3>
        <div class="event-meta">
          <span><i class="fa-regular fa-calendar"></i>${escapeHtml(dateText)}</span>
          ${event.time ? `<span><i class="fa-regular fa-clock"></i>${escapeHtml(event.time)}</span>` : ''}
          ${event.location ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(event.location)}</span>` : ''}
        </div>
        ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
      </div>
      <div class="event-action">
        <div class="event-action-icon"><i class="fa-solid ${isPast ? 'fa-clock-rotate-left' : 'fa-calendar-check'}"></i></div>
        ${event.link ? `<a class="event-link" href="${escapeHtml(event.link)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(event.buttonText)}</span><i class="fa-solid fa-arrow-right"></i></a>` : ''}
      </div>
    </article>`;
  };

  const renderEmpty = (grid, message) => {
    grid.innerHTML = `<div class="empty"><i class="fa-regular fa-calendar"></i><br>${escapeHtml(message)}</div>`;
  };

  fetch(toCsvUrl(config.sheetUrl), { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(`Unable to load events (${response.status})`); return response.text(); })
    .then(text => {
      const now = new Date();
      const events = parseCSV(text).map(normalizeEvent).filter(event => !['hidden','draft','inactive','disabled'].includes(event.status));
      const upcoming = events.filter(event => !event.end || event.end >= now).sort((a,b) => (a.start?.getTime() || Number.MAX_SAFE_INTEGER) - (b.start?.getTime() || Number.MAX_SAFE_INTEGER));
      const past = events.filter(event => event.end && event.end < now).sort((a,b) => (b.start?.getTime() || 0) - (a.start?.getTime() || 0));
      upcoming.length ? upcomingGrid.innerHTML = upcoming.map(e => renderCard(e)).join('') : renderEmpty(upcomingGrid, 'No upcoming events at the moment. Please check back soon.');
      past.length ? pastGrid.innerHTML = past.map(e => renderCard(e, true)).join('') : renderEmpty(pastGrid, 'Past events will appear here automatically after their event date has passed.');
    })
    .catch(error => {
      console.warn('Youth Connect events page:', error.message);
      renderEmpty(upcomingGrid, 'Events are temporarily unavailable. Please check back shortly.');
      renderEmpty(pastGrid, 'Past events are temporarily unavailable.');
    });
})();
