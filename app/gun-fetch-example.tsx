"use client";

import Gun from "gun";
import React, { useEffect, useState } from "react";

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// Khởi tạo GunDB với cấu hình cho storage
const gun = Gun({
  peers: ["http://localhost:8080/gun"],
  localStorage: true, // Bật localStorage
  radisk: true, // Bật radisk để persistent storage
  store: {
    // Custom store methods để debug
    get: function (key: string, done: Function) {
      console.log("Getting from storage:", key);
      const val = localStorage.getItem(key);
      done(null, val);
    },
    put: function (key: string, data: any, done: Function) {
      console.log("Putting to storage:", key, data);
      localStorage.setItem(key, data);
      done(null);
    },
  },
});

// Kiểm tra xem IndexedDB có khả dụng không
const checkIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gunTest", 1);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(false);
    };

    request.onsuccess = () => {
      console.log("IndexedDB is available");
      resolve(true);
    };
  });
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState<string>("");

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await checkIndexedDB();
        setStorageStatus("IndexedDB is available");

        // Reference to posts in GunDB
        const postsRef = gun.get("posts");

        // Check if we have data in IndexedDB
        postsRef.once(async (data) => {
          console.log("Checking existing data:", data);

          if (!data) {
            console.log("Fetching new data...");
            const response = await fetch(
              "https://jsonplaceholder.typicode.com/posts"
            );
            const fetchedPosts: Post[] = await response.json();

            // Store each post with explicit acknowledgment
            for (const post of fetchedPosts) {
              await new Promise((resolve) => {
                postsRef.get(post.id.toString()).put(post, (ack) => {
                  console.log(`Stored post ${post.id}:`, ack);
                  resolve(ack);
                });
              });
            }

            console.log("All posts stored");
          }
        });

        // Subscribe to changes
        postsRef.map().on((data, id) => {
          if (data) {
            setPosts((prevPosts) => {
              const newPosts = prevPosts.filter((p) => p.id !== data.id);
              return [...newPosts, data].sort((a, b) => a.id - b.id);
            });
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Storage initialization error:", error);
        setStorageStatus("Storage error: " + String(error));
      }
    };

    initializeStorage();

    // Cleanup
    return () => {
      gun.get("posts").map().off();
    };
  }, []);

  // Function to manually trigger save
  const saveToStorage = async (post: Post) => {
    return new Promise((resolve) => {
      gun
        .get("posts")
        .get(post.id.toString())
        .put(post, (ack) => {
          console.log("Save acknowledgment:", ack);
          resolve(ack);
        });
    });
  };

  if (loading) {
    return (
      <div>
        <h2>Loading...</h2>
        <p>Storage Status: {storageStatus}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Posts Database ({posts.length} posts)</h1>
      <p>Storage Status: {storageStatus}</p>
      <div style={{ maxHeight: "500px", overflow: "auto" }}>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              margin: "10px",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <h3>{post.title}</h3>
            <textarea
              value={post.body}
              onChange={async (e) => {
                const updatedPost = { ...post, body: e.target.value };
                await saveToStorage(updatedPost);
              }}
              style={{ width: "100%", minHeight: "100px" }}
            />
            <p>User ID: {post.userId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
