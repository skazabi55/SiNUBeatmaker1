// SHA-256 Hash Function using Web Crypto API
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generates a 6-digit string with all distinct digits
function generateUniqueCode() {
    let digits = '0123456789'.split('');
    let code = '';
    for(let i = 0; i < 6; i++) {
        let randIndex = Math.floor(Math.random() * digits.length);
        code += digits[randIndex];
        digits.splice(randIndex, 1);
    }
    return code;
}

// Temporary storage for registration data during 2FA
let tempRegistrationData = null;
// Temporary storage for password reset data
let tempResetData = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const twoFaForm = document.getElementById('twoFaForm');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm2 = document.getElementById('resetForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const pass = document.getElementById('loginPassword').value;
            const hash = await sha256(pass);
            
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.passwordHash === hash);
            
            if (user) {
                setCurrentUser({ username: user.username, nickname: user.nickname || user.username, role: user.role });
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'beatmaker.html';
                }
            } else {
                document.getElementById('loginError').textContent = 'Hatalı kullanıcı adı veya şifre!';
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value.trim() + '@gmail.com';
            const username = document.getElementById('regUsername').value.trim();
            const pass = document.getElementById('regPassword').value;
            const passConfirm = document.getElementById('regPasswordConfirm').value;
            
            if (pass !== passConfirm) {
                document.getElementById('regError').textContent = 'Şifreler eşleşmiyor!';
                document.getElementById('regError').style.display = 'block';
                return;
            }
            
            const db = getDB();
            if (db.users.find(u => u.username === username)) {
                document.getElementById('regError').textContent = 'Bu kullanıcı adı zaten alınmış!';
                document.getElementById('regError').style.display = 'block';
                return;
            }
            if (db.users.find(u => u.email === email)) {
                document.getElementById('regError').textContent = 'Bu e-posta adresi zaten kullanımda!';
                document.getElementById('regError').style.display = 'block';
                return;
            }
            
            const hash = await sha256(pass);
            const code = generateUniqueCode();
            
            tempRegistrationData = {
                email: email,
                username: username,
                passwordHash: hash,
                code: code
            };
            
            // Send real verification email via n8n webhook
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Doğrulama kodu gönderiliyor...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('http://localhost:5678/webhook/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, code: code })
                });
                
                if (!response.ok) throw new Error('E-posta gönderilemedi');
                
                document.getElementById('registerBox').style.display = 'none';
                document.getElementById('twoFaBox').style.display = 'block';
                document.getElementById('twoFaError').style.display = 'none';
            } catch (err) {
                console.error('n8n webhook hatası:', err);
                // Fallback: simülasyon olarak alert ile göster
                alert(`E-posta servisi şu an çalışmıyor.\nDoğrulama kodunuz: ${code}`);
                document.getElementById('registerBox').style.display = 'none';
                document.getElementById('twoFaBox').style.display = 'block';
                document.getElementById('twoFaError').style.display = 'none';
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    if (twoFaForm) {
        twoFaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const codeInput = document.getElementById('twoFaCode').value.trim();
            
            if (!tempRegistrationData) {
                alert('Kayıt verisi bulunamadı. Lütfen baştan başlayın.');
                cancel2FA();
                return;
            }
            
            if (codeInput === tempRegistrationData.code) {
                // Code matches, finalize registration
                const db = getDB();
                db.users.push({
                    username: tempRegistrationData.username,
                    nickname: tempRegistrationData.username, // Default nickname
                    email: tempRegistrationData.email,
                    passwordHash: tempRegistrationData.passwordHash,
                    role: 'user'
                });
                saveDB(db);
                
                tempRegistrationData = null;
                alert('Kayıt ve e-posta doğrulama başarılı! Lütfen giriş yapın.');
                
                document.getElementById('twoFaBox').style.display = 'none';
                document.getElementById('loginBox').style.display = 'block';
                
                // Reset forms
                document.getElementById('registerForm').reset();
                document.getElementById('twoFaForm').reset();
            } else {
                document.getElementById('twoFaError').textContent = 'Doğrulama kodu hatalı!';
                document.getElementById('twoFaError').style.display = 'block';
            }
        });
    }

    // Forgot Password: Send reset code
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgotEmail').value.trim();
            const email = emailInput + '@gmail.com';
            
            const db = getDB();
            const user = db.users.find(u => u.email === email);
            
            if (!user) {
                document.getElementById('forgotError').textContent = 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı!';
                document.getElementById('forgotError').style.display = 'block';
                return;
            }
            
            const code = generateUniqueCode();
            tempResetData = { email: email, username: user.username, code: code };
            
            const submitBtn = forgotForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Kod gönderiliyor...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('http://localhost:5678/webhook/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, code: code })
                });
                if (!response.ok) throw new Error('E-posta gönderilemedi');
            } catch (err) {
                console.error('n8n webhook hatası:', err);
                alert(`E-posta servisi şu an çalışmıyor.\nSıfırlama kodunuz: ${code}`);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
            
            document.getElementById('forgotBox').style.display = 'none';
            document.getElementById('resetBox').style.display = 'block';
            document.getElementById('resetError').style.display = 'none';
            document.getElementById('forgotError').style.display = 'none';
        });
    }

    // Forgot Password: Verify code and set new password
    if (resetForm2) {
        resetForm2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const codeInput = document.getElementById('resetCode').value.trim();
            const newPass = document.getElementById('resetNewPassword').value;
            const newPassConfirm = document.getElementById('resetNewPasswordConfirm').value;
            
            if (!tempResetData) {
                alert('Sıfırlama verisi bulunamadı. Lütfen baştan başlayın.');
                cancelForgot();
                return;
            }
            
            if (newPass !== newPassConfirm) {
                document.getElementById('resetError').textContent = 'Şifreler eşleşmiyor!';
                document.getElementById('resetError').style.display = 'block';
                return;
            }
            
            if (codeInput !== tempResetData.code) {
                document.getElementById('resetError').textContent = 'Doğrulama kodu hatalı!';
                document.getElementById('resetError').style.display = 'block';
                return;
            }
            
            // Update password in DB
            const db = getDB();
            const userIndex = db.users.findIndex(u => u.email === tempResetData.email);
            if (userIndex !== -1) {
                db.users[userIndex].passwordHash = await sha256(newPass);
                saveDB(db);
            }
            
            tempResetData = null;
            alert('Şifreniz başarıyla güncellendi! Lütfen yeni şifrenizle giriş yapın.');
            
            document.getElementById('resetBox').style.display = 'none';
            document.getElementById('loginBox').style.display = 'block';
            resetForm2.reset();
        });
    }
});

