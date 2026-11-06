
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import Book from "./models/Book.js";
import Order from "./models/Order.js";
import upload from "./middleware/upload.js";
import { verifyFirebaseToken } from "./middleware/verifyFirebaseToken.js";

dotenv.config();

const app = express();

// ======================================
// 1. MIDDLEWARE
// ======================================

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

// ======================================
// 2. WELCOME ROUTE
// ======================================

app.get("/", (req, res) => {
  res.send("Welcome to Bookhub Backend!");
});

// ======================================
// 3. GET ALL BOOKS
// ======================================

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching books",
      error: error.message,
    });
  }
});

// ======================================
// 4. GET SINGLE BOOK
// ======================================

app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({
      message: "Invalid book ID",
      error: error.message,
    });
  }
});

// ======================================
// 5. ADD NEW BOOK
// ======================================

app.post("/api/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();

    res.status(201).json({
      message: "Book added successfully!",
      book: savedBook,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================
// 6. UPLOAD PDF
// ======================================

app.post("/api/upload-pdf", upload.single("pdf"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file.",
      });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(200).json({
      message: "PDF uploaded successfully!",
      fileUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================
// 7. UPDATE BOOK
// ======================================

app.put("/api/books/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book updated successfully!",
      book: updatedBook,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================
// 8. DELETE BOOK
// ======================================

app.delete("/api/books/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book deleted successfully!",
      book: deletedBook,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================
// 9. FIREBASE AUTHENTICATION TEST
// ======================================

app.get("/api/auth/me", verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    message: "Authentication successful!",
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});


// ======================================
// 10. FREE EBOOK CHECKOUT
// ======================================

app.post("/api/orders", verifyFirebaseToken, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    const orderItems = [];

    for (const item of items) {
      const { bookId, format, quantity } = item;

      if (
        !bookId ||
        format !== "ebook" ||
        quantity !== 1
      ) {
        return res.status(400).json({
          message: "Only single free ebook purchases are allowed.",
        });
      }

      const book = await Book.findById(bookId);

      if (!book) {
        return res.status(404).json({
          message: "A selected book could not be found.",
        });
      }

      const ebookFormat = book.formats.find(
        (f) => f.type === "ebook"
      );

      if (!ebookFormat) {
        return res.status(400).json({
          message: `${book.title} does not have an ebook edition.`,
        });
      }

      if (ebookFormat.price !== 0) {
        return res.status(400).json({
          message: `${book.title} is not available for free.`,
        });
      }

      if (!ebookFormat.fileUrl) {
        return res.status(400).json({
          message: `${book.title} does not have an ebook file.`,
        });
      }

      orderItems.push({
        book: book._id,
        title: book.title,
        quantity: 1,
        price: 0,
        format: "ebook",
      });
    }

    const newOrder = new Order({
      userId: req.user.uid,
      customerEmail: req.user.email || "",
      items: orderItems,
      totalAmount: 0,
      status: "completed",
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Your free ebooks have been added to your library!",
      order: savedOrder,
    });

  } catch (error) {
    console.error("Checkout error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to complete your order.",
    });
  }
});


// ======================================
// MY LIBRARY - GET PURCHASED EBOOKS
// ======================================

app.get("/api/my-library", verifyFirebaseToken, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.uid,
      status: "completed",
      "items.format": "ebook",
    }).populate("items.book");

    const libraryBooks = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.format === "ebook" && item.book) {
          libraryBooks.push({
            _id: item.book._id,
            title: item.book.title,
            author: item.book.author,
            cover: item.book.cover,
            coverColor: item.book.coverColor,
            pages: item.book.pages,
            description: item.book.description,
            fileUrl:
              item.book.formats?.find(
                (format) => format.type === "ebook"
              )?.fileUrl || "",
            purchasedAt: order.createdAt,
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      books: libraryBooks,
    });
  } catch (error) {
    console.error("My Library error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load your library.",
    });
  }
});


// ======================================
// 11. HANDLE ERRORS
// ======================================

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  res.status(error.status || 500).json({
    message: error.message || "Something went wrong on the server.",
  });
});

// ======================================
// 12. START SERVER
// ======================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Bookhub server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
}

startServer();
