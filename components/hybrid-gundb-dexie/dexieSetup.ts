import Dexie, { EntityTable } from "dexie";

const db = new Dexie("hotelDatabase") as Dexie & {
  hotelDatabase: EntityTable<
    {
      id: string;
      location: string;
      data: string;
      last_updated: number;
    },
    "id"
  >;
};
db.version(1).stores({
  hotelDatabase: "++id, last_updated, location",
});
export default db;
