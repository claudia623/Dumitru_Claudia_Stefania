(function(){
    /* 
       SISTEM DE NOTIFICĂRI (TOAST)
       Afișează mesaje temporare utilizatorului (ex: "Produs adăugat în coș")
    */
    function notifyToast(message, position){
        position = position || 'bottom';
        if(position === 'center'){
            // Notificare centrată (folosită pentru erori criticale sau checkout)
            var container = document.getElementById('site-toast-center');
            if(!container){
                container = document.createElement('div');
                container.id = 'site-toast-center';
                container.className = 'site-toast-center';
                container.setAttribute('aria-live','polite');
                document.body.appendChild(container);
            }
            var t = document.createElement('div');
            t.className = 'toast toast--enter toast--center';
            t.textContent = message;
            container.appendChild(t);
            void t.offsetWidth;
            t.classList.remove('toast--enter');
            t.classList.add('toast--visible');
            setTimeout(function(){
                t.classList.remove('toast--visible');
                t.classList.add('toast--leave');
                setTimeout(function(){ try{ container.removeChild(t); }catch(e){} }, 400);
            }, 2200);
            return;
        }
        // Notificare standard (jos-stânga)
        var container = document.getElementById('site-toast');
        if(!container){
            container = document.createElement('div');
            container.id = 'site-toast';
            container.setAttribute('aria-live','polite');
            document.body.appendChild(container);
        }
        var t = document.createElement('div');
        t.className = 'toast toast--enter';
        t.textContent = message;
        container.appendChild(t);
        
        void t.offsetWidth;
        t.classList.remove('toast--enter');
        t.classList.add('toast--visible');
        setTimeout(function(){
            t.classList.remove('toast--visible');
            t.classList.add('toast--leave');
            setTimeout(function(){ try{ container.removeChild(t); }catch(e){} }, 400);
        }, 2200);
    }

    /* 
       DIALOG DE CONFIRMARE CUSTOM
       Înlocuiește window.confirm cu o variantă stilizată care returnează un Promise.
    */
    function showConfirm(message){
        return new Promise(function(resolve){
            var overlay = document.createElement('div');
            overlay.className = 'site-confirm-overlay';
            var box = document.createElement('div');
            box.className = 'site-confirm-box';
            var msg = document.createElement('div');
            msg.className = 'site-confirm-msg';
            msg.textContent = message;
            var actions = document.createElement('div');
            actions.className = 'site-confirm-actions';
            var yes = document.createElement('button'); yes.className = 'site-confirm-yes'; yes.textContent = 'Da';
            var no = document.createElement('button'); no.className = 'site-confirm-no'; no.textContent = 'Anulează';
            actions.appendChild(yes); actions.appendChild(no);
            box.appendChild(msg); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
            function cleanup(result){ document.body.removeChild(overlay); resolve(result); }
            yes.addEventListener('click', function(){ cleanup(true); });
            no.addEventListener('click', function(){ cleanup(false); });
        });
    }

    /* 
       ACTUALIZARE BADGE COȘ
       Calculează numărul total de produse din coș și actualizează cifra roșie de pe iconiță.
    */
    function updateBadge(){
        try{
            var badge = document.getElementById('cart-badge');
            if(!badge) return;
            var cartPromise = (window.cartAPI && window.cartAPI.getCart) ? window.cartAPI.getCart() : Promise.resolve([]);
            
            if(cartPromise && typeof cartPromise.then === 'function'){
                cartPromise.then(function(cart){
                    renderBadge(badge, cart);
                }).catch(function(){ renderBadge(badge, []); });
            } else {
                renderBadge(badge, cartPromise);
            }
        }catch(e){ console.warn('updateBadge error', e); }
    }

    function renderBadge(el, cart){
        var count = 0;
        if(cart && cart.length){ cart.forEach(function(i){ count += Number(i.qty || i.cantitate || 1); }); }
        if(count <= 0){ el.style.display = 'none'; }
        else{ el.style.display = 'inline-block'; el.textContent = count; }
    }

    // Ascultăm evenimentele globale pentru a actualiza interfața
    window.addEventListener('cartUpdated', updateBadge);
    window.addEventListener('siteToast', function(e){ notifyToast(e.detail.message, e.detail.position); });

    document.addEventListener('DOMContentLoaded', function(){
        setTimeout(updateBadge, 150);
    });

    // calculate header + nav height and set CSS variables so layout compensates
    function refreshHeaderHeight(){
        try{
            var h = document.querySelector('header');
            var n = document.querySelector('nav');
            if(!h) return;
            var hh = h.getBoundingClientRect().height;
            var nh = n ? n.getBoundingClientRect().height : 0;
            document.documentElement.style.setProperty('--header-height', Math.ceil(hh) + 'px');
            document.documentElement.style.setProperty('--total-header-height', Math.ceil(hh + nh) + 'px');
        }catch(e){ console.warn('refreshHeaderHeight err', e); }
    }
    window.addEventListener('load', refreshHeaderHeight);
    window.addEventListener('resize', function(){ setTimeout(refreshHeaderHeight, 120); });
    // also run once now in case DOMContentLoaded already passed
    setTimeout(refreshHeaderHeight, 200);

    // expose helpers if needed
    window.siteUI = { notifyToast: notifyToast, updateBadge: updateBadge, confirm: showConfirm };
    
    // Delegated handler: support clicks on .add-btn anywhere in the site
    document.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('.add-btn');
        if(!btn) return;
        var card = btn.closest && btn.closest('.product-card');
        if(!card) return;
        var item = {
            id: card.dataset.id || card.getAttribute('data-id'),
            title: card.dataset.title || card.getAttribute('data-title') || (card.querySelector('h3') && card.querySelector('h3').innerText) || 'Produs',
            price: Number(card.dataset.price || card.getAttribute('data-price') || (card.querySelector('.price') && card.querySelector('.price').innerText) || 0),
            image: (card.querySelector('img') && card.querySelector('img').src) || undefined,
            qty: 1
        };

        // UX: show temporary "Adăugat" state on the button
        try{
            if(!btn.__prevText){ btn.__prevText = btn.innerHTML; }
            btn.disabled = true;
            btn.classList.add('added');
            btn.innerHTML = 'Adăugat ✓';
        }catch(e){ /* ignore */ }

        if(window.cartAPI && window.cartAPI.addToCart){
            window.cartAPI.addToCart(item);
        } else {
            // fallback
            var cart = JSON.parse(localStorage.getItem('cart')||'[]');
            var ex = cart.find(function(c){ return c.id===item.id; });
            if(ex) ex.qty = (ex.qty||0)+1; else cart.push(item);
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated',{detail:{cart}}));
            window.dispatchEvent(new CustomEvent('siteToast',{detail:{message: item.title + ' a fost adăugat în coș', position:'center'}}));
        }

        // revert button state after a short delay
        setTimeout(function(){
            try{
                btn.disabled = false;
                if(btn.__prevText) btn.innerHTML = btn.__prevText;
                btn.classList.remove('added');
            }catch(e){}
        }, 1400);
    });

    // Back-to-top button: create once, append after DOM ready if needed and manage visibility
    (function(){
        var b = document.createElement('button');
        b.id = 'back-to-top';
        b.type = 'button';
        b.setAttribute('aria-label', 'Mergi sus');
        b.title = '⬆️ Mergi sus';
        b.innerHTML = '⬆️ Mergi sus';

        function appendBtn(){
            try{
                if(!document.body) return;
                if(!document.body.querySelector('#back-to-top')) document.body.appendChild(b);
            }catch(e){ /* ignore */ }
        }

        if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', appendBtn);
        } else {
            appendBtn();
        }

        function check(){
            var show = (window.scrollY || document.documentElement.scrollTop) > 300;
            if(!b) return;
            b.classList.toggle('show', !!show);
        }

        window.addEventListener('scroll', check);
        // ensure initial visibility state once appended
        document.addEventListener('DOMContentLoaded', check);

        b.addEventListener('click', function(e){
            e.preventDefault();
            window.scrollTo({top:0,behavior:'smooth'});
        });
    })();

    /* 
       GESTIONARE NEWSLETTER
       Trimite email-ul către backend pentru abonare
    */
    document.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('.newsletter-box button');
        if(!btn) return;
        
        var box = btn.closest('.newsletter-box');
        var input = box.querySelector('input[type="email"]');
        var email = input ? input.value : '';
        
        if(!email || !email.includes('@')){
            window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: 'Te rugăm să introduci un email valid.', position: 'center' }}));
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Trimitere...';

        fetch('http://127.0.0.1:3000/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        })
        .then(res => res.json())
        .then(data => {
            window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: data.message || 'Te-ai abonat!', position: 'center' }}));
            if(input) input.value = '';
        })
        .catch(err => {
            window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: 'Eroare la abonare. Încearcă mai târziu.', position: 'center' }}));
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = 'Abonează-te';
        });
    });

    /* 
       GESTIONARE FORMULAR CONTACT
       Trimite mesajele către baza de date
    */
    document.addEventListener('submit', function(e){
        var form = e.target.closest('#contact-form');
        if(!form) return;
        e.preventDefault();

        var btn = form.querySelector('button[type="submit"]');
        var nume = form.querySelector('#contact-name').value;
        var email = form.querySelector('#contact-email').value;
        var mesaj = form.querySelector('#contact-message').value;

        btn.disabled = true;
        var originalText = btn.textContent;
        btn.textContent = 'Se trimite...';

        fetch('http://127.0.0.1:3000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nume, email, mesaj })
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) throw new Error(data.error);
            window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: data.message, position: 'center' }}));
            form.reset();
        })
        .catch(err => {
            window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: 'Eroare: ' + err.message, position: 'center' }}));
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = originalText;
        });
    });
})();
