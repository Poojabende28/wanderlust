const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js");

require("dotenv").config({ path: "../.env" });

const MONGO_URL = process.env.MONGO_URI;

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
   initData.data  = initData.data.map((obj) => ({...obj, owner: "6a3ed29a81b815533da26da3"}) );
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

console.log(process.env.MONGO_URI);
initDB();

