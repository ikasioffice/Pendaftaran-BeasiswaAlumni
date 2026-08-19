/* === ADMIN.JS === */

// Redirect if already logged in
if (DB.isLoggedIn()) window.location.href = 'dashboard.html';

function togglePw() {
    const pw = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (pw.type === 'password') {
        pw.type = 'text';
        icon.className = 'fas fa-eye-slash toggle-password';
    } else {
        pw.type = 'password';
        icon.className = 'fas fa-eye toggle-password';
    }
}

function doLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const alert = document.getElementById('loginAlert');
    const btn = document.getElementById('btnLogin');

    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    alert.classList.remove('show');

    if (!username) { document.getElementById('err-username').classList.add('show'); return; }
    if (!password) { document.getElementById('err-password').classList.add('show'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';

    setTimeout(() => {
        if (username === ADMIN_CREDS.user && password === ADMIN_CREDS.pass) {
            DB.login();
            window.location.href = 'dashboard.html';
        } else {
            alert.classList.add('show');
            document.getElementById('loginAlertMsg').textContent = 'Username atau password salah. Coba lagi.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            document.getElementById('password').value = '';
        }
    }, 800);
}

// Enter key support
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
});
