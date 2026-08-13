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

  const normalizeHeader = (value = '') => String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const parseCSV = (text) => {
    const rows = [];
    let row = [], cell = '', quoted = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(value => String(value).trim() !== '')) rows.push(row);
        row = [];
      } else cell += ch;
    }

    row.push(cell);
    if (row.some(value => String(value).trim() !== '')) rows.push(row);
    if (!rows.length) return [];

    const headers = rows.shift().map(normalizeHeader);
    return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
  };

  const toCsvUrl = (url) => {
    const match = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return url;
    const gidMatch = String(url).match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
  };

  const pick = (row, names) => {
    for (const name of names) {
      if (row[name]) return row[name];
    }
    return '';
  };

  const parseDate = (dateValue, timeValue = '') => {
    if (!dateValue) return null;
    const date = String(dateValue).trim();
    const time = String(timeValue || '').trim();

    let candidate = new Date(`${date}${time ? ' ' + time : ''}`);
    if (!Number.isNaN(candidate.getTime())) return candidate;

    const parts = date.split(/[\/-]/).map(part => part.trim());
    if (parts.length === 3) {
      const [a, b, c] = parts;
      const isoDate = c.length === 4
        ? `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
        : `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
      candidate = new Date(`${isoDate}${time ? ' ' + time : ''}`);
      if (!Number.isNaN(candidate.getTime())) return candidate;
    }
    return null;
  };

  const endOfEvent = (row, startDate) => {
    const endDateValue = pick(row, ['end_date', 'enddate']);
    const endTimeValue = pick(row, ['end_time', 'endtime']);
    const explicitEnd = parseDate(endDateValue || pick(row, ['date', 'event_date']), endTimeValue);
    if (explicitEnd) return explicitEnd;

    if (startDate) {
      const end = new Date(startDate);
      if (!pick(row, ['time', 'event_time', 'start_time', 'starttime'])) end.setHours(23, 59, 59, 999);
      return end;
    }
    return null;
  };

  const formatDate = (date) => date
    ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    : '';

  const normalizeEvent = (row) => {
    const date = pick(row, ['date', 'event_date', 'start_date', 'startdate']);
    const time = pick(row, ['time', 'event_time', 'start_time', 'starttime']);
    const start = parseDate(date, time);
    return {
      title: pick(row, ['title', 'event_title', 'event_name', 'name']) || 'Youth Connect Event',
      date,
      time,
      location: pick(row, ['location', 'venue', 'place']),
      description: pick(row, ['description', 'details', 'summary', 'event_description']),
      link: pick(row, ['registration_link', 'registration_url', 'register_link', 'register_url', 'learn_more', 'link', 'url']),
      buttonText: pick(row, ['button_text', 'cta', 'cta_text']) || 'Register / Learn More',
      status: String(pick(row, ['status', 'visibility'])).toLowerCase(),
      start,
      end: endOfEvent(row, start)
    };
  };

  const renderCard = (event, isPast = false) => {
    const dateText = formatDate(event.start) || event.date || '';
    const meta = [dateText, event.time, event.location].filter(Boolean).map(escapeHtml);
    const metaHtml = meta.map((item, index) => {
      const icons = ['fa-calendar-days', 'fa-clock', 'fa-location-dot'];
      return `<span><i class="fa-solid ${icons[index] || 'fa-circle-info'}"></i>${item}</span>`;
    }).join('');

    return `<article class="event-card${isPast ? ' past-event-card' : ''}">
      <div class="date-icon"><i class="fa-solid fa-calendar-days"></i></div>
      <h3>${escapeHtml(event.title)}</h3>
      ${metaHtml ? `<div class="event-meta">${metaHtml}</div>` : ''}
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}
      ${event.link ? `<a class="event-link" href="${escapeHtml(event.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.buttonText)} <i class="fa-solid fa-arrow-right"></i></a>` : ''}
    </article>`;
  };

  const renderEmpty = (grid, message) => {
    grid.innerHTML = `<div class="empty"><i class="fa-regular fa-calendar"></i><br>${escapeHtml(message)}</div>`;
  };

  fetch(toCsvUrl(config.sheetUrl), { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Unable to load events (${response.status})`);
      return response.text();
    })
    .then(text => {
      const now = new Date();
      const events = parseCSV(text)
        .map(normalizeEvent)
        .filter(event => !['hidden', 'draft', 'inactive', 'disabled'].includes(event.status));

      const upcoming = events
        .filter(event => !event.end || event.end >= now)
        .sort((a, b) => (a.start?.getTime() || Number.MAX_SAFE_INTEGER) - (b.start?.getTime() || Number.MAX_SAFE_INTEGER));

      const past = events
        .filter(event => event.end && event.end < now)
        .sort((a, b) => (b.start?.getTime() || 0) - (a.start?.getTime() || 0));

      if (upcoming.length) upcomingGrid.innerHTML = upcoming.map(event => renderCard(event)).join('');
      else renderEmpty(upcomingGrid, 'No upcoming events at the moment. Please check back soon.');

      if (past.length) pastGrid.innerHTML = past.map(event => renderCard(event, true)).join('');
      else renderEmpty(pastGrid, 'Past events will appear here automatically after their event date has passed.');
    })
    .catch(error => {
      console.warn('Youth Connect events page:', error.message);
      renderEmpty(upcomingGrid, 'Events are temporarily unavailable. Please check back shortly.');
      renderEmpty(pastGrid, 'Past events are temporarily unavailable.');
    });
})();
