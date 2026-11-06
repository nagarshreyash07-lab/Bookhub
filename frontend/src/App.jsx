
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import EbookReader from "./pages/EbookReader";
import Home from "./pages/Home";
import ExploreBooks from "./pages/ExploreBooks";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import MyLibrary from "./pages/MyLibrary";
import BookDetails from "./pages/BookDetails";
import AdminBooks from "./pages/AdminBooks";
import Signup from "./pages/Signup";
import AuthTest from "./pages/AuthTest";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth-test" element={<AuthTest />} />
            <Route path="/read/:id" element={<EbookReader />} />
            <Route path="/library" element={<MyLibrary />} />
            <Route path="/signup" element={<Signup />} />
          <Route path="/books" element={<ExploreBooks />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminBooks />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
