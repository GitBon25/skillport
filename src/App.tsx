import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Divider, Input, Select, Textarea } from "@/components/ui";
import { initialRequests, people, subjects, timeslots, type Person, type SessionRequest } from "@/data/mock";
import { loadJSON, saveJSON } from "@/utils/storage";

type Tab = "Витрина" | "Подобрать" | "Заявки" | "Портфолио" | "О проекте";

type MatchFilters = {
  roleNeeded: "mentor" | "student";
  seekerGrade: number;
  subjectId: string;
  format: "Видео" | "Чат";
  durationMin: 20 | 30;
  timeIds: string[];
  onlyVerified: boolean;
  query: string;
};

const LS_KEY = "skillport_mvp_state_v1";

type Persisted = {
  requests: SessionRequest[];
};

function stars(rating: number) {
  const full = Math.round(rating);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

function subjectName(id: string) {
  return subjects.find((s) => s.id === id)?.name ?? id;
}

function timeLabel(id: string) {
  return timeslots.find((t) => t.id === id)?.label ?? id;
}

function calcMatchScore(candidate: Person, f: MatchFilters) {
  let score = 0;
  if (candidate.role === f.roleNeeded) score += 3;
  if (candidate.subjects.includes(f.subjectId)) score += 4;
  if (f.roleNeeded === "mentor") {
    if (candidate.grade >= f.seekerGrade + 1) score += 2;
    else score -= 2;
  } else {
    if (candidate.grade <= f.seekerGrade - 1) score += 2;
    else score -= 2;
  }
  const overlap = candidate.available.filter((t) => f.timeIds.includes(t)).length;
  score += Math.min(3, overlap);
  if (f.onlyVerified && candidate.verified) score += 1;
  if (candidate.role === "mentor") score += Math.round(candidate.rating);
  if (f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    const hay = `${candidate.name} ${candidate.about} ${candidate.school} ${candidate.city}`.toLowerCase();
    if (hay.includes(q)) score += 2;
  }
  return score;
}

export function App() {
  const [tab, setTab] = useState<Tab>("Витрина");
  const [persisted, setPersisted] = useState<Persisted>(() =>
    loadJSON<Persisted>(LS_KEY, { requests: initialRequests })
  );

  useEffect(() => {
    saveJSON(LS_KEY, persisted);
  }, [persisted]);

  const [filters, setFilters] = useState<MatchFilters>({
    roleNeeded: "mentor",
    seekerGrade: 8,
    subjectId: "math",
    format: "Видео",
    durationMin: 20,
    timeIds: ["wed-17"],
    onlyVerified: true,
    query: "",
  });

  const candidates = useMemo(() => {
    const base = people
      .filter((p) => p.role === filters.roleNeeded)
      .filter((p) => (filters.onlyVerified ? p.verified : true))
      .filter((p) => p.subjects.includes(filters.subjectId))
      .filter((p) => {
        if (!filters.query.trim()) return true;
        const q = filters.query.trim().toLowerCase();
        const hay = `${p.name} ${p.about} ${p.school} ${p.city}`.toLowerCase();
        return hay.includes(q);
      })
      .map((p) => ({ p, score: calcMatchScore(p, filters) }))
      .sort((a, b) => b.score - a.score);

    return base;
  }, [filters]);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const selectedPerson = useMemo(
    () => (selectedPersonId ? people.find((p) => p.id === selectedPersonId) ?? null : null),
    [selectedPersonId]
  );

  function createRequest() {
    const req: SessionRequest = {
      id: `r${Math.floor(Math.random() * 1e9)}`,
      createdAt: new Date().toISOString(),
      subjectId: filters.subjectId,
      topic: "",
      studentGrade: filters.seekerGrade,
      preferredTimes: filters.timeIds,
      format: filters.format,
      durationMin: filters.durationMin,
      status: "Открыта",
    };
    setPersisted((s) => ({ ...s, requests: [req, ...s.requests] }));
    setTab("Заявки");
  }

  function matchRequest(requestId: string, mentorId: string) {
    setPersisted((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId ? { ...r, status: "Подтверждена", matchedMentorId: mentorId } : r
      ),
    }));
  }

  function completeRequest(requestId: string) {
    setPersisted((s) => ({
      ...s,
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, status: "Завершена" } : r)),
    }));
  }

  const stats = useMemo(() => {
    const total = persisted.requests.length;
    const open = persisted.requests.filter((r) => r.status === "Открыта").length;
    const confirmed = persisted.requests.filter((r) => r.status === "Подтверждена").length;
    const done = persisted.requests.filter((r) => r.status === "Завершена").length;
    const mentors = people.filter((p) => p.role === "mentor").length;
    const verifiedMentors = people.filter((p) => p.role === "mentor" && p.verified).length;
    return { total, open, confirmed, done, mentors, verifiedMentors };
  }, [persisted.requests]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/75 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm">
              SP
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">SkillPort</div>
              <div className="text-xs text-slate-500">Peer-to-peer для школьников 7–11 классов</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {(["Витрина", "Подобрать", "Заявки", "Портфолио", "О проекте"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "rounded-xl px-3 py-2 text-sm transition " +
                  (tab === t ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100")
                }
              >
                {t}
              </button>
            ))}
          </div>

        </div>

        <div className="w-full px-4 pb-3 md:hidden">
          <Select value={tab} onChange={(e) => setTab(e.target.value as Tab)}>
            <option>Витрина</option>
            <option>Подобрать</option>
            <option>Заявки</option>
            <option>Портфолио</option>
            <option>О проекте</option>
          </Select>
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-6">
        {tab === "Витрина" && (
          <div className="grid gap-4">
            <Card className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">Взаимопомощь вместо дорогих репетиторов</h1>
                  <p className="text-sm text-slate-600">
                    SkillPort - платформа коротких сессий 20-30 минут: старшеклассники помогают младшим в рамках
                    школьного сообщества. Без прямой оплаты за урок.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setTab("Подобрать")}>Подобрать наставника</Button>
                  <Button variant="secondary" onClick={() => setTab("Заявки")}>
                    Открыть заявки
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Card className="p-4">
                <div className="text-xs text-slate-500">Наставники</div>
                <div className="text-2xl font-semibold">{stats.mentors}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Проверенные</div>
                <div className="text-2xl font-semibold">{stats.verifiedMentors}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Заявки</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Открыто</div>
                <div className="text-2xl font-semibold">{stats.open}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Подтверждено</div>
                <div className="text-2xl font-semibold">{stats.confirmed}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-500">Завершено</div>
                <div className="text-2xl font-semibold">{stats.done}</div>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Как это работает</div>
                    <div className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                      {`1) Выбираешь класс и предмет
                    2) Платформа предлагает подходящих наставников
                    3) Создаёшь заявку
                    4) Подтверждаете время и формат.`}
                  </div>
                  </div>
                </div>
                <Divider className="my-4" />
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
                    Короткие сессии 20-30 минут — удобно «закрывать пробелы».
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
                    Рейтинги и отзывы - контроль качества.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
                    Баллы - портфолио наставника (вклад в сообщество).
                  </li>
                </ul>
              </Card>

              <Card>
                <div className="text-sm font-semibold">Популярные предметы</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setFilters((f) => ({ ...f, subjectId: s.id }));
                        setTab("Подобрать");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="text-xs text-slate-500">{s.emoji}</div>
                      <div className="text-sm font-medium">{s.name}</div>
                    </button>
                  ))}
                </div>
                <Divider className="my-4" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="indigo">Без оплаты за урок</Badge>
                  <Badge tone="emerald">Внутри школы/города</Badge>
                  <Badge tone="amber">Безопасность и модерация</Badge>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "Подобрать" && (
          <div className="grid gap-4 md:grid-cols-[380px_1fr]">
            <Card className="p-5">
              <div className="text-sm font-semibold">Параметры подбора</div>
              <div className="mt-4 grid gap-3">
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Кого ищем</div>
                  <Select value={filters.roleNeeded} onChange={(e) => setFilters((f) => ({ ...f, roleNeeded: e.target.value as any }))}>
                    <option value="mentor">Наставника (9-11 класс)</option>
                    <option value="student">Ученика (7-9 класс)</option>
                  </Select>
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Мой класс</div>
                  <Select
                    value={filters.seekerGrade}
                    onChange={(e) => setFilters((f) => ({ ...f, seekerGrade: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const g = 7 + i;
                      return (
                        <option key={g} value={g}>
                          {g} класс
                        </option>
                      );
                    })}
                    {Array.from({ length: 2 }).map((_, i) => {
                      const g = 10 + i;
                      return (
                        <option key={g} value={g}>
                          {g} класс
                        </option>
                      );
                    })}
                  </Select>
                  <div className="mt-1 text-xs text-slate-500">В MVP это влияет на “умный” скоринг подбора.</div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Предмет</div>
                  <Select value={filters.subjectId} onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-600">Формат</div>
                    <Select value={filters.format} onChange={(e) => setFilters((f) => ({ ...f, format: e.target.value as any }))}>
                      <option value="Видео">Видео</option>
                      <option value="Чат">Чат</option>
                    </Select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-600">Длительность</div>
                    <Select
                      value={filters.durationMin}
                      onChange={(e) => setFilters((f) => ({ ...f, durationMin: Number(e.target.value) as 20 | 30 }))}
                    >
                      <option value={20}>20 минут</option>
                      <option value={30}>30 минут</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Удобное время</div>
                  <div className="grid grid-cols-1 gap-2">
                    {timeslots.map((t) => {
                      const checked = filters.timeIds.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                          <span className="text-slate-700">{t.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setFilters((f) => ({
                                ...f,
                                timeIds: e.target.checked ? Array.from(new Set([...f.timeIds, t.id])) : f.timeIds.filter((x) => x !== t.id),
                              }));
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Только проверенные</div>
                    <div className="text-xs text-slate-500">Демо-флаг: e-mail/телефон подтверждён</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.onlyVerified}
                    onChange={(e) => setFilters((f) => ({ ...f, onlyVerified: e.target.checked }))}
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Поиск по профилям</div>
                  <Input value={filters.query} onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))} placeholder="Например: профмат, сочинение, школа №12…" />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={createRequest}>Создать заявку</Button>
                  <Button variant="secondary" onClick={() => setSelectedPersonId(null)}>
                    Снять выбор
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">Результаты подбора</div>
                    <div className="text-sm text-slate-600">
                      Предмет: <span className="font-medium">{subjectName(filters.subjectId)}</span> · Формат: {filters.format} · {filters.durationMin} мин
                    </div>
                  </div>
                  <Badge tone="slate">Найдено: {candidates.length}</Badge>
                </div>
              </Card>

              <div className="grid gap-3 lg:grid-cols-2">
                {candidates.map(({ p, score }) => {
                  const isSelected = p.id === selectedPersonId;
                  const overlap = p.available.filter((t) => filters.timeIds.includes(t));
                  return (
                    <Card key={p.id} className={isSelected ? "ring-2 ring-indigo-400" : undefined}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold">{p.name}</div>
                            {p.verified ? <Badge tone="emerald">Проверен</Badge> : <Badge tone="amber">Без вериф.</Badge>}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {p.city} · {p.school}
                          </div>
                        </div>
                        <Badge tone="indigo">match {score}</Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="slate">{p.grade} класс</Badge>
                        {p.subjects.slice(0, 3).map((sid) => (
                          <Badge key={sid} tone="indigo">
                            {subjectName(sid)}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 text-sm text-slate-700">{p.about}</div>

                      {p.role === "mentor" && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{p.rating.toFixed(1)}</span> · {stars(p.rating)} · {p.reviewsCount} отзывов
                          </div>
                          <div className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{p.points}</span> баллов (портфолио)
                          </div>
                        </div>
                      )}

                      <Divider className="my-4" />

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-600">Пересечение по времени</div>
                        <div className="flex flex-wrap gap-2">
                          {overlap.length ? (
                            overlap.map((t) => (
                              <Badge key={t} tone="emerald">
                                {timeLabel(t)}
                              </Badge>
                            ))
                          ) : (
                            <Badge tone="rose">Нет совпадений</Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant={isSelected ? "secondary" : "primary"} onClick={() => setSelectedPersonId(isSelected ? null : p.id)}>
                          {isSelected ? "Выбрано" : "Выбрать"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            // quick action: create request and auto-match
                            const req: SessionRequest = {
                              id: `r${Math.floor(Math.random() * 1e9)}`,
                              createdAt: new Date().toISOString(),
                              subjectId: filters.subjectId,
                              topic: "Быстрая сессия: нужна помощь по теме",
                              studentGrade: filters.seekerGrade,
                              preferredTimes: filters.timeIds,
                              format: filters.format,
                              durationMin: filters.durationMin,
                              status: "Подтверждена",
                              matchedMentorId: p.id,
                            };
                            setPersisted((s) => ({ ...s, requests: [req, ...s.requests] }));
                            setTab("Заявки");
                          }}
                        >
                          Быстрое совпадение
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {selectedPerson && (
                <Card className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Выбранный профиль</div>
                      <div className="text-sm text-slate-600">Можно использовать для ручного подтверждения заявки.</div>
                    </div>
                    <Badge tone="slate">ID: {selectedPerson.id}</Badge>
                  </div>
                  <Divider className="my-4" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-slate-500">Имя</div>
                      <div className="text-sm font-medium">{selectedPerson.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Статус</div>
                      <div className="text-sm font-medium">{selectedPerson.verified ? "Проверен" : "Без верификации"}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-500">Доступность</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedPerson.available.map((t) => (
                          <Badge key={t} tone="slate">
                            {timeLabel(t)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === "Заявки" && (
          <div className="grid gap-4">
            <Card className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold">Заявки на занятия</div>
                  <div className="text-sm text-slate-600">
                    Здесь видно как работает “маркетплейс” коротких p2p-сессий: открытые → подтверждённые → завершённые.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setTab("Подобрать")}>Создать через подбор</Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-3">
              {persisted.requests.map((r) => {
                const mentor = r.matchedMentorId ? people.find((p) => p.id === r.matchedMentorId) : null;
                const tone = r.status === "Открыта" ? "amber" : r.status === "Подтверждена" ? "indigo" : "emerald";
                return (
                  <Card key={r.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={tone as any}>{r.status}</Badge>
                          <div className="text-sm font-semibold">{subjectName(r.subjectId)}</div>
                          <Badge tone="slate">{r.studentGrade} класс</Badge>
                          <Badge tone="slate">{r.format}</Badge>
                          <Badge tone="slate">{r.durationMin} мин</Badge>
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="text-slate-500">Тема:</span> {r.topic || "(пока не заполнена)"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {r.preferredTimes.map((t) => (
                            <Badge key={t} tone="slate">
                              {timeLabel(t)}
                            </Badge>
                          ))}
                        </div>
                        {mentor && (
                          <div className="text-sm text-slate-700">
                            <span className="text-slate-500">Наставник:</span> <span className="font-medium">{mentor.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {r.status === "Открыта" && (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const best = candidates[0]?.p;
                                if (best) matchRequest(r.id, best.id);
                              }}
                            >
                              Автоподбор
                            </Button>
                            <Button
                              onClick={() => {
                                if (!selectedPersonId) return;
                                matchRequest(r.id, selectedPersonId);
                              }}
                              disabled={!selectedPersonId}
                            >
                              Подтвердить с выбранным
                            </Button>
                          </>
                        )}
                        {r.status === "Подтверждена" && (
                          <>
                            <Button variant="secondary" onClick={() => completeRequest(r.id)}>
                              Завершить
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const url = "https://meet.google.com/";
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              Открыть видеовстречу
                            </Button>
                          </>
                        )}
                        {r.status === "Завершена" && (
                          <Badge tone="emerald">+баллы наставнику (в MVP имитация)</Badge>
                        )}
                      </div>
                    </div>

                    {r.status === "Открыта" && (
                      <div className="mt-4">
                        <Divider className="mb-3" />
                        <div className="grid gap-2 md:grid-cols-[1fr_140px]">
                          <Textarea
                            placeholder="Заполни тему: например, «Квадратные уравнения»"
                            value={r.topic}
                            onChange={(e) => {
                              const topic = e.target.value;
                              setPersisted((s) => ({
                                ...s,
                                requests: s.requests.map((x) => (x.id === r.id ? { ...x, topic } : x)),
                              }));
                            }}
                            rows={2}
                          />
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const best = candidates[0]?.p;
                              if (best) matchRequest(r.id, best.id);
                            }}
                          >
                            Найти наставника
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          В реальном продукте здесь будет календарь, уведомления и подтверждение со стороны наставника.
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {!persisted.requests.length && (
                <Card className="p-6 text-center text-sm text-slate-600">Пока заявок нет. Создай первую через «Подобрать».</Card>
              )}
            </div>
          </div>
        )}

        {tab === "Портфолио" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <div className="text-sm font-semibold">Портфолио наставника (демо)</div>
              <div className="mt-2 text-sm text-slate-600">
                В SkillPort баллы фиксируют вклад: проведённые сессии, отзывы, активность. Это может стать частью
                образовательного портфолио.
              </div>
              <Divider className="my-4" />
              <div className="space-y-3">
                {people
                  .filter((p) => p.role === "mentor")
                  .sort((a, b) => b.points - a.points)
                  .map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">#{idx + 1} {p.name}</div>
                          {p.verified ? <Badge tone="emerald">Проверен</Badge> : <Badge tone="amber">Без вериф.</Badge>}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{p.school} · {p.city}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{p.points}</div>
                        <div className="text-xs text-slate-500">баллов</div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold">Безопасность и правила</div>
              <div className="mt-2 grid gap-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Верификация</div>
                  <div className="mt-1 text-sm text-slate-600">Подтверждение e-mail/телефона и привязка к школе (для доверия).</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Модерация</div>
                  <div className="mt-1 text-sm text-slate-600">Отзывы, жалобы, правила общения и блокировки при нарушениях.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Согласие родителей</div>
                  <div className="mt-1 text-sm text-slate-600">В пилотной версии - обязательное согласие для пользователей младше 18 лет.</div>
                </div>
              </div>
              <Divider className="my-4" />
              <div className="text-xs text-slate-500">
                Это MVP-демо интерфейса. Здесь нет реальной регистрации, видеозвонков и хранения персональных данных.
              </div>
            </Card>
          </div>
        )}

        {tab === "О проекте" && (
          <div className="grid gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold">SkillPort - суть проекта</div>
              <div className="mt-2 text-sm text-slate-700">
                Платформа взаимного обучения для школьников 7-11 классов: короткие занятия 20-30 минут, p2p-модель,
                рейтинги/отзывы, баллы и портфолио наставника. Модель монетизации — подписка школам (B2B) + freemium.
              </div>
              <Divider className="my-4" />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Целевая аудитория</div>
                  <div className="mt-1 text-sm font-medium">Ученики 7–9</div>
                  <div className="mt-1 text-sm text-slate-600">Нужна доступная помощь по предметам.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Наставники</div>
                  <div className="mt-1 text-sm font-medium">9–11 классы</div>
                  <div className="mt-1 text-sm text-slate-600">Закрепляют знания и собирают портфолио.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Формат</div>
                  <div className="mt-1 text-sm font-medium">20–30 минут</div>
                  <div className="mt-1 text-sm text-slate-600">Видео/чат, быстро и по делу.</div>
                </div>
              </div>
              <Divider className="my-4" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setTab("Подобрать")}>Открыть подбор</Button>
                <Button variant="secondary" onClick={() => setTab("Заявки")}>
                  Посмотреть заявки
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold">Что включено в MVP</div>
              <Divider className="my-4" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Подбор “наставник ↔ ученик”</div>
                  <div className="mt-1 text-sm text-slate-600">Фильтры: класс, предмет, формат, время, верификация, поиск.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Заявки и статусы</div>
                  <div className="mt-1 text-sm text-slate-600">Открыта → Подтверждена → Завершена, автоподбор, ручной мэтч.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">Портфолио (демо)</div>
                  <div className="mt-1 text-sm text-slate-600">Таблица наставников по баллам, имитация начислений.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-medium">LocalStorage</div>
                  <div className="mt-1 text-sm text-slate-600">Заявки сохраняются в браузере (демо-данные).</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="flex w-full flex-col gap-2 px-4 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>SkillPort MVP · прототип интерфейса для проекта взаимного обучения</div>
        </div>
      </footer>
    </div>
  );
}
