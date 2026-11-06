
import "./BookCard.css";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function BookCard({ book }) {
  const { addToCart } = useCart();

  const bookId = book._id || book.id;

  return (
    <article className="book-card">
      <Link
        to={`/books/${bookId}`}
        className="book-cover-link"
      >
        <div
          className="book-cover"
          style={{ backgroundColor: book.coverColor || book.color }}
        >
          <span>{book.cover}</span>
        </div>
      </Link>

      <div className="book-info">
        <p className="book-category">{book.category}</p>

        <h3>
          <Link
            to={`/books/${bookId}`}
            className="book-title-link"
          >
            {book.title}
          </Link>
        </h3>

        <p className="book-author">{book.author}</p>

        <div className="book-bottom">
          <strong>
            ₹{book.formats?.[0]?.price ?? book.price ?? "N/A"}
          </strong>

          <button
            className="add-btn"
            onClick={() => addToCart(book)}
          >
            Add +
          </button>
        </div>
      </div>
    </article>
  );
}

export default BookCard;