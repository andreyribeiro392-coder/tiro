const categories = useMemo(() => getCategories(movies), [movies]);

useEffect(() => {
  document.title = "Drike";

  const faviconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#b30000"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">D</text>
    </svg>
  `;

  const faviconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(faviconSvg)}`;

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
  }
  link.setAttribute("href", faviconUrl);
}, []);

const filteredMovies = useMemo(() => {
  let result = Array.isArray(movies) ? [...movies] : [];

  if (category !== "Todos") {
    result = result.filter((movie) => (movie?.category || "") === category);
  }

  if (search.trim()) {
    const q = slugify(search);
    result = result.filter((movie) => {
      return (
        slugify(movie?.title || "").includes(q) ||
        slugify(movie?.category || "").includes(q) ||
        slugify(movie?.description || "").includes(q) ||
        slugify(movie?.cast || "").includes(q) ||
        slugify(movie?.type || "").includes(q)
      );
    });
  }

  if (sortBy === "popularidade") {
    result.sort((a, b) => (b?.popularity || 0) - (a?.popularity || 0));
  } else if (sortBy === "ano") {
    result.sort((a, b) => (b?.year || 0) - (a?.year || 0));
  } else if (sortBy === "titulo") {
    result.sort((a, b) =>
      String(a?.title || "").localeCompare(String(b?.title || ""))
    );
  } else if (sortBy === "lancamento") {
    result.sort((a, b) => Number(b?.featured) - Number(a?.featured));
  }

  return result;
}, [movies, category, search, sortBy]);

const featuredMovies = useMemo(
  () => (Array.isArray(movies) ? movies.filter((movie) => movie?.featured).slice(0, 6) : []),
  [movies]
);

const heroMovie = featuredMovies[0] || movies[0] || null;

const favoritesMovies = useMemo(
  () =>
    (Array.isArray(movies) ? movies : []).filter((movie) =>
      Array.isArray(favorites) ? favorites.includes(movie?.id) : false
    ),
  [movies, favorites]
);

const continueMovies = useMemo(() => {
  return (Array.isArray(movies) ? movies : [])
    .filter((movie) => (continueWatching?.[movie?.id]?.progress || 0) > 0)
    .sort(
      (a, b) =>
        (continueWatching?.[b?.id]?.updatedAt || 0) -
        (continueWatching?.[a?.id]?.updatedAt || 0)
    );
}, [movies, continueWatching]);

const trendingMovies = useMemo(
  () =>
    [...(Array.isArray(movies) ? movies : [])]
      .sort((a, b) => (b?.popularity || 0) - (a?.popularity || 0))
      .slice(0, 8),
  [movies]
);

const newReleases = useMemo(
  () =>
    [...(Array.isArray(movies) ? movies : [])]
      .sort((a, b) => (b?.year || 0) - (a?.year || 0))
      .slice(0, 8),
  [movies]
);

const animeMovies = useMemo(
  () =>
    (Array.isArray(movies) ? movies : []).filter(
      (movie) => movie?.category === "Anime" || movie?.type === "Anime"
    ),
  [movies]
);

