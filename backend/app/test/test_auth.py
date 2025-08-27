import os
import sys
from pathlib import Path

import firebase_admin
from firebase_admin import auth as firebase_auth
from dotenv import load_dotenv


def resolve_service_account_path() -> Path:
    """Return the path to the Firebase service account JSON.

    - Loads environment variables from `backend/.env` explicitly so running from any CWD works.
    - If `FIREBASE_ADMIN_SDK_PATH` is relative, resolves it against the `backend` dir.
    - Falls back to `backend/firebaseServiceAccountKey.json` when missing/invalid.
    """
    backend_dir = Path(__file__).resolve().parents[2]
    dotenv_path = backend_dir / ".env"
    if dotenv_path.is_file():
        load_dotenv(dotenv_path)

    maybe_env = os.environ.get("FIREBASE_ADMIN_SDK_PATH")
    if maybe_env:
        candidate_path = Path(maybe_env).expanduser()
        if not candidate_path.is_absolute():
            candidate_path = (backend_dir / candidate_path).resolve()
        else:
            candidate_path = candidate_path.resolve()

        if candidate_path.is_file():
            print(f"Using FIREBASE_ADMIN_SDK_PATH: {candidate_path}")
            return candidate_path
        else:
            print(
                f"WARNING: FIREBASE_ADMIN_SDK_PATH set but file not found at '{candidate_path}'. "
                f"(Original value: '{maybe_env}')"
            )

    # Fallback to repo copy
    fallback = backend_dir / "firebaseServiceAccountKey.json"
    print(f"Using fallback path: {fallback}")
    return fallback


def main() -> int:
    service_account_path = resolve_service_account_path()

    if not service_account_path.is_file():
        print(
            f"ERROR: Service account file not found at '{service_account_path}'.\n"
            "Set FIREBASE_ADMIN_SDK_PATH to a valid file."
        )
        return 2

    # Ensure we import `app.auth` from the `backend` package root
    backend_dir = Path(__file__).resolve().parents[2]
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    # Set env var BEFORE importing app.auth so its initializer can read it
    os.environ["FIREBASE_ADMIN_SDK_PATH"] = str(service_account_path)

    # Import triggers Firebase Admin initialization inside app.auth
    try:
        from app import auth as app_auth  # noqa: F401  (import triggers init)
    except Exception as import_error:
        print(f"ERROR: Importing app.auth failed: {import_error}")
        return 3

    # Verify the default Firebase app exists
    try:
        default_app = firebase_admin.get_app()
        print(
            "OK: Firebase Admin initialized.",
            f"App name='{default_app.name}'. Service account='{service_account_path.name}'.",
        )
    except Exception as init_error:
        print(f"ERROR: Firebase Admin not initialized: {init_error}")
        return 4

    # Try a lightweight API call to confirm connectivity/permissions
    try:
        page = firebase_auth.list_users()
        first_user = None
        for user in page.iterate_all():
            first_user = user
            break
        if first_user is not None:
            print("OK: list_users succeeded; at least one user found.")
        else:
            print("OK: list_users succeeded; no users found in project.")
        return 0
    except Exception as api_error:
        print(
            "WARN: Firebase Admin initialized, but list_users failed (connectivity/permissions).",
            f"Details: {api_error}",
        )
        # Still return non-zero so CI/users can detect missing connectivity/permissions
        return 5


if __name__ == "__main__":
    sys.exit(main())
