(function(){
    var KEY = 'favorites';
    function getFavorites(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
    function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); window.dispatchEvent(new CustomEvent('favoritesUpdated',{detail:{favorites:list}})); }
    function add(id){ if(!id) return; var f = getFavorites(); if(f.indexOf(id) === -1){ f.push(id); save(f); window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Adăugat la favorite', position:'center'}})); } }
    function remove(id){ if(!id) return; var f = getFavorites(); var out = f.filter(function(x){ return x !== id; }); save(out); window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Eliminat din favorite', position:'center'}})); }
    function isFavorite(id){ var f = getFavorites(); return f.indexOf(id) !== -1; }
    function toggle(id){ if(isFavorite(id)) remove(id); else add(id); }

    // helper to render favorites list on favorites.html
    function renderFavoritesPage(){ try{
        var root = document.getElementById('favorites-root'); if(!root) return;
        var fav = getFavorites(); if(!window.PRODUCTS) { root.innerHTML = '<p>Produse indisponibile.</p>'; return; }
        if(!fav || !fav.length){ root.innerHTML = '<p>Nu ai produse în favorite.</p>'; return; }
        var html = '<div class="products-wrap">';
        fav.forEach(function(id){ var p = window.PRODUCTS.find(function(x){return x.id===id}); if(!p) return; html += '<div class="product-card" data-id="'+p.id+'" style="max-width:260px">'; html += '<a class="product-link" href="product.html?id='+encodeURIComponent(p.id)+'"><img src="'+(p.images&&p.images[0]?p.images[0]:'')+'" alt="'+p.title+'" style="width:100%;border-radius:10px"></a>'; html += '<h3><a class="product-link" href="product.html?id='+encodeURIComponent(p.id)+'">'+p.title+'</a></h3>'; html += '<p>Preț: '+p.price+' lei</p>'; html += '<div style="display:flex;gap:8px"><button class="add-btn">Adaugă în coș</button><button class="fav-remove-btn" data-id="'+p.id+'">Șterge</button></div>'; html += '</div>'; });
        html += '</div>';
        root.innerHTML = html;
        // attach remove handlers for favorites page
        root.querySelectorAll('.fav-remove-btn').forEach(function(b){ b.addEventListener('click', function(){ var id=b.dataset.id; remove(id); renderFavoritesPage(); }); });
    }catch(e){ console.warn('renderFavoritesPage err', e); } }

    // on favorites update, re-render if on favorites page
    window.addEventListener('favoritesUpdated', function(){ renderFavoritesPage(); });
    document.addEventListener('DOMContentLoaded', function(){ renderFavoritesPage(); });

    window.favoritesAPI = { getFavorites:getFavorites, add:add, remove:remove, isFavorite:isFavorite, toggle:toggle };
})();

// update favorites badge if present
(function(){
    function updateBadge(){
        try{
            var el = document.getElementById('favorites-badge');
            if(!el) return;
            var f = (window.favoritesAPI && window.favoritesAPI.getFavorites) ? window.favoritesAPI.getFavorites() : [];
            var count = (f && f.length) ? f.length : 0;
            if(count <= 0){ el.style.display = 'none'; }
            else{ el.style.display = 'inline-block'; el.textContent = count; }
        }catch(e){ console.warn('fav badge update err', e); }
    }
    window.addEventListener('favoritesUpdated', updateBadge);
    document.addEventListener('DOMContentLoaded', updateBadge);
})();
