import Dexie from "dexie";

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
  updatedAt?: number;
}

export class PostDatabase extends Dexie {
  posts: Dexie.Table<Post, number>;

  constructor() {
    super("PostDatabase");
    this.version(1).stores({
      posts: "id, userId, updatedAt",
    });
    this.posts = this.table("posts");
  }

  async batchUpsert(posts: Post[]) {
    return this.transaction("rw", this.posts, async () => {
      await this.posts.bulkPut(posts);
    });
  }

  async getAllPosts() {
    return this.posts.orderBy("id").toArray();
  }

  async getPost(id: number) {
    return this.posts.get(id);
  }

  async updatePost(post: Post) {
    return this.posts.put(post);
  }

  async searchPosts(query: string) {
    return this.posts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.body.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }

  async getPostsByUser(userId: number) {
    return this.posts.where("userId").equals(userId).toArray();
  }
}

export const db = new PostDatabase();