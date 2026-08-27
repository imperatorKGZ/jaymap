"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProfileEditModal({
  open,
  onClose,
}: ProfileEditModalProps) {
  const {
    user,
    profile,
    refreshProfile,
  } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    name,
    setName,
  ] = useState("");

  const [
    contactPhone,
    setContactPhone,
  ] = useState("");

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState<string | null>(
    null
  );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    deletingAvatar,
    setDeletingAvatar,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    success,
    setSuccess,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      profile?.display_name ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        ""
    );

    setContactPhone(
      profile?.contact_phone ??
        ""
    );

    setAvatarPreview(
      profile?.avatar_url?.trim() ||
        null
    );

    setSelectedFile(null);
    setError(null);
    setSuccess(false);
  }, [
    open,
    profile,
    user,
  ]);

  if (!open) {
    return null;
  }

  if (!user) {
    return null;
  }

  const handleSelectAvatar =
    (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError(null);

      if (
        !ALLOWED_TYPES.includes(
          file.type
        )
      ) {
        setError(
          "Поддерживаются только JPG, PNG и WebP."
        );

        return;
      }

      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        setError(
          "Размер изображения не должен превышать 5 МБ."
        );

        return;
      }

      const previewUrl =
        URL.createObjectURL(
          file
        );

      setAvatarPreview(
        previewUrl
      );

      setSelectedFile(
        file
      );
    };

  const removeCurrentAvatar =
    async () => {
      setAvatarPreview(null);
      setSelectedFile(null);
    };

  const handleSave =
    async () => {
      const trimmedName =
        name.trim();

      if (!trimmedName) {
        setError(
          "Введите имя."
        );

        return;
      }

      if (
        trimmedName.length <
        2
      ) {
        setError(
          "Имя должно содержать минимум 2 символа."
        );

        return;
      }

      if (
        trimmedName.length >
        80
      ) {
        setError(
          "Имя слишком длинное."
        );

        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(false);

      let uploadedAvatarUrl =
        profile?.avatar_url ??
        null;

      try {
        if (selectedFile) {
          const fileExtension =
            selectedFile.name
              .split(".")
              .pop()
              ?.toLowerCase() ??
            "jpg";

          const filePath =
            `${user.id}/avatar-${Date.now()}.${fileExtension}`;

          const {
            error:
              uploadError,
          } =
            await (
              await import(
                "@/lib/supabase/client"
              )
            ).supabase.storage
              .from("avatars")
              .upload(
                filePath,
                selectedFile,
                {
                  cacheControl:
                    "3600",
                  upsert: false,
                  contentType:
                    selectedFile.type,
                }
              );

          if (uploadError) {
            throw uploadError;
          }

          const {
            data:
              publicUrlData,
          } =
            (
              await import(
                "@/lib/supabase/client"
              )
            ).supabase.storage
              .from("avatars")
              .getPublicUrl(
                filePath
              );

          uploadedAvatarUrl =
            publicUrlData.publicUrl;
        }

        const {
          supabase,
        } =
          await import(
            "@/lib/supabase/client"
          );

        const {
          error:
            updateError,
        } =
          await supabase
            .from("profiles")
            .update({
              display_name:
                trimmedName,
              avatar_url:
                uploadedAvatarUrl,
              contact_phone:
                contactPhone.trim() ||
                null,
              onboarding_completed:
                true,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              user.id
            );

        if (updateError) {
          throw updateError;
        }

        await refreshProfile();

        setSuccess(true);

        setTimeout(() => {
          onClose();
        }, 500);
      } catch (err) {
        console.error(
          "[ProfileEditModal] Save failed:",
          err
        );

        setError(
          "Не удалось сохранить профиль. Попробуйте ещё раз."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background:
            "rgba(8,12,16,0.62)",
          backdropFilter:
            "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          maxHeight:
            "calc(100vh - 48px)",
          overflowY: "auto",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          background:
            "linear-gradient(180deg, rgba(29,36,46,0.98) 0%, rgba(17,23,31,0.98) 100%)",
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.45)",
          color: "#fff",
        }}
      >
        <div
          style={{
            padding:
              "26px 28px 20px",
            borderBottom:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <div>
              <h2
                id="profile-edit-title"
                style={{
                  margin: 0,
                  fontSize:
                    "22px",
                  fontWeight: 700,
                }}
              >
                Профиль
              </h2>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  fontSize:
                    "12px",
                  color:
                    "rgba(255,255,255,0.45)",
                }}
              >
                Измените имя и
                контактные данные.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius:
                  "50%",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  "rgba(255,255,255,0.65)",
                fontSize:
                  "22px",
                cursor:
                  "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div
          style={{
            padding:
              "24px 28px 28px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems:
                "center",
            }}
          >
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              style={{
                position:
                  "relative",
                width: "96px",
                height: "96px",
                overflow:
                  "hidden",
                borderRadius:
                  "50%",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.06)",
                cursor:
                  "pointer",
                padding: 0,
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                <img
                  src="/jaymap-default-avatar.svg"
                  alt="JayMap"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              )}

              <div
                style={{
                  position:
                    "absolute",
                  right:
                    "5px",
                  bottom:
                    "5px",
                  width:
                    "28px",
                  height:
                    "28px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  borderRadius:
                    "50%",
                  background:
                    "#10a37f",
                  border:
                    "2px solid #17202a",
                  fontSize:
                    "14px",
                }}
              >
                +
              </div>
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleSelectAvatar
              }
              style={{
                display:
                  "none",
              }}
            />

            <div
              style={{
                marginTop:
                  "10px",
                fontSize:
                  "11px",
                color:
                  "rgba(255,255,255,0.38)",
              }}
            >
              JPG, PNG или WebP · до 5 МБ
            </div>

            {avatarPreview &&
              selectedFile && (
                <button
                  type="button"
                  onClick={
                    removeCurrentAvatar
                  }
                  style={{
                    marginTop:
                      "7px",
                    border: 0,
                    background:
                      "transparent",
                    color:
                      "#ff8f8f",
                    fontSize:
                      "11px",
                    cursor:
                      "pointer",
                  }}
                >
                  Убрать выбранное фото
                </button>
              )}
          </div>

          {/* Name */}
          <label
            style={{
              display:
                "block",
              marginTop:
                "24px",
            }}
          >
            <span
              style={{
                display:
                  "block",
                marginBottom:
                  "8px",
                fontSize:
                  "12px",
                fontWeight:
                  600,
                color:
                  "rgba(255,255,255,0.62)",
              }}
            >
              Имя
            </span>

            <input
              value={name}
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Ваше имя"
              maxLength={80}
              style={{
                width:
                  "100%",
                height:
                  "48px",
                padding:
                  "0 15px",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                color:
                  "#fff",
                outline:
                  "none",
                fontSize:
                  "14px",
              }}
            />
          </label>

          {/* Email */}
          <label
            style={{
              display:
                "block",
              marginTop:
                "16px",
            }}
          >
            <span
              style={{
                display:
                  "block",
                marginBottom:
                  "8px",
                fontSize:
                  "12px",
                fontWeight:
                  600,
                color:
                  "rgba(255,255,255,0.62)",
              }}
            >
              Email
            </span>

            <input
              value={
                user.email ??
                ""
              }
              readOnly
              style={{
                width:
                  "100%",
                height:
                  "48px",
                padding:
                  "0 15px",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.025)",
                color:
                  "rgba(255,255,255,0.45)",
                outline:
                  "none",
                fontSize:
                  "14px",
              }}
            />
          </label>

          {/* Phone */}
          <label
            style={{
              display:
                "block",
              marginTop:
                "16px",
            }}
          >
            <span
              style={{
                display:
                  "block",
                marginBottom:
                  "8px",
                fontSize:
                  "12px",
                fontWeight:
                  600,
                color:
                  "rgba(255,255,255,0.62)",
              }}
            >
              Телефон
            </span>

            <input
              value={
                contactPhone
              }
              onChange={(
                event
              ) =>
                setContactPhone(
                  event.target
                    .value
                )
              }
              placeholder="+996 ..."
              maxLength={32}
              style={{
                width:
                  "100%",
                height:
                  "48px",
                padding:
                  "0 15px",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                color:
                  "#fff",
                outline:
                  "none",
                fontSize:
                  "14px",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                marginTop:
                  "16px",
                padding:
                  "11px 12px",
                border:
                  "1px solid rgba(255,90,90,0.2)",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,90,90,0.08)",
                color:
                  "#ff9d9d",
                fontSize:
                  "12px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                marginTop:
                  "16px",
                padding:
                  "11px 12px",
                border:
                  "1px solid rgba(80,220,150,0.18)",
                borderRadius:
                  "10px",
                background:
                  "rgba(80,220,150,0.08)",
                color:
                  "#93e6ba",
                fontSize:
                  "12px",
              }}
            >
              Профиль сохранён.
            </div>
          )}

          <div
            style={{
              display:
                "flex",
              gap: "10px",
              marginTop:
                "22px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                height:
                  "46px",
                border:
                  "1px solid rgba(255,255,255,0.09)",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                color:
                  "rgba(255,255,255,0.65)",
                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              style={{
                flex: 1,
                height:
                  "46px",
                border: 0,
                borderRadius:
                  "12px",
                background:
                  "#10a37f",
                color:
                  "#fff",
                fontWeight:
                  600,
                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  saving
                    ? 0.65
                    : 1,
              }}
            >
              {saving
                ? "Сохранение..."
                : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}