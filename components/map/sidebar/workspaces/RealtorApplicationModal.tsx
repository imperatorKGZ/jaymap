"use client";

import {
  createPortal,
} from "react-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

import {
  supabase,
} from "@/lib/supabase/client";

interface RealtorApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

interface RealtorApplicationModalPropsInternal
  extends RealtorApplicationModalProps {}

type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

interface ExistingApplication {
  id: string;
  status: ApplicationStatus;
}

export default function RealtorApplicationModal({
  open,
  onClose,
  onSubmitted,
}: RealtorApplicationModalPropsInternal) {
  const {
    user,
    profile,
    refreshProfile,
  } = useAuth();

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    agencyName,
    setAgencyName,
  ] = useState("");

  const [
    socialUrl,
    setSocialUrl,
  ] = useState("");

  const [
    application,
    setApplication,
  ] = useState<ExistingApplication | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checking,
    setChecking,
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

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState<File | null>(
    null
  );

  const [
    selectedPhotoPreview,
    setSelectedPhotoPreview,
  ] = useState<string | null>(
    null
  );

  const hasPhoto = Boolean(
    profile?.avatar_url?.trim()
  );

  const currentPhotoUrl =
    useMemo(
      () =>
        profile?.avatar_url?.trim() ??
        "",
      [
        profile?.avatar_url,
      ]
    );

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setFullName(
      profile?.display_name?.trim() ??
        ""
    );

    setPhone(
      profile?.contact_phone?.trim() ??
        ""
    );

    setAgencyName("");
    setSocialUrl("");

    setApplication(null);
    setError(null);
    setSuccess(false);

    setSelectedPhoto(null);
    setSelectedPhotoPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    let cancelled = false;

    const loadApplication =
      async () => {
        setChecking(true);

        try {
          const {
            data,
            error:
              selectError,
          } =
            await supabase
              .from(
                "realtor_applications"
              )
              .select(
                "id, status"
              )
              .eq(
                "user_id",
                user.id
              )
              .in(
                "status",
                [
                  "pending",
                  "approved",
                ]
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle();

          if (
            selectError
          ) {
            throw selectError;
          }

          if (
            !cancelled &&
            data
          ) {
            setApplication(
              data as ExistingApplication
            );
          }
        } catch (loadError) {
          console.error(
            "[RealtorApplicationModal] Application load failed:",
            loadError
          );

          if (!cancelled) {
            setError(
              "Не удалось проверить состояние заявки."
            );
          }
        } finally {
          if (!cancelled) {
            setChecking(
              false
            );
          }
        }
      };

    void loadApplication();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    user,
    profile,
  ]);

  if (!open || !user) {
    return null;
  }

  const handleSelectPhoto = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Выберите фото в формате JPG, PNG или WebP."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Размер фотографии не должен превышать 5 МБ."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setSelectedPhotoPreview(
      previewUrl
    );

    setSelectedPhoto(
      file
    );
  };

  const handleRemoveSelectedPhoto =
    () => {
      setSelectedPhoto(null);
      setSelectedPhotoPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

  const handleSubmit =
    async () => {
      if (loading) {
        return;
      }

      const trimmedFullName =
        fullName.trim();

      const trimmedPhone =
        phone.trim();

      const trimmedAgencyName =
        agencyName.trim();

      const trimmedSocialUrl =
        socialUrl.trim();

      if (!trimmedFullName) {
        setError(
          "Укажите ФИО."
        );

        return;
      }

      if (
        trimmedFullName.length <
        5
      ) {
        setError(
          "Укажите полное ФИО."
        );

        return;
      }

      if (!trimmedPhone) {
        setError(
          "Укажите телефон."
        );

        return;
      }

      if (
        !hasPhoto &&
        !selectedPhoto
      ) {
        setError(
          "Для заявки необходимо фото."
        );

        return;
      }

      if (!trimmedSocialUrl) {
        setError(
          "Укажите ссылку на социальную сеть."
        );

        return;
      }

      let normalizedInstagramUrl = "";

      try {
        const parsedInstagramUrl =
          new URL(trimmedSocialUrl);

        const hostname =
          parsedInstagramUrl.hostname
            .toLowerCase()
            .replace(/^www\./, "");

        const pathname =
          parsedInstagramUrl.pathname
            .replace(/^\/+|\/+$/g, "");

        const pathParts = pathname.split("/");

        const username =
          pathParts.length === 1
            ? pathParts[0]
            : "";

        const isValidUsername =
          /^[a-zA-Z0-9._]{1,30}$/.test(
            username
          ) &&
          !username.startsWith(".") &&
          !username.endsWith(".") &&
          !username.includes("..");

        if (
          parsedInstagramUrl.protocol !==
            "https:" ||
          hostname !== "instagram.com" ||
          !username ||
          !isValidUsername ||
          parsedInstagramUrl.search ||
          parsedInstagramUrl.hash
        ) {
          throw new Error(
            "invalid_instagram_url"
          );
        }

        normalizedInstagramUrl =
          `https://instagram.com/${username}`;
      } catch {
        setError(
          "Укажите корректную ссылку на профиль Instagram, например https://instagram.com/username."
        );

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const {
          data:
            existingPending,
          error:
            pendingError,
        } =
          await supabase
            .from(
              "realtor_applications"
            )
            .select(
              "id, status"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "status",
              "pending"
            )
            .maybeSingle();

        if (
          pendingError
        ) {
          throw pendingError;
        }

        if (
          existingPending
        ) {
          setApplication(
            existingPending as ExistingApplication
          );

          setError(
            "Заявка уже находится на рассмотрении."
          );

          return;
        }

        const {
          data:
            approvedApplication,
          error:
            approvedError,
        } =
          await supabase
            .from(
              "realtor_applications"
            )
            .select(
              "id, status"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "status",
              "approved"
            )
            .maybeSingle();

        if (
          approvedError
        ) {
          throw approvedError;
        }

        if (
          approvedApplication
        ) {
          setApplication(
            approvedApplication as ExistingApplication
          );

          setError(
            "Для этого профиля уже есть одобренная заявка."
          );

          return;
        }

        let applicationPhotoUrl =
          currentPhotoUrl;

        let uploadedStoragePath:
          string | null = null;

        if (selectedPhoto) {
          const fileExtension =
            selectedPhoto.name
              .split(".")
              .pop()
              ?.toLowerCase() ||
            "jpg";

          const storagePath =
            `${user.id}/realtor-application-${Date.now()}.${fileExtension}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from("avatars")
              .upload(
                storagePath,
                selectedPhoto,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    selectedPhoto.type,
                }
              );

          if (uploadError) {
            throw uploadError;
          }

          uploadedStoragePath =
            storagePath;

          const {
            data:
              publicUrlData,
          } =
            supabase.storage
              .from("avatars")
              .getPublicUrl(
                storagePath
              );

          applicationPhotoUrl =
            publicUrlData.publicUrl;

          /*
           * Фото заявки одновременно становится
           * текущим аватаром профиля.
           *
           * Тогда после отправки заявки одно и то же
           * фото сразу используется Navbar, профилем
           * и другими местами, которые читают
           * profiles.avatar_url.
           */
          const {
            error:
              profileAvatarUpdateError,
          } =
            await supabase
              .from("profiles")
              .update({
                avatar_url:
                  applicationPhotoUrl,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                user.id
              );

          if (
            profileAvatarUpdateError
          ) {
            if (
              uploadedStoragePath
            ) {
              await supabase.storage
                .from("avatars")
                .remove([
                  uploadedStoragePath,
                ]);
            }

            throw profileAvatarUpdateError;
          }
        }

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "realtor_applications"
            )
            .insert({
              user_id:
                user.id,

              full_name:
                trimmedFullName,

              phone:
                trimmedPhone,

              agency_name:
                trimmedAgencyName ||
                null,

              social_url:
                normalizedInstagramUrl,

              photo_url:
                applicationPhotoUrl,

              status:
                "pending",
            });

        if (
          insertError
        ) {
          if (
            uploadedStoragePath
          ) {
            await supabase.storage
              .from("avatars")
              .remove([
                uploadedStoragePath,
              ]);
          }

          if (
            insertError.code ===
            "23505"
          ) {
            setError(
              "Заявка уже находится на рассмотрении."
            );

            return;
          }

          throw insertError;
        }

        await refreshProfile();

        setSuccess(
          true
        );

        setApplication({
          id: "",
          status:
            "pending",
        });

        onSubmitted?.();
      } catch (submitError) {
        console.error(
          "[RealtorApplicationModal] Submit failed:",
          submitError
        );

        setError(
          submitError instanceof Error
            ? submitError.message
            : "Не удалось отправить заявку."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleClose =
    () => {
      if (loading) {
        return;
      }

      onClose();
    };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="realtor-application-title"
      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          1300,

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          "24px",
      }}
    >
      <button
        type="button"
        onClick={
          handleClose
        }
        aria-label="Закрыть"
        style={{
          position:
            "absolute",

          inset:
            0,

          width:
            "100%",

          height:
            "100%",

          border:
            0,

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
          position:
            "relative",

          width:
            "100%",

          maxWidth:
            "460px",

          maxHeight:
            "calc(100vh - 48px)",

          overflow:
            "hidden",

          display:
            "flex",

          flexDirection:
            "column",

          boxSizing:
            "border-box",

          border:
            "1px solid rgba(255,255,255,0.12)",

          borderRadius:
            "24px",

          background:
            "linear-gradient(180deg, rgba(29,36,46,0.98) 0%, rgba(17,23,31,0.98) 100%)",

          boxShadow:
            "0 30px 90px rgba(0,0,0,0.45)",

          color:
            "#ffffff",
        }}
      >
        <div
          style={{
            padding:
              "20px 22px 16px",

            borderBottom:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "flex-start",

              justifyContent:
                "space-between",

              gap:
                "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "11px",

                  fontWeight:
                    600,

                  color:
                    "#6FC9C2",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.12em",

                  marginBottom:
                    "9px",
                }}
              >
                JayMap
              </div>

              <h2
                id="realtor-application-title"
                style={{
                  margin:
                    0,

                  fontSize:
                    "21px",

                  lineHeight:
                    "1.2",

                  fontWeight:
                    700,

                  letterSpacing:
                    "-0.02em",
                }}
              >
                Стать риелтором
              </h2>

              <p
                style={{
                  margin:
                    "7px 0 0",

                  fontSize:
                    "13px",

                  lineHeight:
                    "1.55",

                  color:
                    "rgba(255,255,255,0.48)",
                }}
              >
                Заполните данные для рассмотрения заявки.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleClose
              }
              aria-label="Закрыть"
              style={{
                flexShrink:
                  0,

                width:
                  "36px",

                height:
                  "36px",

                border:
                  "1px solid rgba(255,255,255,0.08)",

                borderRadius:
                  "50%",

                background:
                  "rgba(255,255,255,0.05)",

                color:
                  "rgba(255,255,255,0.65)",

                fontSize:
                  "22px",

                lineHeight:
                  1,

                cursor:
                  "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {checking ? (
          <div
            style={{
              padding:
                "20px",

              fontSize:
                "13px",

              color:
                "rgba(255,255,255,0.58)",
            }}
          >
            Проверяем состояние заявки...
          </div>
        ) : application?.status ===
            "approved" ? (
          <div
            style={{
              padding:
                "20px",
            }}
          >
            <div
              style={{
                border:
                  "1px solid rgba(111,201,194,0.24)",

                borderRadius:
                  "16px",

                background:
                  "rgba(111,201,194,0.07)",

                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "15px",

                  fontWeight:
                    650,

                  color:
                    "rgba(255,255,255,0.92)",
                }}
              >
                Вы уже зарегистрированы как риелтор
              </div>

              <div
                style={{
                  marginTop:
                    "7px",

                  fontSize:
                    "12px",

                  lineHeight:
                    "1.55",

                  color:
                    "rgba(255,255,255,0.48)",
                }}
              >
                Повторная заявка для этого профиля не требуется.
              </div>
            </div>
          </div>
        ) : success ? (
          <div
            style={{
              padding:
                "28px",
            }}
          >
            <div
              style={{
                border:
                  "1px solid rgba(111,201,194,0.24)",

                borderRadius:
                  "16px",

                background:
                  "rgba(111,201,194,0.07)",

                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "15px",

                  fontWeight:
                    650,

                  color:
                    "rgba(255,255,255,0.92)",
                }}
              >
                Заявка отправлена
              </div>

              <div
                style={{
                  marginTop:
                    "7px",

                  fontSize:
                    "12px",

                  lineHeight:
                    "1.55",

                  color:
                    "rgba(255,255,255,0.48)",
                }}
              >
                Заявка находится на рассмотрении.
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              style={{
                marginTop:
                  "16px",

                width:
                  "100%",

                minHeight:
                  "44px",

                border:
                  0,

                borderRadius:
                  "12px",

                background:
                  "#6FC9C2",

                color:
                  "#0a0f14",

                fontSize:
                  "13px",

                fontWeight:
                  650,

                cursor:
                  "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div
            style={{
              minHeight:
                0,

              flex:
                1,

              overflowY:
                "auto",

              padding:
                "20px 22px 22px",
            }}
          >
            {error && (
              <div
                role="alert"
                style={{
                  marginBottom:
                    "16px",

                  border:
                    "1px solid rgba(248,113,113,0.32)",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(248,113,113,0.09)",

                  padding:
                    "11px 12px",

                  fontSize:
                    "12px",

                  lineHeight:
                    "1.5",

                  color:
                    "rgba(252,165,165,0.96)",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                marginBottom:
                  "12px",
              }}
            >
              <label
                htmlFor="realtor-full-name"
                style={{
                  display:
                    "block",

                  marginBottom:
                    "7px",

                  fontSize:
                    "11px",

                  fontWeight:
                    600,

                  color:
                    "rgba(255,255,255,0.48)",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.08em",
                }}
              >
                ФИО
              </label>

              <input
                id="realtor-full-name"
                value={
                  fullName
                }
                onChange={(
                  event
                ) => {
                  setFullName(
                    event.target.value
                  );
                  setError(
                    null
                  );
                }}
                autoComplete="name"
                disabled={
                  loading
                }
                style={{
                  width:
                    "100%",

                  height:
                    "42px",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  borderRadius:
                    "12px",

                  outline:
                    "none",

                  padding:
                    "0 13px",

                  background:
                    "rgba(255,255,255,0.045)",

                  color:
                    "#ffffff",

                  fontSize:
                    "13px",
                }}
              />
            </div>

            <div
              style={{
                marginBottom:
                  "12px",
              }}
            >
              <label
                htmlFor="realtor-phone"
                style={{
                  display:
                    "block",

                  marginBottom:
                    "7px",

                  fontSize:
                    "11px",

                  fontWeight:
                    600,

                  color:
                    "rgba(255,255,255,0.48)",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.08em",
                }}
              >
                Телефон
              </label>

              <input
                id="realtor-phone"
                value={
                  phone
                }
                onChange={(
                  event
                ) => {
                  setPhone(
                    event.target.value
                  );
                  setError(
                    null
                  );
                }}
                autoComplete="tel"
                disabled={
                  loading
                }
                style={{
                  width:
                    "100%",

                  height:
                    "42px",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  borderRadius:
                    "12px",

                  outline:
                    "none",

                  padding:
                    "0 13px",

                  background:
                    "rgba(255,255,255,0.045)",

                  color:
                    "#ffffff",

                  fontSize:
                    "13px",
                }}
              />
            </div>

            <div
              style={{
                marginBottom:
                  "12px",
              }}
            >
              <label
                htmlFor="realtor-agency"
                style={{
                  display:
                    "block",

                  marginBottom:
                    "7px",

                  fontSize:
                    "11px",

                  fontWeight:
                    600,

                  color:
                    "rgba(255,255,255,0.48)",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.08em",
                }}
              >
                Название агентства
              </label>

              <input
                id="realtor-agency"
                value={
                  agencyName
                }
                onChange={(
                  event
                ) => {
                  setAgencyName(
                    event.target.value
                  );
                  setError(
                    null
                  );
                }}
                autoComplete="organization"
                disabled={
                  loading
                }
                placeholder="Необязательно"
                style={{
                  width:
                    "100%",

                  height:
                    "42px",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  borderRadius:
                    "12px",

                  outline:
                    "none",

                  padding:
                    "0 13px",

                  background:
                    "rgba(255,255,255,0.045)",

                  color:
                    "#ffffff",

                  fontSize:
                    "13px",
                }}
              />
            </div>

            <div
              style={{
                marginBottom:
                  "12px",
              }}
            >
              <label
                htmlFor="realtor-social"
                style={{
                  display:
                    "block",

                  marginBottom:
                    "7px",

                  fontSize:
                    "11px",

                  fontWeight:
                    600,

                  color:
                    "rgba(255,255,255,0.48)",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.08em",
                }}
              >
                Instagram
              </label>

              <input
                id="realtor-social"
                value={
                  socialUrl
                }
                onChange={(
                  event
                ) => {
                  setSocialUrl(
                    event.target.value
                  );
                  setError(
                    null
                  );
                }}
                inputMode="url"
                autoComplete="url"
                disabled={
                  loading
                }
                placeholder="https://instagram.com/username"
                style={{
                  width:
                    "100%",

                  height:
                    "42px",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  borderRadius:
                    "12px",

                  outline:
                    "none",

                  padding:
                    "0 13px",

                  background:
                    "rgba(255,255,255,0.045)",

                  color:
                    "#ffffff",

                  fontSize:
                    "13px",
                }}
              />
            </div>

            <div
              style={{
                border:
                  "1px solid rgba(255,255,255,0.08)",

                borderRadius:
                  "14px",

                background:
                  "rgba(255,255,255,0.025)",

                padding:
                  "14px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    600,

                  color:
                    "rgba(255,255,255,0.78)",
                }}
              >
                Фото профиля
              </div>

              <div
                style={{
                  marginTop:
                    "6px",

                  fontSize:
                    "11px",

                  lineHeight:
                    "1.5",

                  color:
                    "rgba(255,255,255,0.42)",
                }}
              >
                Для заявки требуется фотография в профиле.
              </div>

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "10px",

                  marginTop:
                    "10px",
                }}
              >
                <div
                  style={{
                    width:
                      "52px",

                    height:
                      "52px",

                    flexShrink:
                      0,

                    overflow:
                      "hidden",

                    borderRadius:
                      "50%",

                    border:
                      "1px solid rgba(255,255,255,0.10)",

                    background:
                      "rgba(255,255,255,0.06)",
                  }}
                >
                  {selectedPhotoPreview ? (
                    <img
                      src={
                        selectedPhotoPreview
                      }
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
                  ) : hasPhoto ? (
                    <img
                      src={
                        currentPhotoUrl
                      }
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
                </div>

                <div
                  style={{
                    minWidth:
                      0,

                    flex:
                      1,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "12px",

                      color:
                        selectedPhotoPreview ||
                        hasPhoto
                          ? "rgba(111,201,194,0.92)"
                          : "rgba(252,165,165,0.90)",
                    }}
                  >
                    {selectedPhotoPreview
                      ? "Новое фото выбрано"
                      : hasPhoto
                        ? "Фото добавлено"
                        : "Фото отсутствует"}
                  </div>

                  <div
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        "8px",

                      marginTop:
                        "8px",
                    }}
                  >
                    <input
                      ref={
                        fileInputRef
                      }
                      id="realtor-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleSelectPhoto
                      }
                      disabled={
                        loading
                      }
                      style={{
                        display:
                          "none",
                      }}
                    />

                    <label
                      htmlFor="realtor-photo"
                      style={{
                        display:
                          "inline-flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        minHeight:
                          "34px",

                        padding:
                          "0 11px",

                        border:
                          "1px solid rgba(255,255,255,0.10)",

                        borderRadius:
                          "10px",

                        background:
                          "rgba(255,255,255,0.045)",

                        color:
                          "rgba(255,255,255,0.76)",

                        fontSize:
                          "11px",

                        fontWeight:
                          600,

                        cursor:
                          loading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {selectedPhoto
                        ? "Заменить фото"
                        : hasPhoto
                          ? "Использовать другое"
                          : "Выбрать фото"}
                    </label>

                    {selectedPhoto && (
                      <button
                        type="button"
                        onClick={
                          handleRemoveSelectedPhoto
                        }
                        disabled={
                          loading
                        }
                        style={{
                          minHeight:
                            "34px",

                          padding:
                            "0 10px",

                          border:
                            "1px solid rgba(255,255,255,0.08)",

                          borderRadius:
                            "10px",

                          background:
                            "transparent",

                          color:
                            "rgba(255,255,255,0.44)",

                          fontSize:
                            "11px",

                          cursor:
                            loading
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                loading ||
                (!hasPhoto &&
                  !selectedPhoto)
              }
              style={{
                width:
                  "100%",

                minHeight:
                  "44px",

                marginTop:
                  "14px",

                border:
                  0,

                borderRadius:
                  "13px",

                background:
                  loading ||
                  (!hasPhoto &&
                    !selectedPhoto)
                    ? "rgba(111,201,194,0.35)"
                    : "#6FC9C2",

                color:
                  "#0a0f14",

                fontSize:
                  "13px",

                fontWeight:
                  650,

                cursor:
                  loading ||
                  (!hasPhoto &&
                    !selectedPhoto)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Отправка..."
                : "Отправить заявку"}
            </button>

            <p
              style={{
                margin:
                  "12px 0 0",

                fontSize:
                  "10px",

                lineHeight:
                  "1.5",

                color:
                  "rgba(255,255,255,0.28)",

                textAlign:
                  "center",
              }}
            >
              Заявка будет рассмотрена администрацией JayMap.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.body
  );
}
