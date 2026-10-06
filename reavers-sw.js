self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  var title = data.title || 'Red Deer Reavers';
  var options = {
    body: data.body || '',
    tag: data.tag || 'red-deer-reavers',
    data: { url: data.route || 'https://dothecoolwip1.github.io/Red-deer-reavers/members.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : 'https://dothecoolwip1.github.io/Red-deer-reavers/members.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (wins) {
      for (var i = 0; i < wins.length; i++) {
        if (wins[i].url.indexOf('/Red-deer-reavers/') !== -1 && 'focus' in wins[i]) {
          wins[i].navigate(url);
          return wins[i].focus();
        }
      }
      return clients.openWindow ? clients.openWindow(url) : null;
    })
  );
});
