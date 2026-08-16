(() => {
  const source = document.body.dataset.source;
  const active = document.body.dataset.active || '';
  if (!source) return;
  const root = document.getElementById('cleanRoot');
  const routeMap = {'team.html':'team/','events.html':'events/','campaigns.html':'campaigns/','campaign-menstrual-health.html':'campaign-menstrual-health/','get-involved.html':'get-involved/','donation.html':'donation/','volunteer.html':'volunteer/','partner.html':'partner/','privacy-policy.html':'privacy-policy/'};
  const cleanHref = href => {
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return href;
    const [path, hash=''] = href.split('#'); const [plain, query=''] = path.split('?');
    if (plain === 'index.html' || plain === './index.html') return `../${query?'?'+query:''}${hash?'#'+hash:''}`;
    if (routeMap[plain]) return `../${routeMap[plain]}${query?'?'+query:''}${hash?'#'+hash:''}`;
    return href;
  };
  const shellCss = `
    .more-wrap{position:relative;display:flex;align-items:center}
    .more-toggle{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;padding:0;border:1px solid rgba(185,211,255,.45);border-radius:13px;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;transition:.22s}
    .more-toggle:hover,.more-toggle[aria-expanded="true"]{background:#fff;border-color:#dbe5f0;transform:translateY(-1px)}
    .more-toggle i{color:#b9d3ff;font-size:18px}
    .more-toggle:hover i,.more-toggle[aria-expanded="true"] i{color:#123a5c}
    .more-drawer{display:none;position:absolute;top:50px;right:0;min-width:210px;padding:9px;border-radius:16px;background:rgba(14,13,56,.99);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 55px rgba(0,0,0,.32);z-index:150}
    .more-drawer.open{display:grid;gap:6px}
    .more-drawer a{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:11px;color:#fff;font-size:12px;font-weight:800;background:rgba(255,255,255,.05);border:1px solid transparent}
    .more-drawer a:hover{background:rgba(18,104,255,.18);border-color:rgba(16,200,255,.25)}
    .more-drawer a i{width:18px;text-align:center;color:#ffc83d}
    @media(max-width:1140px){.more-wrap{display:block;width:100%}.more-toggle{width:48px;height:48px;margin-left:auto}.more-drawer{position:static;min-width:0;margin-top:6px;box-shadow:none;background:rgba(255,255,255,.035)}.more-drawer a{min-height:44px}}
  `;
  const shell = main => `<div class="sdg-stripe"></div><header><div class="container nav"><a href="../" class="brand"><img src="../assets/YCF.png" alt="Youth Connect Foundation Logo"><div><div class="brand-title">YOUTH CONNECT</div><div class="brand-subtitle">FOUNDATION</div></div></a><nav class="menu" id="menu"><a href="../" class="${active==='home'?'active':''}"><i class="fa-solid fa-house"></i>Home</a><a href="../team/" class="${active==='team'?'active':''}"><i class="fa-solid fa-users"></i>Team</a><a href="../events/" class="${active==='events'?'active':''}"><i class="fa-solid fa-calendar-days"></i>Event</a><a href="../campaigns/" class="${active==='campaigns'?'active':''}"><i class="fa-solid fa-bullhorn"></i>Campaigns</a><a href="../get-involved/" class="${active==='get-involved'?'active':''}"><i class="fa-solid fa-handshake-angle"></i>Get Involved</a><a href="../donation/" class="donate-nav ${active==='donation'?'active':''}"><i class="fa-solid fa-heart"></i>Donate</a><div class="more-wrap"><button class="more-toggle" id="moreToggle" type="button" aria-label="Open navigation drawer" aria-expanded="false" aria-controls="moreDrawer"><i class="fa-solid fa-bars"></i></button><div class="more-drawer" id="moreDrawer"><a href="../#about"><i class="fa-solid fa-circle-info"></i>About</a><a href="../#program"><i class="fa-solid fa-rocket"></i>Programs</a><a href="../#contact"><i class="fa-solid fa-envelope"></i>Contact</a></div></div></nav><button class="hamburger" id="hamburger" aria-label="Open menu">☰</button></div></header>${main}<footer><div class="container footer-grid"><a href="../" class="brand"><img src="../assets/YCF.png" alt="Youth Connect Foundation Logo"><div><div class="brand-title">YOUTH CONNECT FOUNDATION</div><div class="brand-subtitle">© 2026 Youth Connect Foundation. All Rights Reserved.</div></div></a><div class="social"><a href="https://www.facebook.com/YouthConnectFdn" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i></a><a href="https://www.linkedin.com/company/youthconnectfdn" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin-in"></i></a><a href="https://www.instagram.com/youthconnectfdn" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a><a href="https://x.com/YouthConnectFdn" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter"></i></a></div><div class="listed-badge"><span>Listed on</span><img src="../assets/google-for-non-profits.webp" alt="Google for Nonprofits"></div><div class="footer-legal"><div>Registered Nonprofit Organization under the Societies Registration Act XXI of 1860, RJSC, Government of Bangladesh. | Registration No: S-14789/2026</div><div class="footer-right"><a href="../privacy-policy/">Privacy Policy</a></div></div></div></footer>`;
  fetch(source,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Page source unavailable (${r.status})`);return r.text()}).then(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html'); document.title=doc.title;
    const desc=doc.querySelector('meta[name="description"]'); if(desc){let current=document.querySelector('meta[name="description"]');if(!current){current=document.createElement('meta');current.name='description';document.head.appendChild(current)}current.content=desc.content}
    doc.querySelectorAll('style').forEach(s=>{const style=document.createElement('style');style.textContent=s.textContent.replaceAll("url('./assets/","url('../assets/").replaceAll('url("./assets/','url("../assets/');document.head.appendChild(style)});
    const extra=document.createElement('style');extra.textContent=shellCss;document.head.appendChild(extra);
    const main=doc.querySelector('main');if(!main)throw new Error('Main content not found');
    root.outerHTML=shell(main.outerHTML.replaceAll('src="assets/','src="../assets/').replaceAll("src='assets/","src='../assets/").replaceAll('href="assets/','href="../assets/'));
    document.querySelectorAll('a[href]').forEach(a=>a.setAttribute('href',cleanHref(a.getAttribute('href'))));
    const menu=document.getElementById('menu'),hamburger=document.getElementById('hamburger'),moreToggle=document.getElementById('moreToggle'),moreDrawer=document.getElementById('moreDrawer');
    if(menu&&hamburger) hamburger.addEventListener('click',()=>menu.classList.toggle('active'));
    if(moreToggle&&moreDrawer){
      const closeMore=()=>{moreDrawer.classList.remove('open');moreToggle.setAttribute('aria-expanded','false')};
      moreToggle.addEventListener('click',e=>{e.stopPropagation();const open=!moreDrawer.classList.contains('open');moreDrawer.classList.toggle('open',open);moreToggle.setAttribute('aria-expanded',String(open))});
      document.addEventListener('click',e=>{if(!e.target.closest('.more-wrap'))closeMore()});
      moreDrawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMore));
    }
    document.querySelectorAll('.menu>a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('active')));
    const scripts=[...doc.scripts];
    const appendScript=index=>{if(index>=scripts.length)return;const old=scripts[index],s=document.createElement('script');if(old.src){const file=old.getAttribute('src');s.src=file.startsWith('http')?file:`../${file.replace(/^\.\//,'')}`;s.async=false;s.onload=()=>appendScript(index+1);s.onerror=()=>appendScript(index+1);document.body.appendChild(s)}else{s.textContent=old.textContent||'';document.body.appendChild(s);appendScript(index+1)}};
    appendScript(0);
  }).catch(err=>{console.error(err);root.innerHTML='<div style="padding:160px 20px;text-align:center;font-family:sans-serif"><h1>Page temporarily unavailable</h1><p>Please return to the homepage and try again.</p><p style="margin-top:20px"><a href="../">Back to Youth Connect</a></p></div>'});
})();