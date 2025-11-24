(function(){
    var STORAGE_KEY = 'cart';
    function getCart(){
        try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch(e){ return []; }
    }
    function saveCart(cart){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
    function notifyToast(message){
        var position = arguments.length > 1 ? arguments[1] : undefined;
        var detail = { message: message };
        if(position) detail.position = position;
        window.dispatchEvent(new CustomEvent('siteToast', { detail: detail }));
    }
    function addToCart(item){
        var cart = getCart();
        var existing = cart.find(function(c){ return c.id === item.id; });
        if(existing){ existing.qty = (existing.qty||0) + (item.qty||1); }
        else{ cart.push({ id: item.id, title: item.title, price: item.price, image: item.image, qty: item.qty || 1 }); }
        saveCart(cart);
        notifyToast(item.title + ' a fost adăugat în coș', 'center');
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }
    function updateQty(id, qty){
        var cart = getCart();
        var it = cart.find(function(c){ return c.id === id; });
        if(!it) return;
        it.qty = qty;
        if(it.qty <= 0) cart = cart.filter(function(c){ return c.id !== id; });
        saveCart(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }
    function removeItem(id){
        var cart = getCart().filter(function(c){ return c.id !== id; });
        saveCart(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }
    function clearCart(){
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
    }
    window.cartAPI = { getCart: getCart, saveCart: saveCart, addToCart: addToCart, updateQty: updateQty, removeItem: removeItem, clearCart: clearCart };
})();
