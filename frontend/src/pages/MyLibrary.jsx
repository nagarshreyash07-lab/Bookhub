
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./MyLibrary.css";

function MyLibrary() {
  const { currentUser } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLibrary() {
      try {
        if (!currentUser) {
          setBooks([]);
          return;
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your library.");
        }

        setBooks(data.books || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLibrary();
  }, [currentUser]);

  if (loading) {
    return <div className="library-message">Loading your library...</div>;
  }

  if (error) {
    return <div className="library-message">{error}</div>;
  }

  return (
    <div className="my-library">
      <div className="library-header">
        <div>
          <p className="library-eyebrow">YOUR PERSONAL COLLECTION</p>
          <h1>My Library</h1>
          <p>Every story you've purchased, all in one place.</p>
        </div>

        <Link to="/books" className="explore-library-btn">
          Explore Books
        </Link>
      </div>

      <div className="library-stats">
        <div>
          <h2>{books.length}</h2>
          <p>Books in your library</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="empty-library">
          <div className="empty-library-icon">📚</div>
          <h2>Your library is waiting.</h2>
          <p>
            Your purchased ebooks will appear here. Discover your next
            favourite read.
          </p>
          <Link to="/books" className="explore-library-btn">
            Discover Books
          </Link>
        </div>
      ) : (
        <div className="library-grid">
          {books.map((book) => (
            <div className="library-book-card" key={book._id}>
              <div
                className="library-book-cover"
                style={{ background: book.coverColor || "#eee" }}
              >
                {book.cover?.startsWith("http") ? (
                  <img src={book.cover} alt={book.title} />
                ) : (
                  <span>{book.cover || "📘"}</span>
                )}
              </div>

              <div className="library-book-info">
                <h3>{book.title}</h3>
                <p>{book.author}</p>

                {book.pages && (
                  <span>{book.pages} pages</span>
                )}

                <Link
                  to={`/read/${book._id}`}
                  className="read-book-btn"
                >
                  Read Book →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyLibrary;
