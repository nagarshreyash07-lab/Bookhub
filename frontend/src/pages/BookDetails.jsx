
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function BookDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [book, setBook] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBook() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
           `${import.meta.env.VITE_API_URL}/api/auth/me`,
        );

        if (!response.ok) {
          throw new Error("Book not found");
        }

        const data = await response.json();

        setBook(data);
        setSelectedFormat(data.formats?.[0]?.type || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="section">
          <p>Loading book details...</p>
        </main>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Navbar />
        <main className="section">
          <h2>Book not found</h2>
          <Link to="/books">Back to Books</Link>
        </main>
      </>
    );
  }

  const formats = book.formats || [];

  const currentFormat = formats.find(
    (format) => format.type === selectedFormat
  );

  function handleAddToCart() {
    if (!currentFormat) return;

    if (
      currentFormat.type !== "ebook" &&
      currentFormat.stock <= 0
    ) {
      alert("This edition is currently out of stock.");
      return;
    }

    // Pass the original book and selected format.
    addToCart(book, currentFormat.type);

    alert("Added to cart successfully!");
  }

  return (
    <div className="app">
      <Navbar />

      <main className="section">
        <Link to="/books" className="back-link">
          ← Back to Books
        </Link>

        <div className="details-container">
          <div
            className="details-cover"
            style={{
              backgroundColor: book.coverColor || "#E8E9F5",
            }}
          >
            {book.cover || "📘"}
          </div>

          <div className="details-info">
            <p className="eyebrow">{book.category}</p>

            <h1>{book.title}</h1>

            <p className="details-author">
              By {book.author}
            </p>

            <div className="details-rating">
              ⭐ {book.rating || 0} / 5
            </div>

            <p className="details-description">
              {book.description || "No description available."}
            </p>

            <div className="details-meta">
              <p>Pages: {book.pages || "Not specified"}</p>
              <p>Language: {book.language || "Not specified"}</p>
            </div>

            <hr />

            <h3>Choose your edition</h3>

            {formats.length === 0 ? (
              <p>No editions have been added yet.</p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    margin: "16px 0",
                  }}
                >
                  {formats.map((format) => (
                    <button
                      key={format.type}
                      type="button"
                      onClick={() =>
                        setSelectedFormat(format.type)
                      }
                      style={{
                        padding: "12px 18px",
                        borderRadius: "10px",
                        border:
                          selectedFormat === format.type
                            ? "2px solid #16a34a"
                            : "1px solid #ccc",
                        background:
                          selectedFormat === format.type
                            ? "#eaf7ee"
                            : "white",
                        color: "#222",
                        cursor: "pointer",
                      }}
                    >
                      {format.type === "ebook"
                        ? "eBook"
                        : format.type === "paperback"
                        ? "Paperback"
                        : "Hardcover"}
                    </button>
                  ))}
                </div>

                {currentFormat && (
                  <div>
                    <h2 className="details-price">
                      ₹{currentFormat.price}
                    </h2>

                    <p>
                      {currentFormat.type === "ebook"
                        ? "Digital edition · Read online"
                        : currentFormat.stock > 0
                        ? `${currentFormat.stock} copies available`
                        : "Currently out of stock"}
                    </p>

                    <button
                      className="signup-btn"
                      type="button"
                      onClick={handleAddToCart}
                      disabled={
                        currentFormat.type !== "ebook" &&
                        currentFormat.stock <= 0
                      }
                    >
                      Add to Cart
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookDetails;
