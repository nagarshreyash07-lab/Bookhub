
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function formatName(format) {
    if (format === "ebook") return "eBook";
    if (format === "paperback") return "Paperback";
    if (format === "hardcover") return "Hardcover";
    return format;
  }

  const allFreeEbooks = cartItems.length > 0 &&
    cartItems.every(
      (item) => item.format === "ebook" && Number(item.price) === 0
    );

  async function handleFreeCheckout() {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!allFreeEbooks) {
      setError("Only free ebooks can be checked out in test mode.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = await currentUser.getIdToken();

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            bookId: item._id || item.id,
            format: item.format,
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed.");
      }

      setMessage(data.message || "Order completed successfully!");

      // Clear cart after successful checkout.
      localStorage.removeItem("bookhub-cart");
      window.location.reload();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <Navbar />

      <main className="section">
        <h1>Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <p>Your cart is currently empty. Start exploring books!</p>
        ) : (
          <>
            <div className="cart-list">
              {cartItems.map((item) => {
                const bookId = item._id || item.id;
                const quantity = Number(item.quantity || 1);
                const isEbook = item.format === "ebook";

                return (
                  <div
                    key={`${bookId}-${item.format}`}
                    className="cart-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      padding: "20px 0",
                      borderBottom: "1px solid #eeeeee",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: item.coverColor || "#E8E9F5",
                        padding: "20px",
                        fontSize: "35px",
                        borderRadius: "8px",
                      }}
                    >
                      {item.cover || "📘"}
                    </div>

                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <h3>{item.title}</h3>
                      <p>{item.author}</p>
                      <p>
                        Edition: <strong>{formatName(item.format)}</strong>
                      </p>
                      <strong>₹{item.price}</strong>
                      <p>{isEbook ? "Digital edition" : `Available stock: ${item.stock}`}</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => updateQuantity(bookId, item.format, quantity - 1)}
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        disabled={isEbook || quantity >= item.stock}
                        onClick={() => updateQuantity(bookId, item.format, quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <strong>₹{Number(item.price) * quantity}</strong>

                    <button
                      type="button"
                      onClick={() => removeFromCart(bookId, item.format)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "30px" }}>
              <h2>Total: ₹{cartTotal}</h2>

              {error && (
                <p style={{ color: "red" }}>{error}</p>
              )}

              {message && (
                <p style={{ color: "green" }}>{message}</p>
              )}

              <button
                type="button"
                className="signup-btn"
                disabled={loading || !allFreeEbooks}
                onClick={handleFreeCheckout}
              >
                {loading
                  ? "Processing..."
                  : allFreeEbooks
                    ? "Get for Free"
                    : "Free ebooks only in test mode"}
              </button>

              {!allFreeEbooks && (
                <p style={{ color: "#777", marginTop: "10px" }}>
                  Test checkout currently supports only ₹0 ebooks.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Cart;
