function updateConnectivityStatus() {
  let display = navigator.onLine ? 'none' : 'flex';
  document.querySelector('#no-connectivity').style.display = display;
}

function runConnectivityChecks() {
  updateConnectivityStatus(true);

  window.addEventListener('online',  updateConnectivityStatus);
  window.addEventListener('offline', updateConnectivityStatus);
}
