
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";

function Home() {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch books from MongoDB through Express
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

  // Search books by title, author or category
  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.author} ${book.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </p>

            <h1>
              Discover stories.
              <br />
              <span>Discover yourself.</span>
            </h1>

            <p className="hero-description">
              Explore books, discover new perspectives and find
              your next favourite read.
            </p>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search books, authors or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button>Search</button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="categories section" id="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE</p>
              <h2>Browse Categories</h2>
            </div>
          </div>

          <div className="category-list">
            {[
              "Fiction",
              "Self Development",
              "Productivity",
              "Education",
            ].map((category) => (
              <button
                className="category-chip"
                key={category}
                onClick={() => setSearch(category)}
              >
                {category}
              </button>
            ))}

            <button
              className="category-chip"
              onClick={() => setSearch("")}
            >
              All Books
            </button>
          </div>
        </section>

        {/* Featured Books */}
        <section className="books-section section" id="books">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HANDPICKED FOR YOU</p>
              <h2>Featured Books</h2>
            </div>

            <span className="book-count">
              {filteredBooks.length} books
            </span>
          </div>

          <div className="book-grid">
            {loading ? (
              <p>Loading books...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))
            ) : (
              <p>No books found. Try another search.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="footer" id="about">
        <h2>bookhub.</h2>
        <p>Discover. Read. Publish.</p>
        <p>© 2026 Bookhub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
