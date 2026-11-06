
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";

function ExploreBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/books`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }

        const data = await response.json();
        setBooks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  return (
    <>
      <Navbar />

      <main className="section">
        <div className="container">
          <p className="eyebrow">OUR COLLECTION</p>

          <h1>Explore All Books</h1>

          {loading && <p>Loading books...</p>}

          {error && <p>Error: {error}</p>}

          {!loading && !error && books.length === 0 && (
            <p>No books available yet.</p>
          )}

          {!loading && !error && books.length > 0 && (
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default ExploreBooks;
