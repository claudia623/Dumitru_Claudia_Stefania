(function(){
    function notifyToast(message, position){
        position = position || 'bottom';
        if(position === 'center'){
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

    function updateBadge(){
        try{
            var badge = document.getElementById('cart-badge');
            if(!badge) return;
            var cart = (window.cartAPI && window.cartAPI.getCart) ? window.cartAPI.getCart() : [];
            var count = 0;
            if(cart && cart.length){ cart.forEach(function(i){ count += Number(i.qty||1); }); }
            if(count <= 0){ badge.style.display = 'none'; }
            else{ badge.style.display = 'inline-block'; badge.textContent = count; }
        }catch(e){ console.warn('updateBadge error', e); }
    }

    window.addEventListener('cartUpdated', updateBadge);
    window.addEventListener('siteToast', function(e){ notifyToast(e.detail.message, e.detail.position); });

    document.addEventListener('DOMContentLoaded', function(){
        setTimeout(updateBadge, 150);
        // compute header height and expose it to CSS so fixed header doesn't cover content
        try{
            function setHeaderHeight(){
                var hdr = document.querySelector('header');
                if(!hdr) return;
                var h = hdr.getBoundingClientRect().height || 96;
                document.documentElement.style.setProperty('--header-height', h + 'px');
            }
            setHeaderHeight();
            window.addEventListener('resize', function(){ setTimeout(setHeaderHeight, 80); });
        }catch(e){ /* ignore */ }
    });

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
})();
