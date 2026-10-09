// Animaciones on-scroll con IntersectionObserver
// Mejoras: navbar scrolled, smooth scroll con offset, feedback inline en formularios, login modal (demo)
document.addEventListener('DOMContentLoaded',function(){
  /* On-scroll animations */
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('animate');
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.12});

  document.querySelectorAll('.anim').forEach(el=>obs.observe(el));

  /* Navbar: agregar clase .scrolled cuando se baja */
  const navbar = document.querySelector('.navbar');
  if(navbar){
    let lastKnownScroll = 0, ticking = false;
    const onScroll = ()=>{
      lastKnownScroll = window.scrollY;
      if(!ticking){
        window.requestAnimationFrame(()=>{
          if(lastKnownScroll > 20) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* Smooth scroll with offset for fixed navbar */
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const href = this.getAttribute('href');
      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        const navbarHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 12;
        window.scrollTo({top, behavior:'smooth'});

        // Cerrar menu colapsado en móviles si está abierto
        const bsCollapse = document.querySelector('.navbar-collapse');
        if(bsCollapse && bsCollapse.classList.contains('show')){
          const bs = bootstrap.Collapse.getInstance(bsCollapse) || new bootstrap.Collapse(bsCollapse);
          bs.hide();
        }
      }
    });
  });

  /* Contact form: inline feedback y accesibilidad */
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.setAttribute('aria-live','polite');
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      // limpiar mensajes previos
      const existing = contactForm.querySelector('.alert');
      if(existing) existing.remove();

      if(contactForm.checkValidity()){
        const submit = contactForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        const msg = document.createElement('div');
        msg.className = 'alert alert-success mt-2';
        msg.role = 'status';
        msg.textContent = 'Gracias, su mensaje ha sido enviado.';
        contactForm.prepend(msg);
        setTimeout(()=>{ submit.disabled = false; contactForm.reset(); }, 900);
      } else {
        contactForm.reportValidity();
      }
    });
  }

  /* Login modal: validación y llamadas reales al backend. Muestra mensaje de bienvenida con nombre y apellido y permite cerrar sesión. */
  const loginForm = document.getElementById('loginForm');
  const loginModalEl = document.getElementById('loginModal');
  const authArea = document.getElementById('authArea');
  const initialAuthHTML = authArea ? authArea.innerHTML : '';

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

  function setLoggedIn(user){
    if(!authArea) return;
    authArea.innerHTML = `<div class="d-flex align-items-center gap-2"><span class="fw-semibold">Hola, ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</span><button id="logoutBtn" class="btn btn-outline-danger btn-sm">Cerrar sesión</button></div>`;
    const btn = document.getElementById('logoutBtn'); if(btn) btn.addEventListener('click', logout);
    // If the page was opened with ?redirect=..., go there after login
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if(redirect){
        window.location.href = redirect;
      }
    } catch(e){}
  }

  function setLoggedOut(){
    if(!authArea) return;
    authArea.innerHTML = initialAuthHTML;
    // recargar para re-inicializar handlers de los modales (simple y seguro)
    location.reload();
  }

  async function logout(){
    const token = localStorage.getItem('nl_token');
    try{ if(token){ await fetch((window.API_BASE||'') + '/api/auth/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type':'application/json' } }); } }catch(e){}
    localStorage.removeItem('nl_token'); localStorage.removeItem('nl_user'); setLoggedOut();
  }

  // Si ya hay usuario en localStorage, mostrar estado logueado
  try{ const saved = localStorage.getItem('nl_user'); if(saved){ setLoggedIn(JSON.parse(saved)); } }catch(e){ localStorage.removeItem('nl_user'); }

  if(loginForm && loginModalEl){
    const loginModal = new bootstrap.Modal(loginModalEl);

    loginModalEl.addEventListener('shown.bs.modal', function(){ const user = document.getElementById('loginUsername'); if(user) user.focus(); });

    loginForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const pwd = document.getElementById('loginPassword').value;
      const feedback = document.getElementById('loginFeedback');
      if(feedback){ feedback.style.display = 'none'; feedback.className = ''; feedback.textContent = ''; }

      if(!loginForm.checkValidity()){ loginForm.querySelectorAll(':invalid').forEach(i=>i.classList.add('is-invalid')); return; }

      const submit = loginForm.querySelector('button[type="submit"]');
      submit.disabled = true; if(feedback){ feedback.className = 'text-info'; feedback.style.display=''; feedback.textContent = 'Iniciando sesión...'; }

      try{
        const res = await fetch((window.API_BASE||'') + '/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password: pwd }) });
        if(res.ok){
          const data = await res.json();
          localStorage.setItem('nl_token', data.token);
          localStorage.setItem('nl_user', JSON.stringify(data.user));
          if(feedback){ feedback.className='text-success'; feedback.textContent = `Bienvenido ${data.user.first_name} ${data.user.last_name}`; }
          setLoggedIn(data.user);
          submit.disabled = false;
          setTimeout(()=>{ loginModal.hide(); loginForm.reset(); if(feedback) feedback.style.display='none'; },900);
        } else {
          const data = await res.json(); if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent = data.error || 'Credenciales inválidas.'; }
        }
      }catch(err){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='No se pudo conectar con la API.'; } }
      submit.disabled = false;
    });

    loginModalEl.addEventListener('hidden.bs.modal', function(){ const trigger = document.getElementById('loginTrigger'); if(trigger) trigger.focus(); loginForm.querySelectorAll('.is-invalid').forEach(i=>i.classList.remove('is-invalid')); const feedback = document.getElementById('loginFeedback'); if(feedback){ feedback.style.display='none'; feedback.className=''; feedback.textContent=''; } });
  }

  /* Registro: validación de contraseñas y manejo similar al login, ahora requiere nombre y apellido y envía first_name/last_name al backend. */
  const registerForm = document.getElementById('registerForm');
  const registerModalEl = document.getElementById('registerModal');
  if(registerForm && registerModalEl){
    const registerModal = new bootstrap.Modal(registerModalEl);

    registerModalEl.addEventListener('shown.bs.modal', function(){ const f = document.getElementById('registerFirstName'); if(f) f.focus(); const birth = document.getElementById('registerBirth'); const ageNode = document.getElementById('calculatedAge'); if(birth && ageNode && birth.value){ const a = calculateAge(birth.value); ageNode.textContent = a; } });

    // Mostrar campo de especialidad si selecciona role=doctor y marcarlo como obligatorio
    const roleSelect = document.getElementById('registerRole');
    if(roleSelect){
      const specialtyField = document.getElementById('specialtyField');
      roleSelect.addEventListener('change', function(){
        const spec = document.getElementById('registerSpecialty');
        if(this.value === 'doctor'){ specialtyField.classList.remove('d-none'); if(spec) spec.setAttribute('required',''); } else { specialtyField.classList.add('d-none'); if(spec){ spec.removeAttribute('required'); spec.value = ''; } }
      });
    }

    // Mostrar edad en tiempo real al seleccionar fecha de nacimiento
    const birthInput = document.getElementById('registerBirth');
    if(birthInput){ birthInput.addEventListener('change', function(){ const ageNode = document.getElementById('calculatedAge'); if(!ageNode) return; if(this.value){ ageNode.textContent = calculateAge(this.value); } else { ageNode.textContent = '—'; } }); }

    function calculateAge(birthStr){ const bd = new Date(birthStr); if(Number.isNaN(bd.getTime())) return '—'; const diff = Date.now() - bd.getTime(); const ageDt = new Date(diff); return Math.abs(ageDt.getUTCFullYear() - 1970); }

    registerForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const firstName = document.getElementById('registerFirstName').value.trim();
      const lastName = document.getElementById('registerLastName').value.trim();
      const username = document.getElementById('registerUsername').value.trim();
      const cedula = document.getElementById('registerCedula').value.trim();
      const phone = document.getElementById('registerPhone').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const role = document.getElementById('registerRole').value;
      const pwd = document.getElementById('registerPassword').value;
      const confirm = document.getElementById('registerConfirm').value;
      const feedback = document.getElementById('registerFeedback');
      if(feedback){ feedback.style.display='none'; feedback.className=''; feedback.textContent=''; }

      // Validación básica
      if(!registerForm.checkValidity()){ registerForm.querySelectorAll(':invalid').forEach(i=>i.classList.add('is-invalid')); return; }

      // Validaciones adicionales
      if(cedula && !/^\d{6,12}$/.test(cedula)){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Número de cédula inválido.'; } return; }
      if(!/^[0-9+\s()-]{6,20}$/.test(phone)){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Número de teléfono inválido.'; } return; }
      const birth = document.getElementById('registerBirth').value; if(!birth){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Indica tu fecha de nacimiento.'; } return; }
      const bd = new Date(birth); if(Number.isNaN(bd.getTime()) || bd > new Date()){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Fecha de nacimiento inválida.'; } return; }
      if(!username || username.length < 3){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='El nombre de usuario debe tener al menos 3 caracteres.'; } return; }
      if(!firstName || !lastName){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Introduce nombre y apellido.'; } return; }
      if(!role){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Selecciona un rol.'; } return; }
      const specialty = document.getElementById('registerSpecialty') ? document.getElementById('registerSpecialty').value.trim() : null;
      if(role === 'doctor' && (!specialty || specialty.length===0)){ if(feedback){ feedback.className='text-danger'; feedback.style.display=''; feedback.textContent='Indica especialidad para el rol doctor.'; } return; }
      if(pwd !== confirm){ if(feedback){ feedback.className = 'text-danger'; feedback.style.display=''; feedback.textContent = 'Las contraseñas no coinciden.'; } return; }

      const submit = registerForm.querySelector('button[type="submit"]');
      submit.disabled = true; if(feedback){ feedback.className = 'text-info'; feedback.style.display=''; feedback.textContent = 'Creando cuenta...'; }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        username,
        cedula,
        phone,
        email,
        birth_date: birth,
        role,
        specialty: specialty || null,
        password: pwd
      };

      try{
        const r = await fetch((window.API_BASE || '') + '/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(r.status === 201){ const data = await r.json(); if(feedback){ feedback.className='text-success'; feedback.textContent=`Cuenta creada correctamente. Edad: ${data.age ?? '—'}`; } submit.disabled = false; setTimeout(()=>{ registerModal.hide(); registerForm.reset(); if(feedback) feedback.style.display='none'; },900);
        } else if(r.status === 409){ if(feedback){ feedback.className='text-danger'; feedback.textContent='El nombre de usuario o correo ya existe.'; } submit.disabled = false; }
        else if(r.status === 422){ const data = await r.json(); if(feedback){ feedback.className='text-danger'; feedback.textContent = data.error || 'Datos inválidos.'; } submit.disabled = false; }
        else { const data = await r.json(); if(feedback){ feedback.className='text-danger'; feedback.textContent = data.error || 'Error del servidor.'; } submit.disabled=false; }
      }catch(err){ if(feedback){ feedback.className='text-danger'; feedback.textContent='No se pudo conectar con la API.'; } submit.disabled=false; }
    });

    registerModalEl.addEventListener('hidden.bs.modal', function(){ const trigger = document.getElementById('registerTrigger'); if(trigger) trigger.focus(); registerForm.querySelectorAll('.is-invalid').forEach(i=>i.classList.remove('is-invalid')); const feedback = document.getElementById('registerFeedback'); if(feedback){ feedback.style.display='none'; feedback.className=''; feedback.textContent=''; } });
  }
});