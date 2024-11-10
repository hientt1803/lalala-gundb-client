"use client";

import { db, Post } from "@/configs/dexie/database";
import { gunService } from "@/configs/gun-db/gunService";
import React, { useEffect, useState } from "react";

export default function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>("Initializing...");

  useEffect(() => {
    const initializeAndSync = async () => {
      try {
        // Get data from IndexedDB first
        const localPosts = await db.getAllPosts();

        if (localPosts.length === 0) {
          setSyncStatus("Fetching initial data...");
          const response = await fetch(
            "https://jsonplaceholder.typicode.com/posts"
          );
          const fetchedPosts: Post[] = await response.json();

          const postsWithTimestamp = fetchedPosts.map((post) => ({
            ...post,
            updatedAt: Date.now(),
          }));

          // Batch insert to IndexedDB
          await db.batchUpsert(postsWithTimestamp);
          setPosts(postsWithTimestamp);

          // Sync to GunDB
          gunService.batchSync(postsWithTimestamp);
          console.log("Fetched new data and synced to GunDB");
        } else {
          setPosts(localPosts);
          console.log("Using existing data");
        }

        // Subscribe to updates from other clients
        gunService.subscribe(async (remotePost, id) => {
          const localPost = await db.getPost(remotePost.id);

          if (
            !localPost ||
            remotePost.updatedAt! > (localPost.updatedAt || 0)
          ) {
            await db.updatePost(remotePost);
            setPosts((prevPosts) => {
              const newPosts = prevPosts.filter((p) => p.id !== remotePost.id);
              return [...newPosts, remotePost].sort((a, b) => a.id - b.id);
            });
            console.log(`Synced post ${remotePost.id} from peer`);
            setSyncStatus(`Synced post ${remotePost.id} from peer`);
          }
        });

        setSyncStatus("Connected and synced");
        setLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        setSyncStatus(`Error: ${error}`);
        setLoading(false);
      }
    };

    initializeAndSync();

    return () => {
      gunService.unsubscribe();
    };
  }, []);

  const savePost = async (post: Post) => {
    try {
      const updatedPost = { ...post, updatedAt: Date.now() };

      // Save to IndexedDB
      await db.updatePost(updatedPost);

      // Update local state
      setPosts((prevPosts) => {
        const newPosts = prevPosts.filter((p) => p.id !== post.id);
        return [...newPosts, updatedPost].sort((a, b) => a.id - b.id);
      });

      // Sync to GunDB
      gunService.syncPost(updatedPost);

      setSyncStatus(`Saved post ${post.id} and synced to GunDB`);
    } catch (error) {
      console.error("Save error:", error);
      setSyncStatus(`Save error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Loading...</h2>
        <p>Status: {syncStatus}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Posts Database ({posts.length} posts)</h1>
      <p>Sync Status: {syncStatus}</p>
      <div style={{ maxHeight: "100vh", overflow: "auto" }}>
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
              onChange={(e) => {
                const updatedPost = { ...post, body: e.target.value };
                savePost(updatedPost);
              }}
              style={{ width: "100%", minHeight: "100px" }}
            />
            <p>User ID: {post.userId}</p>
            <p>
              Last updated: {new Date(post.updatedAt || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
