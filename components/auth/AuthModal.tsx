"use client";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "@/lib/i18n";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({
  open,
  onClose,
}: AuthModalProps) {
  const {
    user,
    loading,
    signInWithGoogle,
  } = useAuth();

  const {
    t,
  } = useTranslation();

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (user && open) {
      onClose();
    }
  }, [
    user,
    open,
    onClose,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const handleGoogleSignIn =
    async () => {
      if (loading) {
        return;
      }

      setError(null);

      try {
        await signInWithGoogle();
      } catch (err) {
        console.error(
          "[AuthModal] Google sign-in failed:",
          err
        );

        setError(
          t(
            "auth.errorGoogle"
          )
        );
      }
    };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t(
          "auth.close"
        )}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          padding: 0,
          background:
            "rgba(8, 12, 16, 0.58)",
          backdropFilter:
            "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
          cursor: "default",
        }}
      />

      {/* Modal */}
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          background:
            "linear-gradient(180deg, rgba(29,36,46,0.98) 0%, rgba(17,23,31,0.98) 100%)",
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
          color: "#ffffff",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:
              "28px 28px 22px",
            borderBottom:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >
            <div>
              <h2
                id="auth-modal-title"
                style={{
                  margin: 0,
                  fontSize:
                    "24px",
                  lineHeight:
                    "1.2",
                  fontWeight: 700,
                  letterSpacing:
                    "-0.02em",
                }}
              >
                {t(
                  "auth.title"
                )}
              </h2>

              <p
                style={{
                  margin:
                    "10px 0 0",
                  maxWidth:
                    "320px",
                  fontSize:
                    "13px",
                  lineHeight:
                    "1.55",
                  color:
                    "rgba(255,255,255,0.52)",
                }}
              >
                {t(
                  "auth.description"
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t(
                "auth.close"
              )}
              style={{
                flexShrink: 0,
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius:
                  "50%",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  "rgba(255,255,255,0.65)",
                cursor: "pointer",
                fontSize:
                  "22px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px 28px 28px",
          }}
        >
          <button
            type="button"
            onClick={
              handleGoogleSignIn
            }
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: "12px",
              border:
                "1px solid rgba(0,0,0,0.08)",
              borderRadius:
                "14px",
              background: "#ffffff",
              color: "#202124",
              fontSize:
                "14px",
              fontWeight: 600,
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading
                ? 0.65
                : 1,
              transition:
                "transform 120ms ease, background 120ms ease",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
              />

              <path
                fill="#34A853"
                d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.75Z"
              />

              <path
                fill="#FBBC05"
                d="M6.54 13.83A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.83V7.65H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.35l3.24-2.52Z"
              />

              <path
                fill="#EA4335"
                d="M12 6.13c1.43 0 2.7.49 3.71 1.45l2.78-2.78C16.83 3.19 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.65l3.24 2.52C7.31 7.85 9.46 6.13 12 6.13Z"
              />
            </svg>

            <span>
              {loading
                ? t(
                    "auth.googleLoading"
                  )
                : t(
                    "auth.google"
                  )}
            </span>
          </button>

          {error && (
            <div
              style={{
                marginTop:
                  "12px",
                padding:
                  "10px 12px",
                border:
                  "1px solid rgba(255,90,90,0.22)",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,90,90,0.08)",
                color:
                  "#ff9d9d",
                fontSize:
                  "12px",
                lineHeight:
                  "1.4",
              }}
            >
              {error}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px",
              margin:
                "22px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            />

            <span
              style={{
                fontSize:
                  "11px",
                color:
                  "rgba(255,255,255,0.3)",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.12em",
              }}
            >
              {t(
                "auth.divider"
              )}
            </span>

            <div
              style={{
                flex: 1,
                height: "1px",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            />
          </div>

          {/* Phone */}
          <div
            style={{
              padding:
                "16px 16px 15px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius:
                "14px",
              background:
                "rgba(255,255,255,0.035)",
            }}
          >
            <div
              style={{
                fontSize:
                  "14px",
                fontWeight: 600,
                color:
                  "rgba(255,255,255,0.85)",
              }}
            >
              {t(
                "auth.phoneTitle"
              )}
            </div>

            <div
              style={{
                marginTop:
                  "5px",
                fontSize:
                  "12px",
                lineHeight:
                  "1.45",
                color:
                  "rgba(255,255,255,0.4)",
              }}
            >
              {t(
                "auth.phoneDescription"
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              marginTop:
                "16px",
              height: "42px",
              border: 0,
              background:
                "transparent",
              color:
                "rgba(255,255,255,0.42)",
              fontSize:
                "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t(
              "auth.cancel"
            )}
          </button>

          <div
            style={{
              marginTop:
                "4px",
              textAlign:
                "center",
              fontSize:
                "10px",
              lineHeight:
                "1.4",
              color:
                "rgba(255,255,255,0.2)",
            }}
          >
            {t(
              "auth.terms"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}