(() => {
  const source = document.body.dataset.source;
  const active = document.body.dataset.active || '';
  if (!source) return;

  const root = document.getElementById('cleanRoot');
  const routeMap = {
    'team.html':'team/','events.html':'events/','campaigns.html':'campaigns/','campaign-menstrual-health.html':'campaign-menstrual-health/',
    'get-involved.html':'get-involved/','donation.html':'donation/','volunteer.html':'volunteer/','partner.html':'partner/','privacy-policy.html':'privacy-policy/'
  };
  const cleanHref = href => {
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return href;
    const [path, hash=''] = href.split('#');
    const [plain, query=''] = path.split('?');
    if (plain === 'index.html' || plain === './index.html') return `../${query ? '?' + query : ''}${hash ? '#' + hash : ''}`;
    if (routeMap[plain]) return `../${routeMap[plain]}${query ? '?' + query : ''}${hash ? '#' + hash : ''}`;
    return href;
  };
  const shellCss = `.footer-links{width:100%;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:5px 0 14px}.footer-links a{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#dce7f4;font-size:12px;font-weight:800}.footer-links a:hover{color:#fff;border-color:rgba(16,200,255,.35);background:rgba(18,104,255,.18)}.footer-links i{color:#ffc83d}@media(max-width:760px){.footer-links{gap:7px;padding-top:2px}.footer-links a{flex:1 1 110px;justify-content:center}}`;
  const shell = main => `<div class="sdg-stripe"></div><header><div class="container nav"><a href="../" class="brand"><img src="../assets/YCF.png" alt="Youth Connect Foundation Logo"><div><div class="brand-title">YOUTH CONNECT</div><div class="brand-subtitle">FOUNDATION</div></div></a><nav class="menu" id="menu"><a href="../" class="${active==='home'?'active':''}"><i class="fa-solid fa-house"></i>Home</a><a href="../team/" class="${active==='team'?'active':''}"><i class="fa-solid fa-users"></i>Team</a><a href="../events/" class="${active==='events'?'active':''}"><i class="fa-solid fa-calendar-days"></i>Event</a><a href="../campaigns/" class="${active==='campaigns'?'active':''}"><i class="fa-solid fa-bullhorn"></i>Campaigns</a><a href="../get-involved/" class="${active==='get-involved'?'active':''}"><i class="fa-solid fa-handshake-angle"></i>Get Involved</a><a href="../donation/" class="donate-nav ${active==='donation'?'active':''}"><i class="fa-solid fa-heart"></i>Donate</a></nav><button class="hamburger" id="hamburger" aria-label="Open menu">☰</button></div></header>${main}<footer><div class="container footer-grid"><a href="../" class="brand"><img src="../assets/YCF.png" alt="Youth Connect Foundation Logo"><div><div class="brand-title">YOUTH CONNECT FOUNDATION</div><div class="brand-subtitle">© 2026 Youth Connect Foundation. All Rights Reserved.</div></div></a><div class="social"><a href="https://www.facebook.com/YouthConnectFdn" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i></a><a href="https://www.linkedin.com/company/youthconnectfdn" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin-in"></i></a><a href="https://www.instagram.com/youthconnectfdn" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a><a href="https://x.com/YouthConnectFdn" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter"></i></a></div><div class="listed-badge"><span>Listed on</span><img src="../assets/google-for-non-profits.webp" alt="Google for Nonprofits"></div><div class="footer-links"><a href="../#about"><i class="fa-solid fa-circle-info"></i>About</a><a href="../#program"><i class="fa-solid fa-rocket"></i>Programs</a><a href="../#contact"><i class="fa-solid fa-envelope"></i>Contact</a></div><div class="footer-legal"><div>Registered Nonprofit Organization under the Societies Registration Act XXI of 1860, RJSC, Government of Bangladesh. | Registration No: S-14789/2026</div><div class="footer-right"><a href="../privacy-policy/">Privacy Policy</a></div></div></div></footer>`;

  fetch(source, {cache:'no-store'}).then(r => {
    if (!r.ok) throw new Error(`Page source unavailable (${r.status})`);
    return r.text();
  }).then(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]');
    if (desc) {
      let current = document.querySelector('meta[name="description"]');
      if (!current) { current = document.createElement('meta'); current.name='description'; document.head.appendChild(current); }
      current.content = desc.content;
    }
    doc.querySelectorAll('style').forEach(s => {
      const style = document.createElement('style');
      style.textContent = s.textContent.replaceAll("url('./assets/", "url('../assets/").replaceAll('url("./assets/', 'url("../assets/');
      document.head.appendChild(style);
    });
    const extra = document.createElement('style'); extra.textContent = shellCss; document.head.appendChild(extra);
    const main = doc.querySelector('main');
    if (!main) throw new Error('Main content not found');
    root.outerHTML = shell(main.outerHTML.replaceAll('src="assets/', 'src="../assets/').replaceAll("src='assets/", "src='../assets/").replaceAll('href="assets/', 'href="../assets/'));
    document.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', cleanHref(a.getAttribute('href'))));
    const menu = document.getElementById('menu'), hamburger = document.getElementById('hamburger');
    if (menu && hamburger) hamburger.addEventListener('click',()=>menu.classList.toggle('active'));
    document.querySelectorAll('.menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('active')));

    const scripts = [...doc.scripts];
    const appendScript = index => {
      if (index >= scripts.length) return;
      const old = scripts[index];
      const code = old.textContent || '';
      if (!old.src && /const menu=document\.getElementById\('menu'\)/.test(code)) return appendScript(index + 1);
      const s = document.createElement('script');
      if (old.src) {
        const file = old.getAttribute('src');
        s.src = file.startsWith('http') ? file : `../${file.replace(/^\.\//,'')}`;
        s.async = false;
        s.onload = () => appendScript(index + 1);
        s.onerror = () => appendScript(index + 1);
        document.body.appendChild(s);
      } else {
        s.textContent = code;
        document.body.appendChild(s);
        appendScript(index + 1);
      }
    };
    appendScript(0);
  }).catch(err => {
    console.error(err);
    root.innerHTML = '<div style="padding:160px 20px;text-align:center;font-family:sans-serif"><h1>Page temporarily unavailable</h1><p>Please return to the homepage and try again.</p><p style="margin-top:20px"><a href="../">Back to Youth Connect</a></p></div>';
  });
})();