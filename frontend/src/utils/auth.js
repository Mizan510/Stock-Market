export function getCurrentUserId() {
  try {
    const authStr = localStorage.getItem("auth");
    if (authStr) {
      const auth = JSON.parse(authStr);
      if (auth.id) return auth.id;
    }

    const token = localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length > 1) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        return payload.id || payload.userId || null;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function getCurrentUserName() {
  try {
    const authStr = localStorage.getItem("auth");
    if (authStr) {
      const auth = JSON.parse(authStr);
      if (auth.name) return auth.name;
    }

    const token = localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length > 1) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        return payload.name || payload.user || payload.username || null;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}
