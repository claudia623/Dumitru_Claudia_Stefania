// =====================================================
// AUTH MODULE - CONECTAT LA BACKEND API
// =====================================================

(function(){
  const API_BASE = 'http://localhost:3000/api';
  var SESSION_KEY = 'currentUser';
  var TOKEN_KEY = 'auth_token';

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  function sanitize(str){ 
    return String(str||'').trim(); 
  }

  function isEmail(x){ 
    return /@/.test(String(x||'')); 
  }

  function getToken(){
    try{ return localStorage.getItem(TOKEN_KEY); }catch(e){ return null; }
  }

  function setToken(token){
    if(token){ localStorage.setItem(TOKEN_KEY, token); }
    else { localStorage.removeItem(TOKEN_KEY); }
  }

  function getCurrentUser(){
    try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(e){ return null; }
  }

  function setCurrentUser(user){
    if(user){ 
      localStorage.setItem(SESSION_KEY, JSON.stringify({ 
        id_utilizator: user.id_utilizator, 
        username: user.username, 
        email: user.email,
        rol: user.rol
      })); 
    }
    else { 
      localStorage.removeItem(SESSION_KEY); 
    }
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: getCurrentUser() }}));
  }

  function clearAuth(){
    setToken(null);
    setCurrentUser(null);
  }

  // =====================================================
  // AUTH API CALLS
  // =====================================================

  function register(username, email, password, nume_complet){
    return new Promise(function(resolve, reject){
      username = sanitize(username);
      email = sanitize(email).toLowerCase();
      password = String(password||'');
      if(!username || !email || !password){ 
        return reject(new Error('Completează toate câmpurile.')); 
      }

      fetch(API_BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, parola: password, nume_complet })
      })
      .then(function(res){
        if(!res.ok) return res.json().then(function(err){ throw new Error(err.error || 'Eroare înregistrare'); });
        return res.json();
      })
      .then(function(data){
        setToken(data.token);
        setCurrentUser(data.user);
        resolve(data.user);
      })
      .catch(function(err){
        reject(new Error(err.message || 'Eroare înregistrare'));
      });
    });
  }

  function login(usernameOrEmail, password){
    return new Promise(function(resolve, reject){
      var input = sanitize(usernameOrEmail);
      var pass = String(password||'');
      if(!input || !pass){ 
        return reject(new Error('Completează utilizator și parolă.')); 
      }

      fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: input, parola: pass })
      })
      .then(function(res){
        if(!res.ok) return res.json().then(function(err){ throw new Error(err.error || 'Eroare autentificare'); });
        return res.json();
      })
      .then(function(data){
        setToken(data.token);
        setCurrentUser(data.user);
        resolve(data.user);
      })
      .catch(function(err){
        reject(new Error(err.message || 'Eroare autentificare'));
      });
    });
  }

  function logout(){ 
    clearAuth();
  }

  function updateProfile(profileData){
    return new Promise(function(resolve, reject){
      var token = getToken();
      if(!token) return reject(new Error('Nu esti logat'));

      fetch(API_BASE + '/auth/profil', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(profileData)
      })
      .then(function(res){
        if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
        return res.json();
      })
      .then(function(data){ resolve(data); })
      .catch(function(err){ reject(err); });
    });
  }

  function changePassword(parola_veche, parola_noua){
    return new Promise(function(resolve, reject){
      var token = getToken();
      if(!token) return reject(new Error('Nu esti logat'));

      fetch(API_BASE + '/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ parola_veche, parola_noua })
      })
      .then(function(res){
        if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
        return res.json();
      })
      .then(function(data){ resolve(data); })
      .catch(function(err){ reject(err); });
    });
  }

  // =====================================================
  // UI MANAGEMENT
  // =====================================================

  function ensureAuthControls(){
    try{
      var container = document.querySelector('nav .nav-right');
      if(!container) return; 
      var existing = container.querySelector('#auth-controls');
      if(existing) existing.remove();
      var user = getCurrentUser();
      var wrap = document.createElement('span');
      wrap.id = 'auth-controls';
      wrap.className = 'user-menu';
      if(user){
        // toggle button
        var toggle = document.createElement('button');
        toggle.type = 'button'; 
        toggle.className = 'user-menu-toggle'; 
        toggle.setAttribute('aria-haspopup','true'); 
        toggle.setAttribute('aria-expanded','false');
        toggle.innerHTML = 'Salut, ' + user.username + ' \u25BE';
        wrap.appendChild(toggle);
        // dropdown
        var dd = document.createElement('div'); 
        dd.className = 'user-menu-dropdown';
        var aProfile = document.createElement('a'); 
        aProfile.className='user-menu-item'; 
        aProfile.href='account.html'; 
        aProfile.textContent='Profil';
        var aFav = document.createElement('a'); 
        aFav.className='user-menu-item'; 
        aFav.href='favorites.html'; 
        aFav.textContent='Favorite';
        var aCurrent = document.createElement('a'); 
        aCurrent.className='user-menu-item'; 
        aCurrent.href='current-order.html'; 
        aCurrent.textContent='Comanda curentă';
        var aHistory = document.createElement('a'); 
        aHistory.className='user-menu-item'; 
        aHistory.href='orders.html'; 
        aHistory.textContent='Istoric comenzi';
        var div = document.createElement('div'); 
        div.className='menu-divider';
        var lo = document.createElement('button'); 
        lo.type='button'; 
        lo.id='logout-btn'; 
        lo.className='logout-btn'; 
        lo.textContent='Delogare';
        dd.appendChild(aProfile); 
        dd.appendChild(aFav); 
        dd.appendChild(aCurrent); 
        dd.appendChild(aHistory); 
        dd.appendChild(div); 
        dd.appendChild(lo);
        wrap.appendChild(dd);
        // hide login link if present
        container.querySelectorAll('.login-link').forEach(function(a){ a.style.display = 'none'; });
        // toggle behavior
        toggle.addEventListener('click', function(e){
          e.stopPropagation();
          var isOpen = wrap.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        document.addEventListener('click', function(){ 
          wrap.classList.remove('open'); 
          toggle.setAttribute('aria-expanded','false'); 
        });
      } else {
        // show or add login link
        var link = container.querySelector('.login-link');
        if(link){ 
          link.style.display = 'inline-block'; 
        }
        else {
          var a = document.createElement('a'); 
          a.href = 'login.html'; 
          a.className = 'login-link'; 
          a.textContent = 'Login'; 
          wrap.appendChild(a);
        }
      }
      container.appendChild(wrap);
    }catch(e){ console.error('Auth controls error:', e); }
  }

  document.addEventListener('DOMContentLoaded', ensureAuthControls);
  window.addEventListener('authChanged', ensureAuthControls);

  // =====================================================
  // GLOBAL API
  // =====================================================

  window.auth = { 
    register: register, 
    login: login, 
    logout: logout, 
    getCurrentUser: getCurrentUser,
    getToken: getToken,
    updateProfile: updateProfile,
    changePassword: changePassword
  };

  // =====================================================
  // LOGOUT HANDLER
  // =====================================================

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('#logout-btn');
    if(!btn) return;
    e.preventDefault();
    logout();
    try{ 
      window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Te-ai delogat.', position:'center'}})); 
    }catch(x){}
    try{ 
      window.location.href = 'login.html'; 
    }catch(x){}
  });

})();
