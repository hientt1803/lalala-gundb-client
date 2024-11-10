import Gun from "gun/gun";
import "gun/lib/yson";

const gun = Gun({
  peers: ["https://lalala-gundb-server-production.up.railway.app/gun"],
  localStorage: true, // Bật localStorage
});
export default gun;
