import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      // clerk user id
      type: string,
      required: true,
    },
    receiverId: {
      // clerk user id
      type: string,
      required: true,
    },
    content: {
      type: string,
      required: true,
    },
  },
  { timestamps: true } // this will add createdAt and updatedAt fields
);

export default mongoose.model("Message", messageSchema);
