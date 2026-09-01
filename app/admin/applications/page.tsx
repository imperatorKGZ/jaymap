"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAdminRealtorApplications,
  approveRealtorApplication,
  rejectRealtorApplication,
  type AdminApplicationStatus,
  type AdminRealtorApplication,
} from "@/lib/admin/applications";

const tabs: Array<{
  label: string;
  status: AdminApplicationStatus;
}> = [
  {
    label: "Новые",
    status: "pending",
  },
  {
    label: "Одобренные",
    status: "approved",
  },
  {
    label: "Отклонённые",
    status: "rejected",
  },
];

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(date);
}

export default function AdminApplicationsPage() {
  const [
    status,
    setStatus,
  ] = useState<AdminApplicationStatus>(
    "pending"
  );

  const [
    applications,
    setApplications,
  ] = useState<
    AdminRealtorApplication[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState<AdminRealtorApplication | null>(
    null
  );

  const [
    action,
    setAction,
  ] = useState<
    "approve" | "reject" | null
  >(null);

  const [
    confirmAction,
    setConfirmAction,
  ] = useState<
    "approve" | "reject" | null
  >(null);

  const loadApplications =
    useCallback(
      async (
        nextStatus: AdminApplicationStatus
      ) => {
        setLoading(
          true
        );

        setError(
          null
        );

        try {
          const nextApplications =
            await getAdminRealtorApplications(
              nextStatus
            );

          setApplications(
            nextApplications
          );

          setSelectedApplication(
            current =>
              current &&
              current.status ===
                nextStatus
                ? nextApplications.find(
                    application =>
                      application.id ===
                      current.id
                  ) ??
                  null
                : null
          );
        } catch (
          loadError
        ) {
          console.error(
            "[Admin] Failed to load realtor applications:",
            loadError
          );

          setApplications(
            []
          );

          setError(
            "Не удалось загрузить заявки."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadApplications(
      status
    );
  }, [
    status,
    loadApplications,
  ]);

  const handleReviewAction =
    async (
      application: AdminRealtorApplication,
      nextAction: "approve" | "reject"
    ) => {
      if (action) {
        return;
      }

      setAction(
        nextAction
      );

      setError(
        null
      );

      try {
        if (
          nextAction ===
          "approve"
        ) {
          await approveRealtorApplication(
            application.id
          );
        } else {
          await rejectRealtorApplication(
            application.id
          );
        }

        setConfirmAction(
          null
        );
        setSelectedApplication(
          null
        );

        await loadApplications(
          status
        );
      } catch (
        actionError
      ) {
        console.error(
          "[Admin] Realtor application review failed:",
          actionError
        );

        setError(
          nextAction ===
          "approve"
            ? "Не удалось одобрить заявку."
            : "Не удалось отклонить заявку."
        );
      } finally {
        setAction(
          null
        );
      }
    };

  return (
    <div className="min-h-screen bg-[#0b1016] text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
        <header>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6FC9C2]">
            JayMap Admin
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.02em]">
                Заявки риелторов
              </h1>

              <p className="mt-2 text-sm text-white/45">
                Рассмотрение заявок на получение статуса риелтора
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadApplications(
                  status
                )
              }
              disabled={
                loading
              }
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Загрузка..."
                : "Обновить"}
            </button>
          </div>
        </header>

        <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2">
          {tabs.map((tab) => {
            const active =
              status ===
              tab.status;

            return (
              <button
                key={
                  tab.status
                }
                type="button"
                onClick={() =>
                  setStatus(
                    tab.status
                  )
                }
                className={[
                  "rounded-xl px-4 py-2.5 text-xs font-medium transition",
                  active
                    ? "bg-[#6FC9C2] text-[#091016]"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/75",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-200/80"
          >
            {error}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            {loading ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
                <div className="text-sm text-white/45">
                  Загружаем заявки...
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
                <div className="text-sm font-medium text-white/55">
                  Заявок нет
                </div>

                <div className="mt-2 text-xs text-white/30">
                  В выбранном разделе пока нет заявок.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(
                  (
                    application
                  ) => {
                    const selected =
                      selectedApplication?.id ===
                      application.id;

                    return (
                      <button
                        key={
                          application.id
                        }
                        type="button"
                        onClick={() => {
                          setSelectedApplication(
                            application
                          );
                          setConfirmAction(
                            null
                          );
                          setError(
                            null
                          );
                        }}
                        className={[
                          "w-full rounded-2xl border p-4 text-left transition",
                          selected
                            ? "border-[#6FC9C2]/35 bg-[#6FC9C2]/[0.06]"
                            : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]",
                        ].join(" ")}
                      >
                        <div className="flex gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                            <img
                              src={
                                application.photo_url
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-white/90">
                                  {
                                    application.full_name
                                  }
                                </div>

                                <div className="mt-1 text-xs text-white/40">
                                  {
                                    application.phone
                                  }
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full border border-white/[0.08] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-white/45">
                                {application.status ===
                                "pending"
                                  ? "Новая"
                                  : application.status ===
                                      "approved"
                                    ? "Одобрена"
                                    : "Отклонена"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/35">
                              <span>
                                {application.agency_name ||
                                  "Агентство не указано"}
                              </span>

                              <span>
                                {formatDate(
                                  application.created_at
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <aside className="max-h-[calc(100vh-250px)] overflow-y-auto pr-1 xl:sticky xl:top-6 xl:self-start">
            {selectedApplication ? (
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <div className="relative aspect-[4/3] w-full bg-black/20">
                  <img
                    src={
                      selectedApplication.photo_url
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedApplication(
                        null
                      )
                    }
                    className="absolute right-3 top-3 h-9 w-9 rounded-full border border-white/10 bg-black/45 text-lg text-white/80 backdrop-blur transition hover:bg-black/65"
                    aria-label="Закрыть заявку"
                  >
                    ×
                  </button>
                </div>

                <div className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6FC9C2]">
                    Заявка риелтора
                  </div>

                  <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-white/95">
                    {
                      selectedApplication.full_name
                    }
                  </h2>

                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] text-white/30">
                        Телефон
                      </div>

                      <div className="mt-1 text-sm text-white/75">
                        {
                          selectedApplication.phone
                        }
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] text-white/30">
                        Агентство
                      </div>

                      <div className="mt-1 text-sm text-white/75">
                        {
                          selectedApplication.agency_name ||
                          "Не указано"
                        }
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] text-white/30">
                        Instagram
                      </div>

                      {selectedApplication.social_url ? (
                        <a
                          href={
                            selectedApplication.social_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-sm text-[#6FC9C2] hover:underline"
                        >
                          {
                            selectedApplication.social_url
                          }
                        </a>
                      ) : (
                        <div className="mt-1 text-sm text-white/45">
                          Не указано
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] text-white/30">
                        Подана
                      </div>

                      <div className="mt-1 text-sm text-white/55">
                        {formatDate(
                          selectedApplication.created_at
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedApplication.status ===
                    "pending" && (
                    <div className="mt-6 border-t border-white/[0.07] pt-5">
                      {confirmAction ? (
                        <div className="rounded-xl border border-white/[0.08] bg-black/10 p-4">
                          <div className="text-sm font-medium text-white/80">
                            {confirmAction ===
                            "approve"
                              ? "Одобрить заявку?"
                              : "Отклонить заявку?"}
                          </div>

                          <div className="mt-1 text-xs leading-5 text-white/35">
                            {confirmAction ===
                            "approve"
                              ? "Пользователь получит статус риелтора."
                              : "Заявка будет отмечена как отклонённая."}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction(
                                  null
                                )
                              }
                              disabled={
                                action !==
                                null
                              }
                              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] disabled:opacity-40"
                            >
                              Отмена
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleReviewAction(
                                  selectedApplication,
                                  confirmAction
                                )
                              }
                              disabled={
                                action !==
                                null
                              }
                              className={[
                                "flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                                confirmAction ===
                                "approve"
                                  ? "bg-[#6FC9C2] text-[#091016] hover:bg-[#7bd8d0]"
                                  : "bg-red-400/[0.12] text-red-200 hover:bg-red-400/[0.18]",
                              ].join(
                                " "
                              )}
                            >
                              {action
                                ? "Обработка..."
                                : confirmAction ===
                                    "approve"
                                  ? "Одобрить"
                                  : "Отклонить"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction(
                                "reject"
                              )
                            }
                            className="flex-1 rounded-xl border border-red-300/10 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200/80 transition hover:bg-red-400/[0.10]"
                          >
                            Отклонить
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction(
                                "approve"
                              )
                            }
                            className="flex-1 rounded-xl bg-[#6FC9C2] px-3 py-2.5 text-xs font-semibold text-[#091016] transition hover:bg-[#7bd8d0]"
                          >
                            Одобрить
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedApplication.status !==
                    "pending" && (
                    <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/10 px-4 py-3">
                      <div className="text-xs text-white/40">
                        Заявка уже рассмотрена.
                      </div>

                      {selectedApplication.reviewed_at && (
                        <div className="mt-1 text-xs text-white/25">
                          {formatDate(
                            selectedApplication.reviewed_at
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <div className="text-sm text-white/40">
                  Выберите заявку
                </div>

                <div className="mt-2 text-xs leading-5 text-white/25">
                  Здесь появятся подробности, фото и действия модерации.
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
