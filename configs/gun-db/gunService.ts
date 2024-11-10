import Gun from "gun";
import { Post } from "../dexie/database";

export class GunService {
  // @ts-ignore
  private gun: Gun;

  constructor() {
    this.gun = Gun({
      peers: ["http://localhost:8080/gun"],
      localStorage: false,
      radisk: false,
    });
  }

  syncPost(post: Post): void {
    this.gun.get("posts").get(post.id.toString()).put(post);
  }

  batchSync(posts: Post[]): void {
    posts.forEach((post) => {
      this.syncPost(post);
    });
  }

  subscribe(callback: (post: Post, id: string) => void) {
    this.gun
      .get("posts")
      .map()
      .on((data: Post, id: string) => {
        if (data && data.updatedAt) {
          callback(data, id);
        }
      });
  }

  unsubscribe() {
    this.gun.get("posts").map().off();
  }
}

export const gunService = new GunService();
