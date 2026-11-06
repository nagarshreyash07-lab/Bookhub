
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("bookhub-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Could not load cart:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bookhub-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Unique key for each book + format combination
  function getCartKey(item) {
    return `${item._id || item.id}-${item.format}`;
  }

  // Add a selected book format
  function addToCart(book, selectedFormat) {
    const format = book.formats?.find(
      (item) => item.type === selectedFormat
    );

    if (!format) {
      alert("Selected format is unavailable.");
      return;
    }

    const isEbook = format.type === "ebook";
    const availableStock = isEbook ? 1 : Number(format.stock || 0);

    if (!isEbook && availableStock <= 0) {
      alert("This format is currently out of stock.");
      return;
    }

    const bookId = String(book._id || book.id);

    const newItem = {
      _id: bookId,
      title: book.title,
      author: book.author,
      cover: book.cover,
      coverColor: book.coverColor,
      format: format.type,
      price: Number(format.price),
      stock: availableStock,
      fileUrl: format.fileUrl || "",
      quantity: 1,
    };

    const newKey = getCartKey(newItem);

    const existingBook = cartItems.find(
      (item) => getCartKey(item) === newKey
    );

    if (existingBook) {
      if (existingBook.quantity >= availableStock) {
        alert(`Only ${availableStock} copies are available.`);
        return;
      }

      setCartItems((previousItems) =>
        previousItems.map((item) =>
          getCartKey(item) === newKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems((previousItems) => [
        ...previousItems,
        newItem,
      ]);
    }
  }

  // Remove a specific book format
  function removeFromCart(id, format) {
    setCartItems((previousItems) =>
      previousItems.filter(
        (item) =>
          !(
            String(item._id || item.id) === String(id) &&
            item.format === format
          )
      )
    );
  }

  // Update quantity for a specific format
  function updateQuantity(id, format, quantity) {
    const newQuantity = Number(quantity);

    const book = cartItems.find(
      (item) =>
        String(item._id || item.id) === String(id) &&
        item.format === format
    );

    if (!book || !Number.isInteger(newQuantity)) return;

    if (newQuantity <= 0) {
      removeFromCart(id, format);
      return;
    }

    if (newQuantity > book.stock) {
      alert(`Only ${book.stock} copies are available.`);
      return;
    }

    setCartItems((previousItems) =>
      previousItems.map((item) =>
        String(item._id || item.id) === String(id) &&
        item.format === format
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