function toggleForms() {
    const loginBox = document.getElementById('loginBox');
    const registerBox = document.getElementById('registerBox');
    const twoFaBox = document.getElementById('twoFaBox');
    const forgotBox = document.getElementById('forgotBox');
    const resetBox = document.getElementById('resetBox');
    
    if (loginBox.style.display === 'none') {
        loginBox.style.display = 'block';
        registerBox.style.display = 'none';
        twoFaBox.style.display = 'none';
        if (forgotBox) forgotBox.style.display = 'none';
        if (resetBox) resetBox.style.display = 'none';
    } else {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
        twoFaBox.style.display = 'none';
        if (forgotBox) forgotBox.style.display = 'none';
        if (resetBox) resetBox.style.display = 'none';
    }
}

function cancel2FA() {
    tempRegistrationData = null;
    document.getElementById('twoFaForm').reset();
    document.getElementById('twoFaBox').style.display = 'none';
    document.getElementById('registerBox').style.display = 'block';
}

function showForgotPassword() {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('registerBox').style.display = 'none';
    document.getElementById('twoFaBox').style.display = 'none';
    document.getElementById('forgotBox').style.display = 'block';
    document.getElementById('resetBox').style.display = 'none';
    document.getElementById('forgotError').style.display = 'none';
}

function cancelForgot() {
    tempResetData = null;
    document.getElementById('forgotBox').style.display = 'none';
    document.getElementById('resetBox').style.display = 'none';
    document.getElementById('loginBox').style.display = 'block';
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    if (forgotForm) forgotForm.reset();
    if (resetForm) resetForm.reset();
}
