const cacheName = "v1";

const cacheClone = async (e: any) => {
  const res = await fetch(e.request);
  const resClone = res.clone();

  const cache = await caches.open(cacheName);
  await cache.put(e.request, resClone);
  return res;
};

const fetchEvent = () => {
  self.addEventListener("fetch", (e: any) => {
    e.respondWith(
      cacheClone(e)
        .catch(() => caches.match(e.request))
        .then((res) => res)
    );
  });
};

fetchEvent();


// useEffect(() => {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker
//       .register('/service-worker.js', { scope: '/docs' })
//       .then((registration) => console.log('scope is: ', registration.scope));
//   }
// }, []);