function goToHome() {
  setSelectedMovie(null);
  window.location.hash = "inicio";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleFavorite(id) {
  setFavorites((prev) =>
    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
  );
}

function openDetails(movie) {
  if (!movie) return;

  setSelectedMovie(movie);
  setHistory((prev) => {
    const next = [movie.id, ...prev.filter((id) => id !== movie.id)];
    return next.slice(0, 20);
  });
}

function saveProgress(movieId, progress) {
  setContinueWatching((prev) => ({
    ...prev,
    [movieId]: {
      progress,
      updatedAt: Date.now(),
    },
  }));
}

async function handleAddMovie(movie) {
  try {
    const newMovie = normalizeMovie({
      ...movie,
      id: movie?.id || Date.now(),
    });

    await setDoc(doc(db, "movies", String(newMovie.id)), newMovie);
  } catch (error) {
    console.error("Erro ao adicionar filme:", error);
    alert("Não foi possível adicionar o filme.");
  }
}

async function handleUpdateMovie(updatedMovie) {
  try {
    const movieToSave = normalizeMovie(updatedMovie);
    await setDoc(doc(db, "movies", String(movieToSave.id)), movieToSave);
  } catch (error) {
    console.error("Erro ao atualizar filme:", error);
    alert("Não foi possível atualizar o filme.");
  }
}

async function handleDeleteMovie(id) {
  try {
    await deleteDoc(doc(db, "movies", String(id)));

    setFavorites((prev) => prev.filter((favId) => favId !== id));

    setContinueWatching((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (selectedMovie?.id === id) {
      setSelectedMovie(null);
    }
  } catch (error) {
    console.error("Erro ao remover filme:", error);
    alert("Não foi possível remover o filme.");
  }
}

async function handleGoogleLogin() {
  try {
    setGoogleLoading(true);
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("ERRO GOOGLE LOGIN:", error);

    const code = error?.code || "";
    if (code.includes("popup-closed-by-user")) {
      alert("Login cancelado antes de concluir.");
    } else if (code.includes("popup-blocked")) {
      alert("O navegador bloqueou o popup do Google. Libere popups e tente de novo.");
    } else if (code.includes("unauthorized-domain")) {
      alert("Seu domínio da Vercel ainda não foi autorizado no Firebase Authentication.");
    } else if (code.includes("operation-not-allowed")) {
      alert("O login com Google ainda não está ativado no Firebase Authentication.");
    } else {
      alert(error?.message || "Erro ao entrar com Google.");
    }
  } finally {
    setGoogleLoading(false);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch {
    alert("Não foi possível sair da conta agora.");
  }
}

const related = getRelatedMovies(selectedMovie, movies);

const historyMovies = useMemo(
  () =>
    (Array.isArray(history) ? history : [])
      .map((id) => (Array.isArray(movies) ? movies.find((movie) => movie?.id === id) : null))
      .filter(Boolean),
  [history, movies]
);

return (
  <div
    className="app-shell"
    style={{
      "--primary": "#d40000",
      "--primary-2": "#ff2a2a",
      "--accent-red": "#ff1f1f",
      "--hero-overlay": "linear-gradient(90deg, rgba(20,0,0,0.96) 0%, rgba(20,0,0,0.78) 45%, rgba(20,0,0,0.2) 100%)",
      background:
        "linear-gradient(180deg, #120000 0%, #090909 45%, #050505 100%)",
      minHeight: "100vh",
    }}
  >
    <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
      <div className="brand-row">
        <button
          type="button"
          className="brand-logo"
          onClick={goToHome}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ffffff",
          }}
          aria-label="Voltar para o início"
          title="Voltar para o início"
        >
          DRIKE
        </button>

        <nav className="main-nav">
          <a href="#inicio">Início</a>
          <a href="#em-alta">Em alta</a>
          <a href="#catalogo">Catálogo</a>
          <a href="#animes">Animes</a>
          <a href="#minha-lista">Minha lista</a>
        </nav>
      </div>

      <div className="topbar-actions">
        <div className="search-area">
          <input
            type="text"
            placeholder="Buscar filmes, séries, animes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {user?.email === ADMIN_EMAIL && (
          <button className="admin-btn" onClick={() => setShowAdmin(true)}>
            Painel
          </button>
        )}

        {user ? (
          <div className="user-box">
            <img
              src={user?.photoURL || "https://via.placeholder.com/40"}
              alt="perfil"
            />
            <span>{user?.displayName?.split(" ")[0] || "Usuário"}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Sair
            </button>
          </div>
        ) : (
          <button className="google-btn" onClick={handleGoogleLogin}>
            {googleLoading ? "Entrando..." : "Entrar com Google"}
          </button>
        )}
      </div>
    </header>

    {heroMovie && (
      <section
        id="inicio"
        className="hero-section"
        style={{
          backgroundImage: `url(${heroMovie?.banner || heroMovie?.cover || ""})`,
        }}
      >
        <div
          className="hero-gradient"
          style={{
            background:
              "linear-gradient(90deg, rgba(20,0,0,0.96) 0%, rgba(20,0,0,0.78) 45%, rgba(20,0,0,0.2) 100%)",
          }}
        >
          <div className="hero-inner">
            <span className="hero-tag">
              {heroMovie?.releaseTag || "Destaque"}
            </span>

            <h1>{heroMovie?.title || "Drike"}</h1>

            <p className="hero-meta">
              {heroMovie?.type || "Filme"} • {heroMovie?.category || "Categoria"} •{" "}
              {heroMovie?.year || "2026"} • {heroMovie?.duration || "Duração"} •{" "}
              {heroMovie?.rating || "Livre"}
            </p>

            <p className="hero-description">{heroMovie?.description || ""}</p>

            <div className="hero-buttons">
              <button
                className="secondary-btn"
                onClick={() => openDetails(heroMovie)}
              >
                Mais informações
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-box">
                <strong>{Array.isArray(movies) ? movies.length : 0}</strong>
                <span>Títulos</span>
              </div>

              <div className="stat-box">
                <strong>{Array.isArray(favorites) ? favorites.length : 0}</strong>
                <span>Favoritos</span>
              </div>

              <div className="stat-box">
                <strong>{featuredMovies.length}</strong>
                <span>Destaques</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )}

    <main className="main-content">
      <section className="filters-bar" id="catalogo">
        <div className="filter-group">
          <label>Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Ordenar por</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popularidade">Popularidade</option>
            <option value="ano">Ano</option>
            <option value="titulo">Título</option>
            <option value="lancamento">Lançamento</option>
          </select>
        </div>
      </section>

      <section id="em-alta">
        <Shelf
          title="Em alta"
          items={trendingMovies}
          favorites={favorites}
          onOpenDetails={openDetails}
          onToggleFavorite={toggleFavorite}
        />
      </section>

      <Shelf
        title="Lançamentos"
        items={newReleases}
        favorites={favorites}
        onOpenDetails={openDetails}
        onToggleFavorite={toggleFavorite}
      />

      <section id="animes">
        <Shelf
          title="Animes"
          items={animeMovies}
          favorites={favorites}
          onOpenDetails={openDetails}
          onToggleFavorite={toggleFavorite}
        />
      </section>

      {continueMovies.length > 0 && (
        <Shelf
          title="Continuar assistindo"
          items={continueMovies}
          favorites={favorites}
          onOpenDetails={openDetails}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {favoritesMovies.length > 0 && (
        <section id="minha-lista">
          <Shelf
            title="Minha Lista"
            items={favoritesMovies}
            favorites={favorites}
            onOpenDetails={openDetails}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      )}

      {historyMovies.length > 0 && (
        <Shelf
          title="Histórico"
          items={historyMovies}
          favorites={favorites}
          onOpenDetails={openDetails}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <Shelf
        title="Todos os títulos filtrados"
        items={filteredMovies}
        favorites={favorites}
        onOpenDetails={openDetails}
        onToggleFavorite={toggleFavorite}
      />
    </main>

    <DetailsModal
      movie={selectedMovie}
      open={!!selectedMovie}
      onClose={() => setSelectedMovie(null)}
      onPlay={openDetails}
      onToggleFavorite={toggleFavorite}
      isFavorite={selectedMovie ? favorites.includes(selectedMovie.id) : false}
      related={related}
    />

    {user?.email === ADMIN_EMAIL && (
      <AdminPanel
        open={showAdmin}
        onClose={() => setShowAdmin(false)}
        movies={movies}
        onAddMovie={handleAddMovie}
        onUpdateMovie={handleUpdateMovie}
        onDeleteMovie={handleDeleteMovie}
      />
    )}
  </div>
);
}

function DetailsModal({
  movie,
  open,
  onClose,
  onPlay,
  onToggleFavorite,
  isFavorite,
  related,
}) {
  if (!open || !movie) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="details-modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="details-banner"
          style={{ backgroundImage: `url(${movie?.banner || movie?.cover || ""})` }}
        >
          <div
            className="details-shade"
            style={{
              background:
                "linear-gradient(180deg, rgba(18,0,0,0.18) 0%, rgba(18,0,0,0.76) 55%, rgba(8,0,0,0.95) 100%)",
            }}
          >
            <button className="close-btn details-close" onClick={onClose}>
              ✕
            </button>

            <div className="details-content">
              <span className="hero-tag">{movie?.type || "Título"}</span>
              <h1>{movie?.title || "Sem título"}</h1>

              <p className="details-meta">
                {movie?.category || "Categoria"} • {movie?.year || "Ano"} •{" "}
                {movie?.duration || "Duração"} • {movie?.rating || "Livre"}
              </p>

              <p className="details-description">{movie?.description || ""}</p>

              <div className="hero-buttons">
                {movie?.videoUrl ? (
                  <button
                    className="primary-btn"
                    onClick={() => {
                      onClose();
                      onPlay(movie);
                    }}
                  >
                    ▶ Assistir
                  </button>
                ) : (
                  <button className="primary-btn" onClick={onClose}>
                    Fechar
                  </button>
                )}

                <button
                  className="secondary-btn"
                  onClick={() => onToggleFavorite(movie.id)}
                >
                  {isFavorite ? "♥ Remover da lista" : "+ Minha Lista"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="details-body">
          <div className="details-columns">
            <div>
              <h3>Sinopse</h3>
              <p>{movie?.description || ""}</p>
            </div>

            <div>
              <h3>Informações</h3>
              <ul className="details-list">
                <li>
                  <strong>Tipo:</strong> {movie?.type || "-"}
                </li>
                <li>
                  <strong>Gênero:</strong> {movie?.category || "-"}
                </li>
                <li>
                  <strong>Ano:</strong> {movie?.year || "-"}
                </li>
                <li>
                  <strong>Duração:</strong> {movie?.duration || "-"}
                </li>
                <li>
                  <strong>Classificação:</strong> {movie?.rating || "-"}
                </li>
                <li>
                  <strong>Elenco:</strong> {movie?.cast || "-"}
                </li>
              </ul>
            </div>

            <div>
              <h3>Avaliação</h3>
              <StarRating value={4.6} />
              <p className="mini-note">
                Baseado em curtidas e engajamento da plataforma.
              </p>
            </div>
          </div>

          {!!related?.length && (
            <div className="related-block">
              <h3>Filmes relacionados</h3>
              <div className="related-grid">
                {related.map((item) => (
                  <div key={item.id} className="related-card">
                    <div
                      className="related-thumb"
                      style={{ backgroundImage: `url(${item?.cover || ""})` }}
                    />
                    <div className="related-info">
                      <strong>{item?.title || "Sem título"}</strong>
                      <span>
                        {item?.category || "Categoria"} • {item?.year || "Ano"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPanel({
  open,
  onClose,
  movies,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
}) {
  const emptyForm = {
    title: "",
    type: "Filme",
    category: "Ação",
    year: new Date().getFullYear(),
    duration: "",
    rating: "14+",
    cast: "",
    description: "",
    cover: "",
    banner: "",
    videoUrl: "",
    featured: false,
    popularity: 80,
    releaseTag: "Novo",
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setEditingId(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleFileChange(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const base64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, [field]: base64 }));
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Não foi possível processar esse arquivo.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      id: editingId || Date.now(),
      year: Number(form.year) || new Date().getFullYear(),
      popularity: Number(form.popularity) || 0,
    };

    if (editingId) {
      onUpdateMovie(payload);
    } else {
      onAddMovie(payload);
    }

    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(movie) {
    setEditingId(movie.id);
    setForm({
      title: movie?.title || "",
      type: movie?.type || "Filme",
      category: movie?.category || "Ação",
      year: movie?.year || new Date().getFullYear(),
      duration: movie?.duration || "",
      rating: movie?.rating || "14+",
      cast: movie?.cast || "",
      description: movie?.description || "",
      cover: movie?.cover || "",
      banner: movie?.banner || "",
      videoUrl: movie?.videoUrl || "",
      featured: !!movie?.featured,
      popularity: movie?.popularity || 80,
      releaseTag: movie?.releaseTag || "Novo",
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-top">
          <div>
            <h2>Painel administrativo</h2>
            <p>Adicione, edite ou remova filmes, séries e animes.</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-layout">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h3>{editingId ? "Editar título" : "Adicionar novo título"}</h3>

            <div className="form-grid">
              <label>
                Título
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nome do filme"
                  required
                />
              </label>

              <label>
                Tipo
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Filme</option>
                  <option>Série</option>
                  <option>Anime</option>
                </select>
              </label>

              <label>
                Categoria
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option>Ação</option>
                  <option>Terror</option>
                  <option>Comédia</option>
                  <option>Anime</option>
                  <option>Romance</option>
                  <option>Suspense</option>
                  <option>Carros</option>
                  <option>Ficção</option>
                  <option>Drama</option>
                </select>
              </label>

              <label>
                Ano
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                />
              </label>

              <label>
                Duração
                <input
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  placeholder="2h 10min ou 12 episódios"
                />
              </label>

              <label>
                Classificação
                <input
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="14+"
                />
              </label>

              <label>
                Popularidade
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.popularity}
                  onChange={(e) =>
                    setForm({ ...form, popularity: e.target.value })
                  }
                />
              </label>

              <label>
                Tag
                <input
                  value={form.releaseTag}
                  onChange={(e) =>
                    setForm({ ...form, releaseTag: e.target.value })
                  }
                  placeholder="Novo, Em alta, Popular"
                />
              </label>

              <label className="full">
                Elenco
                <input
                  value={form.cast}
                  onChange={(e) => setForm({ ...form, cast: e.target.value })}
                  placeholder="Nomes do elenco"
                />
              </label>

              <label className="full">
                Sinopse
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Descreva a história"
                />
              </label>

              <label className="full">
                Upload da capa do PC
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cover")}
                />
              </label>

              <label className="full">
                Upload do banner do PC
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "banner")}
                />
              </label>

              <label className="full">
                Upload do vídeo do PC
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, "videoUrl")}
                />
              </label>

              <label className="checkbox-row full">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                />
                Colocar em destaque na home
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-btn" type="submit">
                {editingId ? "Salvar alterações" : "Adicionar título"}
              </button>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setEditingId(null);
                }}
              >
                Limpar
              </button>
            </div>

            {uploading && <p className="mini-note">Processando arquivo...</p>}

            {(form.cover || form.banner) && (
              <div className="preview-box">
                <h4>Prévia</h4>
                <div className="preview-grid">
                  {form.cover && (
                    <div
                      className="preview-img"
                      style={{ backgroundImage: `url(${form.cover})` }}
                    />
                  )}

                  {form.banner && (
                    <div
                      className="preview-img banner"
                      style={{ backgroundImage: `url(${form.banner})` }}
                    />
                  )}
                </div>
              </div>
            )}
          </form>

          <section className="admin-list">
            <h3>Catálogo atual</h3>

            <section className="admin-items">
              {(Array.isArray(movies) ? movies : []).map((movie) => (
                <article key={movie.id} className="admin-item">
                  <div
                    className="admin-thumb"
                    style={{ backgroundImage: `url(${movie?.cover || ""})` }}
                  />

                  <header className="admin-item-info">
                    <strong>{movie?.title || "Sem título"}</strong>
                    <span>
                      {movie?.type || "Tipo"} • {movie?.category || "Categoria"} •{" "}
                      {movie?.year || "Ano"}
                    </span>
                  </header>

                  <footer className="admin-item-actions">
                    <button type="button" onClick={() => handleEdit(movie)}>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDeleteMovie(movie.id)}
                    >
                      Remover
                    </button>
                  </footer>
                </article>
              ))}
            </section>
          </section>
        </div>
      </div>
    </div>
  );
}