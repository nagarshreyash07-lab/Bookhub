
import mongoose from "mongoose";

const formatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ebook", "paperback", "hardcover"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    fileUrl: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    author: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    cover: {
      type: String,
      default: "📘",
    },

    coverColor: {
      type: String,
      default: "#E8E9F5",
    },

    rating: {
      type: Number,
      default: 0,
    },

    pages: Number,

    description: {
      type: String,
      default: "",
    },

    language: String,

    formats: {
      type: [formatSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);

export default Book;
