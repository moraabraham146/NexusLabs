(function() {
    const API_BASE = "http://localhost/NexusLabs/backend";

    const qs = (sel) => document.querySelector(sel);
    
    const user = JSON.parse(localStorage.getItem('user'));

    async function init() {
        if (!user) {
            const main = qs('main.container') || document.body;
            main.innerHTML = `
                <div class="container py-5 text-center">
                    <div class="card mx-auto shadow-sm" style="max-width:500px">
                        <div class="card-body">
                            <h5 class="text-danger">Acceso Denegado</h5>
                            <p>Debes iniciar sesión para ver tu panel médico.</p>
                            <a href="index.html" class="btn btn-primary">Ir al Inicio</a>
                        </div>
                    </div>
                </div>`;
            return;
        }

        setupUI();
        await renderDoctorOptions();
        refreshViews();
        initEvents();
    }

    function setupUI() {
        const welcomeMsg = qs('#welcomeMessage');
        if (welcomeMsg) welcomeMsg.textContent = `Hola, ${user.nombre}`;

        if (user.rol === 'doctor') {
            if (qs('#patientView')) qs('#patientView').style.display = 'none';
            if (qs('#doctorView')) qs('#doctorView').style.display = 'block';
        } else {
            if (qs('#patientView')) qs('#patientView').style.display = 'block';
            if (qs('#doctorView')) qs('#doctorView').style.display = 'none';
        }
    }

    async function renderDoctorOptions() {
        const sel = qs('#bookDoctor');
        if (!sel) return;

        try {
            const res = await fetch(`${API_BASE}/get_doctors.php`);
            const docs = await res.json();

            sel.innerHTML = '<option value="">Selecciona un especialista...</option>';
            docs.forEach(d => {
                const o = document.createElement('option');
                o.value = d.usuario;
                o.textContent = `Dr. ${d.nombre} ${d.apellido} (${d.especialidad || 'General'})`;
                sel.appendChild(o);
            });
        } catch (err) {
            sel.innerHTML = '<option value="">Error al cargar médicos</option>';
        }
    }

    async function refreshViews() {
        const appointmentsNode = user.rol === 'doctor' ? qs('#doctorAppointments') : qs('#myAppointments');
        if (!appointmentsNode) return;

        try {
            const res = await fetch(`${API_BASE}/get_appointments.php?usuario=${user.usuario}&rol=${user.rol}`);
            const citas = await res.json();

            appointmentsNode.innerHTML = citas.length ? '' : '<p class="text-muted">No tienes citas registradas.</p>';

            citas.forEach(c => {
                const div = document.createElement('div');
                div.className = 'card mb-2 p-3 shadow-sm border-start border-primary border-4';
                div.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <strong>${new Date(c.fecha_hora).toLocaleString()}</strong>
                        <span class="badge bg-info">${c.estado}</span>
                    </div>
                    <div class="small text-muted">${user.rol === 'doctor' ? 'Paciente: ' + c.nombre_paciente : 'Médico: ' + c.nombre_doctor}</div>
                    <div class="mt-1">${c.motivo}</div>
                `;
                appointmentsNode.appendChild(div);
            });
        } catch (err) {
            console.error("Error cargando citas");
        }
    }

    function initEvents() {
        const bookForm = qs('#bookForm');
        if (bookForm) {
            bookForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    paciente: user.usuario,
                    doctor: qs('#bookDoctor').value,
                    fecha: qs('#bookDatetime').value,
                    motivo: qs('#bookReason').value
                };

                const res = await fetch(`${API_BASE}/save_appointment.php`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                
                if (result.success) {
                    alert("Cita agendada con éxito");
                    bookForm.reset();
                    refreshViews();
                }
            });
        }

        const logoutBtn = qs('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }
    }

    init();
})();