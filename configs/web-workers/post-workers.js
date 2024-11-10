self.importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

const SYNC_BATCH_SIZE = 1000;

async function syncPosts() {
  const db = await idb.openDB('PostDatabase', 1);
  
  // Get pending posts in batches
  let syncedCount = 0;
  while (true) {
    const posts = await db.getAllFromIndex('posts', 'syncStatus', 'pending', SYNC_BATCH_SIZE);
    if (posts.length === 0) break;

    // Send to main thread for GunDB sync
    const ids = posts.map(p => p.id);
    await self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_POSTS',
          posts: posts
        });
      });
    });

    // Mark as synced
    await Promise.all(ids.map(id => 
      db.put('posts', { ...posts.find(p => p.id === id), syncStatus: 'synced' }, id)
    ));

    syncedCount += posts.length;
    
    // Notify progress
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_PROGRESS',
          syncedCount
        });
      });
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_SYNC') {
    syncPosts();
  }
});