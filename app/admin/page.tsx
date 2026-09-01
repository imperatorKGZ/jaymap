"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "@/lib/admin/statistics";

const dashboardCards = [
  {
    title: "Пользователи",
    key: "users" as const,
    description: "Всего зарегистрировано",
  },
  {
    title: "Объявления",
    key: "listings" as const,
    description: "Всего создано",
  },
  {
    title: "Активные объявления",
    key: "active_listings" as const,
    description: "Сейчас опубликовано",
  },
  {
    title: "Риелторы",
    key: "realtors" as const,
    description: "Сейчас зарегистрировано",
  },
  {
    title: "Новые заявки",
    key: "pending_realtor_applications" as const,
    description: "На рассмотрении",
  },
];

export default function AdminPage() {
  const {
    profile,
  } = useAuth();

  const [
    stats,
    setStats,
  ] = useState<AdminDashboardStats | null>(
    null
  );

  const [
    statsLoading,
    setStatsLoading,
  ] = useState(true);

  const [
    statsError,
    setStatsError,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const loadStats =
      async () => {
        setStatsLoading(
          true
        );

        setStatsError(
          null
        );

        try {
          const nextStats =
            await getAdminDashboardStats();

          if (
            cancelled
          ) {
            return;
          }

          setStats(
            nextStats
          );
        } catch (error) {
          console.error(
            "[Admin] Dashboard statistics load failed:",
            error
          );

          if (
            cancelled
          ) {
            return;
          }

          setStatsError(
            "Не удалось загрузить статистику."
          );
        } finally {
          if (
            !cancelled
          ) {
            setStatsLoading(
              false
            );
          }
        }
      };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1016] text-white">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8">
        <header className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6FC9C2]">
              JayMap Admin
            </div>

            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.02em]">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Административная панель
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.08em] text-white/35">
              Роль
            </div>

            <div className="mt-1 text-sm font-semibold text-white/80">
              {profile?.role ?? "admin"}
            </div>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="text-[12px] font-medium text-white/50">
                {card.title}
              </div>

              <div className="mt-4 text-[28px] font-bold tracking-[-0.03em] text-white/90">
                {statsLoading
                  ? "—"
                  : stats
                    ? stats[
                        card.key
                      ].toLocaleString(
                        "ru-RU"
                      )
                    : "—"}
              </div>

              <div className="mt-2 text-[11px] leading-5 text-white/30">
                {card.description}
              </div>
            </article>
          ))}
        </section>

        {statsError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-200/80"
          >
            {statsError}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="min-h-[360px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white/90">
                  Активность
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Здесь будет статистика сайта
                </p>
              </div>
            </div>

            <div className="mt-8 flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/10">
              <div className="text-center">
                <div className="text-sm font-medium text-white/45">
                  График статистики
                </div>

                <div className="mt-2 text-xs text-white/25">
                  Подключим после настройки реальных метрик
                </div>
              </div>
            </div>
          </article>

          <article className="min-h-[360px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div>
              <h2 className="text-base font-semibold text-white/90">
                Заявки
              </h2>

              <p className="mt-1 text-xs text-white/35">
                Новые заявки на статус риелтора
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-white/[0.06] bg-black/10 p-5">
              <div className="text-sm font-medium text-white/50">
                Заявки пока не подключены
              </div>

              <div className="mt-2 text-xs leading-5 text-white/25">
                Следующим этапом подключим список
                realtor_applications и действия
                «Одобрить» / «Отклонить».
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
