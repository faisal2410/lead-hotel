const express =require("express");

const router = express.Router();

// middleware
const { requireSignin, hotelOwner } =require("../middlewarers/index");
// controllers
const {
  create,
  hotels,
  image,
  sellerHotels,
  remove,
  read,
  update,
  userHotelBookings,
  isAlreadyBooked,
  searchListings,
} =require("../controllers/hotel");

router.post("/create-hotel", requireSignin,  create);
router.get("/hotels", hotels);
router.get("/hotel/image/:hotelId", image);
router.get("/seller-hotels", requireSignin, sellerHotels);
router.delete("/delete-hotel/:hotelId", requireSignin, hotelOwner, remove);
router.get("/hotel/:hotelId", read);
router.put(
  "/update-hotel/:hotelId",
  requireSignin,
  hotelOwner,  
  update
);
// orders
router.get("/user-hotel-bookings", requireSignin, userHotelBookings);
router.get("/is-already-booked/:hotelId", requireSignin, isAlreadyBooked);
router.post("/search-listings", searchListings);

module.exports = router;
