import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./AdminBooks.css";

const API_BASE = "http://localhost:5000";
const BOOKS_API = `${API_BASE}/api/books`;
const MAX_PDF_SIZE = 20 * 1024 * 1024;

const emptyForm = {
  title: "",
  author: "",
  category: "",
  cover: "📘",
  coverColor: "#E8E9F5",
  rating: "",
  pages: "",
  description: "",
  language: "",
  ebookEnabled: false,
  ebookPrice: "",
  ebookFileUrl: "",
  paperbackEnabled: true,
  paperbackPrice: "",
  paperbackStock: "0",
  hardcoverEnabled: false,
  hardcoverPrice: "",
  hardcoverStock: "0",
};

function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [ebookSource, setEbookSource] = useState("upload");
  const [ebookPdfFile, setEbookPdfFile] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  async function fetchBooks(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(BOOKS_API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not fetch books.");
      }

      setBooks(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not connect to the Bookhub server.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setEbookSource("upload");
    setEbookPdfFile(null);
    setMessage("");
    setError("");
  }

  async function uploadPdf() {
    if (!ebookPdfFile) {
      return formData.ebookFileUrl.trim();
    }

    if (ebookPdfFile.type !== "application/pdf" &&
        !ebookPdfFile.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Please select a valid PDF file.");
    }

    if (ebookPdfFile.size > MAX_PDF_SIZE) {
      throw new Error("PDF must be smaller than 20 MB.");
    }

    const uploadData = new FormData();
    uploadData.append("pdf", ebookPdfFile);

    setUploadingPdf(true);

    try {
      const response = await fetch(`${API_BASE}/api/upload-pdf`, {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "PDF upload failed.");
      }

      if (!result.fileUrl) {
        throw new Error("The server did not return a PDF URL.");
      }

      return result.fileUrl;
    } finally {
      setUploadingPdf(false);
    }
  }

  function buildFormats(ebookFileUrl) {
    const formats = [];

    if (formData.ebookEnabled) {
      const price = Number(formData.ebookPrice);

      if (formData.ebookPrice === "" || !Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid eBook price.");
      }

      if (!ebookFileUrl) {
        throw new Error("Upload a PDF or provide a PDF link for the eBook.");
      }

      formats.push({
        type: "ebook",
        price,
        stock: 0,
        fileUrl: ebookFileUrl,
      });
    }

    if (formData.paperbackEnabled) {
      const price = Number(formData.paperbackPrice);
      const stock = Number(formData.paperbackStock);

      if (formData.paperbackPrice === "" || !Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid paperback price.");
      }

      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("Paperback stock must be a non-negative whole number.");
      }

      formats.push({ type: "paperback", price, stock, fileUrl: "" });
    }

    if (formData.hardcoverEnabled) {
      const price = Number(formData.hardcoverPrice);
      const stock = Number(formData.hardcoverStock);

      if (formData.hardcoverPrice === "" || !Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid hardcover price.");
      }

      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("Hardcover stock must be a non-negative whole number.");
      }

      formats.push({ type: "hardcover", price, stock, fileUrl: "" });
    }

    if (formats.length === 0) {
      throw new Error("Enable at least one book format.");
    }

    return formats;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (!formData.title.trim() || !formData.author.trim() || !formData.category.trim()) {
        throw new Error("Please complete the required book information.");
      }

      let ebookFileUrl = formData.ebookFileUrl.trim();

      if (formData.ebookEnabled) {
        if (ebookSource === "link") {
          if (!ebookFileUrl) {
            throw new Error("Please enter a PDF link.");
          }

          try {
            const parsedUrl = new URL(ebookFileUrl);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
              throw new Error();
            }
          } catch {
            throw new Error("Please enter a valid PDF URL starting with http:// or https://.");
          }
        } else if (ebookPdfFile) {
          ebookFileUrl = await uploadPdf();
        } else if (!ebookFileUrl) {
          throw new Error("Please select a PDF file.");
        }
      }

      const formats = buildFormats(ebookFileUrl);

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category.trim(),
        cover: formData.cover || "📘",
        coverColor: formData.coverColor || "#E8E9F5",
        rating: formData.rating === "" ? 0 : Number(formData.rating),
        pages: formData.pages === "" ? undefined : Number(formData.pages),
        description: formData.description.trim(),
        language: formData.language.trim(),
        formats,
      };

      if (!Number.isFinite(bookData.rating) || bookData.rating < 0 || bookData.rating > 5) {
        throw new Error("Rating must be between 0 and 5.");
      }

      if (bookData.pages !== undefined &&
          (!Number.isInteger(bookData.pages) || bookData.pages < 1)) {
        throw new Error("Pages must be a positive whole number.");
      }

      setIsSaving(true);

      const response = await fetch(
        editingId ? `${BOOKS_API}/${editingId}` : BOOKS_API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save the book.");
      }

      setMessage(editingId ? "Book updated successfully!" : "Book added successfully!");
      setEditingId(null);
      setFormData({ ...emptyForm });
      setEbookSource("upload");
      setEbookPdfFile(null);
      await fetchBooks(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
      setUploadingPdf(false);
    }
  }

  function handleEdit(book) {
    const formats = book.formats || [];
    const ebook = formats.find((item) => item.type === "ebook");
    const paperback = formats.find((item) => item.type === "paperback");
    const hardcover = formats.find((item) => item.type === "hardcover");
    const legacyPaperback = formats.length === 0;

    setEditingId(book._id);
    setEbookSource(ebook?.fileUrl ? "link" : "upload");
    setEbookPdfFile(null);

    setFormData({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      cover: book.cover || "📘",
      coverColor: book.coverColor || "#E8E9F5",
      rating: book.rating ?? "",
      pages: book.pages ?? "",
      description: book.description || "",
      language: book.language || "",
      ebookEnabled: Boolean(ebook),
      ebookPrice: ebook?.price ?? "",
      ebookFileUrl: ebook?.fileUrl || "",
      paperbackEnabled: Boolean(paperback) || legacyPaperback,
      paperbackPrice: paperback?.price ?? (legacyPaperback ? book.price ?? "" : ""),
      paperbackStock: paperback?.stock ?? (legacyPaperback ? book.stock ?? 0 : 0),
      hardcoverEnabled: Boolean(hardcover),
      hardcoverPrice: hardcover?.price ?? "",
      hardcoverStock: hardcover?.stock ?? 0,
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${BOOKS_API}/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete book.");
      }

      setMessage("Book deleted successfully!");
      if (editingId === id) resetForm();
      await fetchBooks(false);
    } catch (err) {
      setError(err.message || "Could not delete book.");
    }
  }

  const categories = [...new Set(books.map((book) => book.category).filter(Boolean))];

  const filteredBooks = books.filter((book) => {
    const searchText = search.toLowerCase();
    const matchesSearch = [book.title, book.author, book.category]
      .join(" ")
      .toLowerCase()
      .includes(searchText);

    return matchesSearch &&
      (selectedCategory === "All" || book.category === selectedCategory);
  });

  const totalStock = books.reduce(
    (total, book) => total + (book.formats || []).reduce(
      (sum, format) => sum + (format.type === "ebook" ? 0 : Number(format.stock || 0)),
      0
    ),
    0
  );

  const outOfStock = books.filter((book) => {
    const physical = (book.formats || []).filter((format) => format.type !== "ebook");
    return physical.length > 0 && physical.every((format) => Number(format.stock) === 0);
  }).length;

  function formatLabel(type) {
    return ({ ebook: "eBook", paperback: "Paperback", hardcover: "Hardcover" })[type] || type;
  }

  return (
    <div className="app admin-page">
      <Navbar />

      <main className="admin-dashboard">
        <section className="admin-header">
          <div>
            <p className="admin-eyebrow">BOOKHUB MANAGEMENT</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Manage your catalogue, editions and inventory.</p>
          </div>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => fetchBooks()}>
            <span aria-hidden="true">↻</span> Refresh books
          </button>
        </section>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <span>Total books</span>
            <strong>{books.length}</strong>
            <small>Books in your catalogue</small>
          </article>
          <article className="admin-stat-card">
            <span>Physical copies</span>
            <strong>{totalStock}</strong>
            <small>Paperback + hardcover stock</small>
          </article>
          <article className="admin-stat-card">
            <span>Out of stock</span>
            <strong>{outOfStock}</strong>
            <small>Physical editions unavailable</small>
          </article>
        </section>

        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">{editingId ? "UPDATE CATALOGUE" : "NEW ADDITION"}</p>
              <h2>{editingId ? "Edit book" : "Add a new book"}</h2>
              <p>Enter the book details, then choose which editions customers can buy.</p>
            </div>
            {editingId && <span className="admin-editing-pill">Editing book</span>}
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-section">
              <div className="admin-section-title">
                <span className="admin-section-number">01</span>
                <div><h3>Book information</h3><p>Basic details shown on the book page.</p></div>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Book title <b>*</b></span>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Atomic Habits" required />
                </label>
                <label className="admin-field">
                  <span>Author <b>*</b></span>
                  <input name="author" value={formData.author} onChange={handleChange} placeholder="Author name" required />
                </label>
                <label className="admin-field">
                  <span>Category <b>*</b></span>
                  <input name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Self Development" required />
                </label>
                <label className="admin-field">
                  <span>Language</span>
                  <input name="language" value={formData.language} onChange={handleChange} placeholder="e.g. English" />
                </label>
                <label className="admin-field">
                  <span>Rating (0–5)</span>
                  <input name="rating" type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={handleChange} placeholder="4.5" />
                </label>
                <label className="admin-field">
                  <span>Number of pages</span>
                  <input name="pages" type="number" min="1" step="1" value={formData.pages} onChange={handleChange} placeholder="e.g. 320" />
                </label>
                <label className="admin-field">
                  <span>Cover emoji</span>
                  <input name="cover" value={formData.cover} onChange={handleChange} placeholder="📘" />
                </label>
                <label className="admin-field">
                  <span>Cover background</span>
                  <input name="coverColor" type="color" value={formData.coverColor} onChange={handleChange} className="admin-color-input" />
                </label>
                <label className="admin-field admin-field-wide">
                  <span>Description</span>
                  <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Write a short description of this book..." />
                </label>
              </div>
            </div>

            <div className="admin-form-section">
              <div className="admin-section-title">
                <span className="admin-section-number">02</span>
                <div><h3>Available editions</h3><p>Enable one or more formats and set their prices.</p></div>
              </div>

              <article className={`admin-edition-editor ${formData.ebookEnabled ? "is-enabled" : ""}`}>
                <div className="admin-edition-top">
                  <div className="admin-edition-icon">PDF</div>
                  <div className="admin-edition-heading"><h4>Digital edition</h4><p>Customers can access the eBook digitally.</p></div>
                  <label className="admin-switch">
                    <input type="checkbox" name="ebookEnabled" checked={formData.ebookEnabled} onChange={handleChange} />
                    <span className="admin-switch-track" />
                    <span className="admin-switch-label">{formData.ebookEnabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>

                {formData.ebookEnabled && (
                  <div className="admin-edition-fields">
                    <label className="admin-field admin-price-field">
                      <span>eBook price (₹) <b>*</b></span>
                      <input name="ebookPrice" type="number" min="0" step="0.01" value={formData.ebookPrice} onChange={handleChange} placeholder="199" required />
                    </label>

                    <div className="admin-field admin-field-wide">
                      <span>PDF source <b>*</b></span>
                      <div className="admin-choice-row">
                        <button type="button" className={`admin-choice ${ebookSource === "upload" ? "active" : ""}`} onClick={() => setEbookSource("upload")}> <span>↑</span> Upload PDF</button>
                        <button type="button" className={`admin-choice ${ebookSource === "link" ? "active" : ""}`} onClick={() => setEbookSource("link")}> <span>↗</span> Use PDF link</button>
                      </div>

                      {ebookSource === "upload" ? (
                        <div className="admin-upload-box">
                          <input
                            id="ebook-pdf"
                            className="admin-file-input"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              if (file && file.size > MAX_PDF_SIZE) {
                                setError("PDF must be smaller than 20 MB.");
                                event.target.value = "";
                                setEbookPdfFile(null);
                                return;
                              }
                              setError("");
                              setEbookPdfFile(file);
                            }}
                          />
                          <label htmlFor="ebook-pdf" className="admin-upload-label">
                            <span className="admin-upload-symbol">＋</span>
                            <strong>{ebookPdfFile ? ebookPdfFile.name : "Choose a PDF file"}</strong>
                            <small>{ebookPdfFile ? `${(ebookPdfFile.size / (1024 * 1024)).toFixed(2)} MB selected` : "Click to browse · PDF only · Maximum 20 MB"}</small>
                          </label>
                          {formData.ebookFileUrl && !ebookPdfFile && <p className="admin-help-text">A PDF is already saved. Choose a new file only if you want to replace it.</p>}
                        </div>
                      ) : (
                        <input
                          name="ebookFileUrl"
                          type="url"
                          value={formData.ebookFileUrl}
                          onChange={handleChange}
                          placeholder="https://example.com/book.pdf"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </article>

              <article className={`admin-edition-editor ${formData.paperbackEnabled ? "is-enabled" : ""}`}>
                <div className="admin-edition-top">
                  <div className="admin-edition-icon paperback-icon">PB</div>
                  <div className="admin-edition-heading"><h4>Paperback edition</h4><p>Printed book with a flexible cover.</p></div>
                  <label className="admin-switch">
                    <input type="checkbox" name="paperbackEnabled" checked={formData.paperbackEnabled} onChange={handleChange} />
                    <span className="admin-switch-track" />
                    <span className="admin-switch-label">{formData.paperbackEnabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
                {formData.paperbackEnabled && (
                  <div className="admin-edition-fields two-columns">
                    <label className="admin-field"><span>Paperback price (₹) <b>*</b></span><input name="paperbackPrice" type="number" min="0" step="0.01" value={formData.paperbackPrice} onChange={handleChange} placeholder="349" required /></label>
                    <label className="admin-field"><span>Available copies <b>*</b></span><input name="paperbackStock" type="number" min="0" step="1" value={formData.paperbackStock} onChange={handleChange} placeholder="20" required /></label>
                  </div>
                )}
              </article>

              <article className={`admin-edition-editor ${formData.hardcoverEnabled ? "is-enabled" : ""}`}>
                <div className="admin-edition-top">
                  <div className="admin-edition-icon hardcover-icon">HC</div>
                  <div className="admin-edition-heading"><h4>Hardcover edition</h4><p>Printed book with a rigid cover.</p></div>
                  <label className="admin-switch">
                    <input type="checkbox" name="hardcoverEnabled" checked={formData.hardcoverEnabled} onChange={handleChange} />
                    <span className="admin-switch-track" />
                    <span className="admin-switch-label">{formData.hardcoverEnabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
                {formData.hardcoverEnabled && (
                  <div className="admin-edition-fields two-columns">
                    <label className="admin-field"><span>Hardcover price (₹) <b>*</b></span><input name="hardcoverPrice" type="number" min="0" step="0.01" value={formData.hardcoverPrice} onChange={handleChange} placeholder="499" required /></label>
                    <label className="admin-field"><span>Available copies <b>*</b></span><input name="hardcoverStock" type="number" min="0" step="1" value={formData.hardcoverStock} onChange={handleChange} placeholder="10" required /></label>
                  </div>
                )}
              </article>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving || uploadingPdf}>
                {uploadingPdf ? "Uploading PDF..." : isSaving ? "Saving book..." : editingId ? "Save changes" : "Add book to catalogue"}
              </button>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={resetForm}> {editingId ? "Cancel editing" : "Clear form"} </button>
            </div>
          </form>
        </section>

        <section className="admin-panel admin-collection">
          <div className="admin-panel-heading">
            <div><p className="admin-eyebrow">YOUR INVENTORY</p><h2>Manage books</h2><p>{filteredBooks.length} of {books.length} books displayed</p></div>
          </div>

          <div className="admin-filters">
            <input type="search" placeholder="Search by title, author or category..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="All">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="admin-empty-state">Loading your catalogue...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="admin-empty-state">No books found. Add a book or try another search.</div>
          ) : (
            <div className="admin-books-grid">
              {filteredBooks.map((book) => (
                <article className="admin-book-card" key={book._id}>
                  <div className="admin-book-cover" style={{ backgroundColor: book.coverColor || "#E8E9F5" }}>{book.cover || "📘"}</div>
                  <div className="admin-book-content">
                    <div className="admin-book-title-row"><div><h3>{book.title}</h3><p>By {book.author}</p></div></div>
                    <div className="admin-book-meta"><span>{book.category}</span><span>★ {book.rating || 0}/5</span><span>{book.language || "Language not set"}</span><span>{book.pages || "N/A"} pages</span></div>
                    <h4 className="admin-card-subheading">Available editions</h4>
                    {(book.formats || []).length ? (
                      <div className="admin-edition-list">
                        {book.formats.map((format) => (
                          <div className="admin-stock-row" key={format.type}>
                            <span>{formatLabel(format.type)} · ₹{format.price}</span>
                            <strong>{format.type === "ebook" ? "Digital" : `${format.stock} copies`}</strong>
                          </div>
                        ))}
                      </div>
                    ) : <p className="admin-book-description">Legacy book — edit to configure editions.</p>}
                    <p className="admin-book-description">{book.description || "No description available."}</p>
                    <div className="admin-book-actions">
                      <button type="button" className="admin-btn admin-btn-small admin-btn-primary" onClick={() => handleEdit(book)}>Edit book</button>
                      <button type="button" className="admin-btn admin-btn-small admin-btn-danger" onClick={() => handleDelete(book._id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminBooks;
