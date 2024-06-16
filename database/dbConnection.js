import mongoose from "mongoose";

const connectdDB = () => mongoose.connect(process.env.DB_URL).then(() => {
    console.log("Database connection is seccussfully");
}).catch(() => {
    console.log("Database connection is faild");
})

export default connectdDB