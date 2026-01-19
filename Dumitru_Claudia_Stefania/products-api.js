// =====================================================
// MODUL PRODUSE ȘI COMENZI - CONECTAT LA BACKEND API
// Gestionează afișarea plușurilor, coșul de pe server și plasarea comenzilor.
// =====================================================

(function(){
  const API_BASE = 'http://127.0.0.1:3000/api';

  // OBTINE TOKEN-UL pentru cereri autorizate
  function getToken(){
    try{ return localStorage.getItem('auth_token'); }catch(e){ return null; }
  }

  function getAuthHeader(){
    var token = getToken();
    if(token) return { 'Authorization': 'Bearer ' + token };
    return {};
  }

  // =====================================================
  // API PRODUSE
  // =====================================================

  // Obține lista tuturor produselor (cu opțiuni de filtrare)
  function getProducts(options){
    options = options || {};
    var params = new URLSearchParams();
    if(options.id_categorie) params.append('id_categorie', options.id_categorie);
    if(options.search) params.append('search', options.search);

    return fetch(API_BASE + '/produse?' + params.toString())
      .then(function(res){
        if(!res.ok) throw new Error('Eroare preluare produse');
        return res.json();
      })
      .catch(function(err){
        console.error('Error fetching products:', err);
        return [];
      });
  }

  // Obține detaliile pentru un singur produs (folosit în product.html)
  function getProduct(id){
    return fetch(API_BASE + '/produse/' + id)
      .then(function(res){
        if(!res.ok) throw new Error('Produs nu găsit');
        return res.json();
      })
      .catch(function(err){
        console.error('Error fetching product:', err);
        return null;
      });
  }

  // Construiește URL-ul pentru imaginea unui produs
  function getProductImage(id_produs, id_imagine){
    return API_BASE + '/produse/' + id_produs + '/imagini/' + id_imagine;
  }

  // Obține recenziile (comentariile) lăsate de clienți
  function getProductReviews(id_produs){
    return fetch(API_BASE + '/produse/' + id_produs + '/recenzii')
      .then(function(res){
        if(!res.ok) throw new Error('Eroare preluare recenzii');
        return res.json();
      })
      .catch(function(err){
        console.error('Error fetching reviews:', err);
        return [];
      });
  }

  // =====================================================
  // API COȘ (SERVER-SIDE)
  // Permite salvarea coșului în baza de date pentru a nu fi pierdut la logout.
  // =====================================================

  function getCart(){
    var token = getToken();
    if(!token) return Promise.resolve([]);

    return fetch(API_BASE + '/cos', {
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) throw new Error('Eroare preluare cos');
      return res.json();
    })
    .catch(function(err){
      console.error('Error fetching cart:', err);
      return [];
    });
  }

  function addToCart(id_produs, cantitate, culoare_selectata){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/cos', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
      body: JSON.stringify({ id_produs, cantitate: cantitate || 1, culoare_selectata })
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error adding to cart:', err);
      throw err;
    });
  }

  function updateCartItem(id_cos, cantitate){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    if(cantitate <= 0){
      return deleteCartItem(id_cos);
    }

    return fetch(API_BASE + '/cos/' + id_cos, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
      body: JSON.stringify({ cantitate })
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error updating cart:', err);
      throw err;
    });
  }

  function deleteCartItem(id_cos){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/cos/' + id_cos, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error deleting from cart:', err);
      throw err;
    });
  }

  function clearCart(){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/cos', {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error clearing cart:', err);
      throw err;
    });
  }

  // =====================================================
  // ORDERS API
  // =====================================================

  function createOrder(orderData){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/comenzi', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
      body: JSON.stringify(orderData)
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error creating order:', err);
      throw err;
    });
  }

  function getOrders(){
    var token = getToken();
    if(!token) return Promise.resolve([]);

    return fetch(API_BASE + '/comenzi', {
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) throw new Error('Eroare preluare comenzi');
      return res.json();
    })
    .catch(function(err){
      console.error('Error fetching orders:', err);
      return [];
    });
  }

  function getOrder(id_comanda){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/comenzi/' + id_comanda, {
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error fetching order:', err);
      throw err;
    });
  }

  // =====================================================
  // REVIEWS API
  // =====================================================

  function addReview(id_produs, reviewData){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/recenzii', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
      body: JSON.stringify(Object.assign({ id_produs }, reviewData))
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error adding review:', err);
      throw err;
    });
  }

  // =====================================================
  // FAVORITES API
  // =====================================================

  function getFavorites(){
    var token = getToken();
    if(!token) return Promise.resolve([]);

    return fetch(API_BASE + '/favorite', {
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) throw new Error('Eroare preluare favorite');
      return res.json();
    })
    .catch(function(err){
      console.error('Error fetching favorites:', err);
      return [];
    });
  }

  function checkFavorite(id_produs){
    var token = getToken();
    if(!token) return Promise.resolve(false);

    return fetch(API_BASE + '/favorite/check/' + id_produs, {
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) throw new Error('Eroare verificare favorit');
      return res.json().then(function(data){ return data.isFavorite; });
    })
    .catch(function(err){
      console.error('Error checking favorite:', err);
      return false;
    });
  }

  function addFavorite(id_produs){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/favorite/' + id_produs, {
      method: 'POST',
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error adding favorite:', err);
      throw err;
    });
  }

  function removeFavorite(id_produs){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Trebuie să te loghezi'));

    return fetch(API_BASE + '/favorite/' + id_produs, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    .then(function(res){
      if(!res.ok) return res.json().then(function(err){ throw new Error(err.error); });
      return res.json();
    })
    .catch(function(err){
      console.error('Error removing favorite:', err);
      throw err;
    });
  }

  // =====================================================
  // CATEGORIES API
  // =====================================================

  function getCategories(){
    return fetch(API_BASE + '/categorii')
      .then(function(res){
        if(!res.ok) throw new Error('Eroare preluare categorii');
        return res.json();
      })
      .catch(function(err){
        console.error('Error fetching categories:', err);
        return [];
      });
  }

  // =====================================================
  // GLOBAL API OBJECT
  // =====================================================

  window.productsAPI = {
    getProducts,
    getProduct,
    getProductImage,
    getProductReviews,
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart,
    createOrder,
    getOrders,
    getOrder,
    addReview,
    getFavorites,
    checkFavorite,
    addFavorite,
    removeFavorite,
    getCategories
  };

})();
