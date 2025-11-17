(function(){
    var STORAGE_KEY = 'favorites';
    function getFavorites(){
        try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch(e){ return []; }
    }
    function saveFavorites(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
    function isFavorite(id){ return !!getFavorites().find(function(i){ return i.id === id; }); }
    function addFavorite(item){
        if(!item || !item.id) return;
        var list = getFavorites();
        if(list.find(function(i){ return i.id === item.id; })) return;
        list.push({ id: item.id, title: item.title, price: item.price, image: item.image });
        saveFavorites(list);
        window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { list: list } }));
        window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: item.title + ' a fost adăugat la favorite', position: 'center' } }));
    }
    function removeFavorite(id){
        var list = getFavorites().filter(function(i){ return i.id !== id; });
        saveFavorites(list);
        window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { list: list } }));
        window.dispatchEvent(new CustomEvent('siteToast', { detail: { message: 'Produsul a fost eliminat din favorite', position: 'center' } }));
    }
    function toggleFavorite(item){
        if(!item || !item.id) return;
        if(isFavorite(item.id)) removeFavorite(item.id); else addFavorite(item);
    }

    // Expose API
    window.favAPI = { getFavorites: getFavorites, saveFavorites: saveFavorites, addFavorite: addFavorite, removeFavorite: removeFavorite, isFavorite: isFavorite, toggleFavorite: toggleFavorite };

    // Delegated click handler for .fav-btn — optimistic UI: toggle visual state immediately
    document.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('.fav-btn');
        if(!btn) return;
        var card = btn.closest && btn.closest('.product-card');
        var id = (card && (card.dataset.id || card.getAttribute('data-id'))) || btn.dataset.id || btn.getAttribute('data-id');
        var title = (card && (card.dataset.title || card.getAttribute('data-title'))) || btn.dataset.title || btn.getAttribute('data-title') || (card && card.querySelector('h3') && card.querySelector('h3').innerText) || 'Produs';
        var img = (card && card.querySelector('img') && card.querySelector('img').src) || btn.dataset.image || btn.getAttribute('data-image');

        var item = { id: id, title: title, image: img };

        // optimistic UI: flip the button state immediately for instant feedback
        try{
            var currently = isFavorite(id);
            if(currently){ btn.textContent = '♡'; btn.title = 'Adaugă la favorite'; }
            else { btn.textContent = '♥'; btn.title = 'În favorite'; }
            btn.disabled = true;
        }catch(e){}

        // perform actual toggle (this will emit favoritesUpdated and correct UI if needed)
        setTimeout(function(){
            try{ toggleFavorite(item); }
            catch(e){ console.warn('fav toggle error', e); }
            try{ btn.disabled = false; }catch(e){}
        }, 120);
    });

    // Update any .fav-btns to reflect current state (called on favoritesUpdated or DOMContentLoaded)
    function refreshButtons(){
        try{
            var buttons = document.querySelectorAll('.fav-btn');
            buttons.forEach(function(b){
                var card = b.closest && b.closest('.product-card');
                var id = (card && (card.dataset.id || card.getAttribute('data-id'))) || b.dataset.id || b.getAttribute('data-id');
                if(id && isFavorite(id)) { b.textContent = '♥'; b.title = 'În favorite'; }
                else { b.textContent = '♡'; b.title = 'Adaugă la favorite'; }
            });
            // update header badge if present
            try{
                var favBadge = document.getElementById('fav-badge');
                if(favBadge){ var count = getFavorites().length || 0; if(count>0){ favBadge.style.display='inline-block'; favBadge.textContent = count; } else { favBadge.style.display='none'; } }
            }catch(e){}
        }catch(e){ }
    }
    document.addEventListener('favoritesUpdated', refreshButtons);
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(refreshButtons, 80); });
})();
