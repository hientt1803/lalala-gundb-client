// // gunWorker.js
// import { getHotel, updateHotel } from "./gun-db";

// self.onmessage = async (event) => {
//   const { action, payload } = event.data;

//   if (action === "getHotel") {
//     getHotel((hotelData) => {
//       self.postMessage({ action: "hotelData", data: hotelData });
//     });
//   } else if (action === "updateHotel") {
//     updateHotel(payload);
//     self.postMessage({ action: "updateSuccess" });
//   }
// };