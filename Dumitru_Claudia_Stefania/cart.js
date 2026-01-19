(function(){
    /* 
       MANAGEMENT COȘ DE CUMPĂRĂTURI
       Această bibliotecă gestionează adăugarea produselor în coș, sincronizarea cu 
       serverul (dacă user-ul e logat) sau salvarea în LocalStorage (pentru musafiri).
    */
    var STORAGE_KEY = 'cart';

    // Obține datele din LocalStorage (pentru utilizatori nelogați)
    function getLocal(){
        try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch(e){ return []; }
    }

    // Salvează datele în LocalStorage
    function saveLocal(cart){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    // Trimite un eveniment de Toast către site-ui.js
    function notifyToast(message){
        var position = arguments.length > 1 ? arguments[1] : undefined;
        var detail = { message: message };
        if(position) detail.position = position;
        window.dispatchEvent(new CustomEvent('siteToast', { detail: detail }));
    }

    function isLoggedIn(){ try{ return !!(window.auth && window.auth.getToken && window.auth.getToken()); }catch(e){ return false; } }

    /* 
       GET CART 
       Returnează coșul. Dacă suntem logați, apelăm API-ul de pe server, 
       altfel returnăm datele locale.
    */
    function getCart(){
        if(isLoggedIn() && window.productsAPI && window.productsAPI.getCart){
            return window.productsAPI.getCart();
        }
        return Promise.resolve(getLocal());
    }

    /* 
       ADD TO CART
       Adaugă un produs în coș. Gestionează incrementarea cantității dacă produsul există deja.
    */
    function addToCart(item){
        if(isLoggedIn() && window.productsAPI && window.productsAPI.addToCart){
            // Salvare pe server
            return window.productsAPI.addToCart(item.id, item.qty || 1, null).then(function(res){
                notifyToast(item.title + ' a fost adăugat în coș', 'center');
                window.dispatchEvent(new CustomEvent('cartUpdated', {}));
                return res;
            }).catch(function(err){ notifyToast(err.message || 'Eroare adăugare în coș'); });
        }
        // Salvare locală (Guest)
        var cart = getLocal();
        var existing = cart.find(function(c){ return c.id === item.id; });
        if(existing){ existing.qty = (existing.qty||0) + (item.qty||1); }
        else{ cart.push({ id: item.id, title: item.title, price: item.price, image: item.image, qty: item.qty || 1 }); }
        saveLocal(cart);
        notifyToast(item.title + ' a fost adăugat în coș', 'center');
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
        return Promise.resolve();
    }

    function updateQty(id_or_cos, qty){
        if(isLoggedIn() && window.productsAPI && window.productsAPI.updateCartItem){
            return window.productsAPI.updateCartItem(id_or_cos, qty).then(function(res){ window.dispatchEvent(new CustomEvent('cartUpdated', {})); return res; }).catch(function(err){ notifyToast(err.message || 'Eroare actualizare coș'); });
        }
        var cart = getLocal();
        var it = cart.find(function(c){ return c.id === id_or_cos; });
        if(!it) return Promise.resolve();
        it.qty = qty;
        if(it.qty <= 0) cart = cart.filter(function(c){ return c.id !== id_or_cos; });
        saveLocal(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
        return Promise.resolve();
    }

    function removeItem(id_or_cos){
        if(isLoggedIn() && window.productsAPI && window.productsAPI.deleteCartItem){
            return window.productsAPI.deleteCartItem(id_or_cos).then(function(res){ window.dispatchEvent(new CustomEvent('cartUpdated', {})); return res; }).catch(function(err){ notifyToast(err.message || 'Eroare ștergere din coș'); });
        }
        var cart = getLocal().filter(function(c){ return c.id !== id_or_cos; });
        saveLocal(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
        return Promise.resolve();
    }

    function clearCart(){
        if(isLoggedIn() && window.productsAPI && window.productsAPI.clearCart){
            return window.productsAPI.clearCart().then(function(res){ window.dispatchEvent(new CustomEvent('cartUpdated', {})); return res; }).catch(function(err){ notifyToast(err.message || 'Eroare golire coș'); });
        }
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
        return Promise.resolve();
    }

    /* 
       MERGE CART
       Mută toate produsele din coșul local (Guest) în coșul de pe server (Logat).
       Se apelează imediat după Login.
    */
    function mergeCart(){
        var localProducts = getLocal();
        if(!localProducts.length || !isLoggedIn()) return Promise.resolve();

        // Promisiuni pentru a adăuga fiecare produs local pe server
        var promises = localProducts.map(function(item){
            return window.productsAPI.addToCart(item.id, item.qty || 1, null);
        });

        return Promise.all(promises).then(function(){
            // După ce s-au mutat, ștergem coșul local
            localStorage.removeItem(STORAGE_KEY);
            window.dispatchEvent(new CustomEvent('cartUpdated', {}));
            return true;
        }).catch(function(err){
            console.warn('Eroare la merging cart:', err);
        });
    }

    window.cartAPI = { 
        getCart: getCart, 
        saveCart: saveLocal, 
        addToCart: addToCart, 
        updateQty: updateQty, 
        removeItem: removeItem, 
        clearCart: clearCart,
        mergeCart: mergeCart 
    };
})();
