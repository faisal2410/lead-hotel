const Hotel =require("../models/hotel");
const Order =require("../models/order");
const multer = require('multer');
const fs =require("fs");

exports.create = async (req, res) => { 
 
  try {
    const storage=multer.diskStorage({
      destination: (req,file,callBack)=> {
          callBack(null,'public/media');
      },
      filename: (req,file,callBack)=> {
          callBack(null,file.originalname)
      }    
      
  });
  const maxSize = 5 * 1024 * 1024; // for 5MB  
  const upload=multer({
    storage:storage,
    fileFilter: (req, file, cb)=> {
      if(file.mimetype==="image/jpg"||
        file.mimetype==="image/png"||
        file.mimetype==="image/jpeg"||
        file.mimetype==="image/webp"      
      ){
        cb(null, true)
      }else{
        cb(null, false);
        return cb(new Error("Only jpg, png, jpeg and webp format is allowed"))
      }
    },
    limits: { fileSize: maxSize }
  }).array('photos', 12)
  upload(req,res, (error)=> {  
    console.log("req.fields", req.body);
    console.log("req.files", req.files);
    let fields=req.body
    let hotel = new Hotel(fields);
    hotel.postedBy = req.auth._id;    
    hotel.imageUrl= [req.files[0].path,req.files[1].path] 

    hotel.save((err, result) => {
      if (err) {
        console.log("saving hotel err => ", err);
        res.status(400).send("Error saving");
      }
      res.json(result);
    });


    if (error instanceof multer.MulterError) {        
      res.status(400).json({
        status:"Fail",
        message:error.message
      })
    } else if (error) {      
      res.status(400).json({
        status:"Fail",
        message:error.message
      })
    } 
});   
  } catch (err) {
    console.log(err);
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.hotels = async (req, res) => {
  // let all = await Hotel.find({ from: { $gte: new Date() } })
  let all = await Hotel.find({})
    .limit(24)
    .select("-imageUrl")
    .populate("postedBy", "_id name")
    .exec();
  // console.log(all);
  res.json(all);
};

exports.image = async (req, res) => {
  let hotel = await Hotel.findById(req.params.hotelId).exec();
  const hotelImage=await hotel?.imageUrl
  res.status(200).json({
    status:"success",
    image:hotelImage
  })
  // if (hotel && hotel.imageUrl!== null) {
  //   res.set("Content-Type", hotel.image.contentType);
  //   return res.send(hotel.image.data);
  // }
};

exports.sellerHotels = async (req, res) => {
  let all = await Hotel.find({ postedBy: req.auth._id })
    .select("-imageUrl")
    .populate("postedBy", "_id firstName")
    .exec();
  // console.log(all);
  res.status(200).json({
    status:"success",
   data:all});
};

exports.remove = async (req, res) => {
  let removed = await Hotel.findByIdAndDelete(req.params.hotelId)
    .select("-image.data")
    .exec();
  res.json(removed);
};

exports.read = async (req, res) => {
  let hotel = await Hotel.findById(req.params.hotelId)
    .populate("postedBy", "_id name")
    .select("-imageUrl")
    .exec();
  // console.log("SINGLE HOTEL", hotel);
  res.status(200).json({
    status:"success",
    data:hotel
  });
};

exports.update = async (req, res) => {
  try {
    const storage=multer.diskStorage({
      destination: (req,file,callBack)=> {
          callBack(null,'public/media');
      },
      filename: (req,file,callBack)=> {
          callBack(null,file.originalname)
      }    
      
  });
  const maxSize = 5 * 1024 * 1024; // for 5MB  
  const upload=multer({
    storage:storage,
    fileFilter: (req, file, cb)=> {
      if(file.mimetype==="image/jpg"||
        file.mimetype==="image/png"||
        file.mimetype==="image/jpeg"||
        file.mimetype==="image/webp"      
      ){
        cb(null, true)
      }else{
        cb(null, false);
        return cb(new Error("Only jpg, png, jpeg and webp format is allowed"))
      }
    },
    limits: { fileSize: maxSize }
  }).array('photos', 12)
  upload(req,res, async(error)=> {  
    // console.log("req.fields", req.body);
    // console.log("req.files", req.files);
    let fields=req.body
    let data={...fields}
    data.imageUrl=[req.files[0].path,req.files[1].path]
    let updated = await Hotel.findByIdAndUpdate(req.params.hotelId, data, {
      new: true,
    }).select("-imageUrl");

    res.json(updated);

    if (error instanceof multer.MulterError) {        
      res.status(400).json({
        status:"Fail",
        message:error.message
      })
    } else if (error) {      
      res.status(400).json({
        status:"Fail",
        message:error.message
      })
    } 
});   

    
  } catch (err) {
    console.log(err);
    res.status(400).send("Hotel update failed. Try again.");
  }
};

exports.userHotelBookings = async (req, res) => {
  const all = await Order.find({ orderedBy: req.auth._id })
    .select("session")
    .populate("hotel", "-imageUrl")
    .populate("orderedBy", "_id firstName")
    .exec();
  res.json(all);
};

exports.isAlreadyBooked = async (req, res) => {
  const { hotelId } = req.params;
  // find orders of the currently logged in user
  const userOrders = await Order.find({ orderedBy: req.auth._id })
    .select("hotel")
    .exec();
  // check if hotel id is found in userOrders array
  let ids = [];
  for (let i = 0; i < userOrders.length; i++) {
    ids.push(userOrders[i].hotel.toString());
  }
  res.json({
    ok: ids.includes(hotelId),
  });
};

exports.searchListings = async (req, res) => {
  const { location, date, bed } = req.body;
  // console.log(location, date, bed);
  // console.log(date);
  const fromDate = date.split(",");
  // console.log(fromDate[0]);
  let result = await Hotel.find({
    from: { $gte: new Date(fromDate[0]) },
    location,
  })
    .select("-imageUrl")
    .exec();
  // console.log("SEARCH LISTINGS", result);
  res.json(result);
};

/**
 * if you want to be more specific
 let result = await Listing.find({
  from: { $gte: new Date() },
  to: { $lte: to },
  location,
  bed,
})
 */
