(function(){
  var USERS_KEY = 'users';
  var SESSION_KEY = 'currentUser';

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveUsers(list){ localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

  function getCurrentUser(){
    try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(e){ return null; }
  }
  function setCurrentUser(user){
    if(user){ localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, username: user.username, email: user.email })); }
    else { localStorage.removeItem(SESSION_KEY); }
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: getCurrentUser() }}));
  }

  function isEmail(x){ return /@/.test(String(x||'')); }
  function sanitize(str){ return String(str||'').trim(); }

  function register(username, email, password){
    return new Promise(function(resolve, reject){
      username = sanitize(username);
      email = sanitize(email).toLowerCase();
      password = String(password||'');
      if(!username || !email || !password){ return reject(new Error('Completează toate câmpurile.')); }
      var users = loadUsers();
      if(users.some(function(u){ return u.username.toLowerCase() === username.toLowerCase(); })){
        return reject(new Error('Numele de utilizator este deja folosit.'));
      }
      if(users.some(function(u){ return (u.email||'').toLowerCase() === email; })){
        return reject(new Error('Există deja un cont cu acest email.'));
      }
      var newUser = { id: 'u_' + Date.now(), username: username, email: email, password: password };
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      resolve({ id: newUser.id, username: newUser.username, email: newUser.email });
    });
  }

  function login(usernameOrEmail, password){
    return new Promise(function(resolve, reject){
      var input = sanitize(usernameOrEmail);
      var pass = String(password||'');
      if(!input || !pass){ return reject(new Error('Completează utilizator și parolă.')); }
      var users = loadUsers();
      var user = users.find(function(u){
        if(isEmail(input)) return (u.email||'').toLowerCase() === input.toLowerCase();
        return u.username.toLowerCase() === input.toLowerCase();
      });
      if(!user || user.password !== pass){ return reject(new Error('Date de autentificare invalide.')); }
      setCurrentUser(user);
      resolve({ id: user.id, username: user.username, email: user.email });
    });
  }

  function logout(){ setCurrentUser(null); }

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
        toggle.type = 'button'; toggle.className = 'user-menu-toggle'; toggle.setAttribute('aria-haspopup','true'); toggle.setAttribute('aria-expanded','false');
        toggle.innerHTML = 'Salut, ' + user.username + ' \u25BE';
        wrap.appendChild(toggle);
        // dropdown
        var dd = document.createElement('div'); dd.className = 'user-menu-dropdown';
        var aProfile = document.createElement('a'); aProfile.className='user-menu-item'; aProfile.href='account.html'; aProfile.textContent='Profil';
        var aFav = document.createElement('a'); aFav.className='user-menu-item'; aFav.href='favorites.html'; aFav.textContent='Favorite';
        var aCurrent = document.createElement('a'); aCurrent.className='user-menu-item'; aCurrent.href='current-order.html'; aCurrent.textContent='Comanda curentă';
        var aHistory = document.createElement('a'); aHistory.className='user-menu-item'; aHistory.href='orders.html'; aHistory.textContent='Istoric comenzi';
        var div = document.createElement('div'); div.className='menu-divider';
        var lo = document.createElement('button'); lo.type='button'; lo.id='logout-btn'; lo.className='logout-btn'; lo.textContent='Delogare';
        dd.appendChild(aProfile); dd.appendChild(aFav); dd.appendChild(aCurrent); dd.appendChild(aHistory); dd.appendChild(div); dd.appendChild(lo);
        wrap.appendChild(dd);
        // hide login link if present
        container.querySelectorAll('.login-link').forEach(function(a){ a.style.display = 'none'; });
        // toggle behavior
        toggle.addEventListener('click', function(e){
          e.stopPropagation();
          var isOpen = wrap.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        document.addEventListener('click', function(){ wrap.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
      } else {
        // show or add login link
        var link = container.querySelector('.login-link');
        if(link){ link.style.display = 'inline-block'; }
        else {
          var a = document.createElement('a'); a.href = 'login.html'; a.className = 'login-link'; a.textContent = 'Login'; wrap.appendChild(a);
        }
      }
      container.appendChild(wrap);
    }catch(e){ /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', ensureAuthControls);
  window.addEventListener('authChanged', ensureAuthControls);

  // global API
  window.auth = { register: register, login: login, logout: logout, getCurrentUser: getCurrentUser };

  // delegate logout click globally
  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('#logout-btn');
    if(!btn) return;
    e.preventDefault();
    logout();
    try{ window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Te-ai delogat.', position:'center'}})); }catch(x){}
    try{ window.location.href = 'login.html'; }catch(x){}
  });
})();
