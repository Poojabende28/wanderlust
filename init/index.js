const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
.then(async () => {
    console.log("connected to DB");
    await initDB();   
})
.catch((err) => {
    console.log(err);
});

const initDB = async () => {
    await Listing.deleteMany({});
   initData.data  = initData.data.map((obj) => ({...obj, owner: "6a329a7147df3e9478c13806"}) );
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();