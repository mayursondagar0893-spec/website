/* wa-init.js — WhatsApp link initializer, shared across all pages */
var _w = atob('OTE5MTUyMDYyMDkw');
document.querySelectorAll('.wa-link').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://wa.me/' + _w, '_blank');
  });
});
