(function(){
    var KEY = 'favorites';
    var isAttachingHandlers = false;
    
    function getFavorites(){ 
        try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }
        catch(e){ return []; } 
    }
    
    function save(list){ 
        localStorage.setItem(KEY, JSON.stringify(list)); 
        // Only dispatch event if we're on favorites page
        if(document.getElementById('favorites-root')){
            window.dispatchEvent(new CustomEvent('favoritesUpdated',{detail:{favorites:list}})); 
        }
    }
    
    function add(id){
        if(!id) return Promise.resolve();
        var u = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser();
        var f = getFavorites();
        
        // Already in favorites
        if(f.indexOf(String(id)) !== -1) {
            return Promise.resolve();
        }
        
        // Add to localStorage first
        f.push(String(id));
        localStorage.setItem(KEY, JSON.stringify(f));
        window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Adăugat la favorite', position:'center'}}));
        if(document.getElementById('favorites-root')){
            renderFavoritesPage();
        }
        
        // If logged in, sync to backend
        if(u && window.productsAPI && window.productsAPI.addFavorite){
            return window.productsAPI.addFavorite(id)
                .catch(function(err){
                    console.error('Error syncing favorite to backend:', err);
                    // Already in localStorage, so it's ok
                });
        }
        
        return Promise.resolve();
    }
    
    function remove(id){
        if(!id) return Promise.resolve();
        var u = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser();
        var f = getFavorites();
        
        // Remove from localStorage first
        var out = f.filter(function(x){ return String(x) !== String(id); });
        localStorage.setItem(KEY, JSON.stringify(out));
        window.dispatchEvent(new CustomEvent('siteToast',{detail:{message:'Eliminat din favorite', position:'center'}}));
        if(document.getElementById('favorites-root')){
            renderFavoritesPage();
        }
        
        // If logged in, sync to backend
        if(u && window.productsAPI && window.productsAPI.removeFavorite){
            return window.productsAPI.removeFavorite(id)
                .catch(function(err){
                    console.error('Error syncing favorite removal to backend:', err);
                    // Already removed from localStorage, so it's ok
                });
        }
        
        return Promise.resolve();
    }
    
    function isFavorite(id){ 
        var f = getFavorites(); 
        return f.indexOf(String(id)) !== -1; 
    }
    
    function toggle(id){
        var u = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser();
        if(!u){
            localStorage.setItem('pendingFavorite', JSON.stringify({productId: id, returnURL: window.location.href}));
            window.location.href = 'login.html';
            return Promise.resolve();
        }
        if(isFavorite(id)) return remove(id); 
        else return add(id);
    }

    async function renderFavoritesPage(){ 
        try{
            var root = document.getElementById('favorites-root'); 
            if(!root) return;
            
            var fav = getFavorites();
            if(!fav || !fav.length){ 
                root.innerHTML = '<p>Nu ai produse în favorite.</p>'; 
                return; 
            }
            
            root.innerHTML = '<p>Se încarcă favoritele...</p>';
            
            var products = await productsAPI.getProducts();
            if(!products || !products.length) { 
                root.innerHTML = '<p>Produse indisponibile.</p>'; 
                return; 
            }
            
            var html = '<div class="products-wrap">';
            fav.forEach(function(id){ 
                var p = products.find(function(x){return String(x.id_produs)===String(id)});
                if(!p) return;
                var imageUrl = p.imagini && p.imagini[0] ? productsAPI.getProductImage(p.id_produs, p.imagini[0].id_imagine) : '';
                html += '<div class="product-card" data-id="'+p.id_produs+'" style="max-width:260px">';
                html += '<a class="product-link" href="product.html?id='+encodeURIComponent(p.id_produs)+'"><img src="'+imageUrl+'" alt="'+p.nume_produs+'" style="width:100%;border-radius:10px"></a>';
                html += '<h3><a class="product-link" href="product.html?id='+encodeURIComponent(p.id_produs)+'">'+p.nume_produs+'</a></h3>';
                html += '<p>Preț: '+p.pret_unitar+' lei</p>';
                html += '<div style="display:flex;gap:8px"><button class="add-btn" data-id="'+p.id_produs+'">Adaugă în coș</button><button class="fav-remove-btn" data-id="'+p.id_produs+'">Șterge</button></div>';
                html += '</div>';
            });
            html += '</div>';
            root.innerHTML = html;
            
            attachEventHandlers(products);
        }
        catch(e){ 
            console.warn('renderFavoritesPage err', e); 
            root.innerHTML = '<p>Eroare la încărcarea favoritelor.</p>'; 
        } 
    }
    
    function attachEventHandlers(products){
        var root = document.getElementById('favorites-root');
        if(!root || isAttachingHandlers) return;
        
        isAttachingHandlers = true;
        
        // Remove old listeners by cloning and replacing
        var newRoot = root.cloneNode(false);
        root.parentNode.replaceChild(newRoot, root);
        root = newRoot;
        
        // Clone products HTML back
        var productsWrap = document.querySelector('.products-wrap');
        if(productsWrap){
            root.appendChild(productsWrap.cloneNode(true));
        }
        
        // Single event listener on new root
        root.addEventListener('click', function(e){
            var addBtn = e.target.closest('.add-btn');
            var removeBtn = e.target.closest('.fav-remove-btn');
            
            if(addBtn){
                e.preventDefault();
                e.stopPropagation();
                var id = addBtn.dataset.id;
                var p = products.find(function(x){return String(x.id_produs)===String(id)});
                if(!p) return;
                var imageUrl = p.imagini && p.imagini[0] ? productsAPI.getProductImage(p.id_produs, p.imagini[0].id_imagine) : '';
                var item = { id: p.id_produs, title: p.nume_produs, price: p.pret_unitar, image: imageUrl, qty: 1 };
                if(window.cartAPI && window.cartAPI.addToCart) window.cartAPI.addToCart(item);
            }
            
            if(removeBtn){
                e.preventDefault();
                e.stopPropagation();
                var id = removeBtn.dataset.id;
                removeBtn.disabled = true;
                removeBtn.textContent = 'Se șterge...';
                remove(id).then(function(){
                    renderFavoritesPage(); 
                }).catch(function(err){
                    console.error('Remove error:', err);
                    removeBtn.disabled = false;
                    removeBtn.textContent = 'Șterge';
                });
            }
        });
        
        isAttachingHandlers = false;
    }

    document.addEventListener('DOMContentLoaded', function(){ renderFavoritesPage(); });

    window.favoritesAPI = { 
        getFavorites: getFavorites, 
        add: add, 
        remove: remove, 
        isFavorite: isFavorite, 
        toggle: toggle 
    };
})();

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
    document.addEventListener('DOMContentLoaded', updateBadge);
    window.addEventListener('favoritesUpdated', updateBadge);
})();
