
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Navbar from "../components/Navbar";
import "./EbookReader.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_URL = "http://localhost:5000";

function EbookReader() {
  const { id } = useParams();

  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [book, setBook] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // LOAD BOOK AND PDF
  useEffect(() => {
    let active = true;
    let loadingTask;

    async function loadBook() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/books/${id}`
        );

        if (!response.ok) {
          throw new Error("Could not find this book.");
        }

        const data = await response.json();

        const ebook = data.formats?.find(
          (format) => format.type === "ebook"
        );

        if (!ebook?.fileUrl) {
          throw new Error(
            "This book does not have an ebook PDF."
          );
        }

        const fileUrl = ebook.fileUrl.trim();

        const pdfUrl = /^https?:\/\//i.test(fileUrl)
          ? fileUrl
          : `${API_URL}/${fileUrl.replace(/^\/+/, "")}`;

        if (active) {
          setBook(data);
        }

        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
        });

        const loadedPdf = await loadingTask.promise;

        if (!active) {
          await loadedPdf.destroy();
          return;
        }

        pdfRef.current = loadedPdf;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setPage(1);
      } catch (err) {
        if (active) {
          console.error("PDF loading error:", err);
          setError(
            err.message || "Unable to load this ebook."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      loadingTask?.destroy();
      pdfRef.current = null;
    };
  }, [id]);

  // HIGH-RESOLUTION PAGE RENDERING
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      try {
        renderTaskRef.current?.cancel();

        const pdfPage = await pdfDoc.getPage(page);

        if (cancelled) return;

        const viewport = pdfPage.getViewport({
          scale: zoom,
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");

        // High-resolution rendering
        const pixelRatio = Math.max(
          2,
          window.devicePixelRatio || 1
        );

        canvas.width = Math.floor(
          viewport.width * pixelRatio
        );

        canvas.height = Math.floor(
          viewport.height * pixelRatio
        );

        // Actual displayed dimensions
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: [
            pixelRatio, 0,
            0, pixelRatio,
            0, 0,
          ],
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err) {
        if (
          !cancelled &&
          err.name !== "RenderingCancelledException"
        ) {
          console.error("Page rendering error:", err);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdfDoc, page, zoom]);

  // KEYBOARD NAVIGATION
  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        setPage((current) =>
          Math.min(current + 1, totalPages)
        );
      }

      if (event.key === "ArrowLeft") {
        setPage((current) =>
          Math.max(current - 1, 1)
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [totalPages]);

  // ZOOM: 50% TO 500%
  function changeZoom(amount) {
    setZoom((current) =>
      Math.min(
        5,
        Math.max(
          0.5,
          Math.round((current + amount) * 10) / 10
        )
      )
    );
  }

  // RESET ZOOM
  function resetZoom() {
    setZoom(1);
  }

  // FIT PAGE TO WIDTH
  async function fitWidth() {
    if (!readerRef.current || !pdfDoc) return;

    try {
      const pdfPage = await pdfDoc.getPage(page);
      const viewport = pdfPage.getViewport({
        scale: 1,
      });

      const availableWidth =
        readerRef.current.clientWidth - 80;

      setZoom(
        Math.min(
          5,
          Math.max(
            0.5,
            availableWidth / viewport.width
          )
        )
      );
    } catch (err) {
      console.error("Fit width error:", err);
    }
  }

  // FULLSCREEN
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await readerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }

  const progress = totalPages
    ? Math.round((page / totalPages) * 100)
    : 0;

  return (
    <>
      <Navbar />

      <main
        className={`ebook-reader ${
          darkMode ? "reader-dark" : ""
        }`}
        ref={readerRef}
      >
        <div className="reader-top">
          <Link to="/library" className="reader-back">
            ← My Library
          </Link>

          <div className="reader-book-info">
            <h2>{book?.title || "Bookhub Reader"}</h2>
            <p>{book?.author || "Your reading space"}</p>
          </div>

          <button
            className="reader-icon-btn"
            onClick={() =>
              setDarkMode((current) => !current)
            }
            title="Toggle reading theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="reader-toolbar">
          <div className="reader-page-controls">
            <button
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
              disabled={page <= 1}
            >
              ←
            </button>

            <span>
              {page} / {totalPages || "--"}
            </span>

            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              disabled={page >= totalPages}
            >
              →
            </button>
          </div>

          <div className="reader-zoom-controls">
            <button
              onClick={() => changeZoom(-0.1)}
              disabled={zoom <= 0.5}
            >
              −
            </button>

            <span>{Math.round(zoom * 100)}%</span>

            <button
              onClick={() => changeZoom(0.1)}
              disabled={zoom >= 5}
            >
              +
            </button>

            <button onClick={resetZoom}>
              100%
            </button>

            <button onClick={fitWidth}>
              Fit width
            </button>
          </div>

          <button
            className="reader-fullscreen"
            onClick={toggleFullscreen}
          >
            ⛶ Fullscreen
          </button>
        </div>

        <div className="reader-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <section className="reader-document">
          {loading && (
            <p>Preparing your reading experience...</p>
          )}

          {error && (
            <div className="reader-error">
              <h3>Unable to open this book</h3>
              <p>{error}</p>
              <Link to="/library">
                Return to My Library
              </Link>
            </div>
          )}

          {!loading && !error && (
            <canvas
              ref={canvasRef}
              className="reader-canvas"
            />
          )}
        </section>

        {!loading && !error && (
          <div className="reader-footer">
            <span>{progress}% completed</span>
            <span>Use ← → keys to turn pages</span>
          </div>
        )}
      </main>
    </>
  );
}

export default EbookReader;
