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

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const twoFaForm = document.getElementById('twoFaForm');
    
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
            
            // Simulating email sent via alert
            alert(`--- SİMÜLASYON E-POSTA ---\nAlıcı: ${email}\n\nSiNUbeatmaker Kayıt Doğrulama Kodunuz: ${code}\n\nLütfen bu kodu ekrandaki alana giriniz.`);
            
            document.getElementById('registerBox').style.display = 'none';
            document.getElementById('twoFaBox').style.display = 'block';
            document.getElementById('twoFaError').style.display = 'none';
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
});

function toggleForms() {
    const loginBox = document.getElementById('loginBox');
    const registerBox = document.getElementById('registerBox');
    const twoFaBox = document.getElementById('twoFaBox');
    
    if (loginBox.style.display === 'none') {
        loginBox.style.display = 'block';
        registerBox.style.display = 'none';
        twoFaBox.style.display = 'none';
    } else {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
        twoFaBox.style.display = 'none';
    }
}

function cancel2FA() {
    tempRegistrationData = null;
    document.getElementById('twoFaForm').reset();
    document.getElementById('twoFaBox').style.display = 'none';
    document.getElementById('registerBox').style.display = 'block';
}
