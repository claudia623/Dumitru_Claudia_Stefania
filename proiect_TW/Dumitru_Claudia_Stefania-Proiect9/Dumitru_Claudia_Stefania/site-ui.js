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
    });

    // expose helpers if needed
    window.siteUI = { notifyToast: notifyToast, updateBadge: updateBadge, confirm: showConfirm };
})();
