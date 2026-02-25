export type Role = "student" | "mentor";

export type Subject = {
  id: string;
  name: string;
  emoji: string;
};

export type Timeslot = {
  id: string;
  label: string;
  day: "Пн" | "Вт" | "Ср" | "Чт" | "Пт" | "Сб" | "Вс";
  start: string; // HH:MM
  end: string; // HH:MM
};

export type Person = {
  id: string;
  name: string;
  city: string;
  school: string;
  grade: number;
  role: Role;
  subjects: string[]; // subject ids
  about: string;
  rating: number;
  reviewsCount: number;
  points: number;
  available: string[]; // timeslot ids
  verified: boolean;
};

export type SessionRequest = {
  id: string;
  createdAt: string;
  subjectId: string;
  topic: string;
  studentGrade: number;
  preferredTimes: string[]; // timeslot ids
  format: "Видео" | "Чат";
  durationMin: 20 | 30;
  status: "Открыта" | "Подтверждена" | "Завершена";
  matchedMentorId?: string;
};

export const subjects: Subject[] = [
  { id: "math", name: "Математика", emoji: "∑" },
  { id: "rus", name: "Русский язык", emoji: "А" },
  { id: "phys", name: "Физика", emoji: "⚡" },
  { id: "chem", name: "Химия", emoji: "⚗" },
  { id: "eng", name: "Английский", emoji: "EN" },
  { id: "inf", name: "Информатика", emoji: "</>" },
];

export const timeslots: Timeslot[] = [
  { id: "mon-17", day: "Пн", label: "Пн 17:00–17:30", start: "17:00", end: "17:30" },
  { id: "mon-19", day: "Пн", label: "Пн 19:00–19:30", start: "19:00", end: "19:30" },
  { id: "tue-18", day: "Вт", label: "Вт 18:00–18:30", start: "18:00", end: "18:30" },
  { id: "wed-17", day: "Ср", label: "Ср 17:00–17:30", start: "17:00", end: "17:30" },
  { id: "thu-19", day: "Чт", label: "Чт 19:00–19:30", start: "19:00", end: "19:30" },
  { id: "fri-18", day: "Пт", label: "Пт 18:00–18:30", start: "18:00", end: "18:30" },
  { id: "sat-12", day: "Сб", label: "Сб 12:00–12:30", start: "12:00", end: "12:30" },
  { id: "sun-16", day: "Вс", label: "Вс 16:00–16:30", start: "16:00", end: "16:30" },
];

export const people: Person[] = [
  {
    id: "p1",
    name: "Егор, 10 класс",
    city: "Владивосток",
    school: "Школа №12",
    grade: 10,
    role: "mentor",
    subjects: ["math", "inf"],
    about: "Готовлюсь к ЕГЭ по профмату и информатике. Объясняю коротко и по шагам.",
    rating: 4.8,
    reviewsCount: 23,
    points: 1240,
    available: ["mon-19", "wed-17", "sat-12"],
    verified: true,
  },
  {
    id: "p2",
    name: "Алина, 11 класс",
    city: "Владивосток",
    school: "Гимназия №1",
    grade: 11,
    role: "mentor",
    subjects: ["rus", "eng"],
    about: "Помогаю с сочинениями и правилами. Могу проверить домашку и дать план.",
    rating: 4.9,
    reviewsCount: 41,
    points: 2030,
    available: ["tue-18", "thu-19", "sun-16"],
    verified: true,
  },
  {
    id: "p3",
    name: "Иван, 9 класс",
    city: "Владивосток",
    school: "Школа №12",
    grade: 9,
    role: "mentor",
    subjects: ["phys", "math"],
    about: "ОГЭ по физике. Люблю задачи на движение и электричество.",
    rating: 4.6,
    reviewsCount: 12,
    points: 760,
    available: ["fri-18", "sat-12"],
    verified: false,
  },
  {
    id: "p4",
    name: "Саша, 8 класс",
    city: "Владивосток",
    school: "Школа №7",
    grade: 8,
    role: "student",
    subjects: ["math", "rus"],
    about: "Проваливаюсь в дробях и задачах. Нужны короткие объяснения.",
    rating: 0,
    reviewsCount: 0,
    points: 120,
    available: ["mon-17", "wed-17", "sun-16"],
    verified: true,
  },
  {
    id: "p5",
    name: "Лера, 7 класс",
    city: "Владивосток",
    school: "Школа №5",
    grade: 7,
    role: "student",
    subjects: ["chem", "math"],
    about: "Хочу подтянуть математику и понять основы химии.",
    rating: 0,
    reviewsCount: 0,
    points: 80,
    available: ["tue-18", "thu-19"],
    verified: false,
  },
];

export const initialRequests: SessionRequest[] = [
  {
    id: "r1",
    createdAt: "2026-02-19T09:30:00.000Z",
    subjectId: "math",
    topic: "Дроби и приведение к общему знаменателю",
    studentGrade: 8,
    preferredTimes: ["wed-17", "sun-16"],
    format: "Видео",
    durationMin: 20,
    status: "Открыта",
  },
  {
    id: "r2",
    createdAt: "2026-02-18T16:10:00.000Z",
    subjectId: "rus",
    topic: "Сочинение ОГЭ: структура и аргументы",
    studentGrade: 9,
    preferredTimes: ["tue-18", "thu-19"],
    format: "Чат",
    durationMin: 30,
    status: "Подтверждена",
    matchedMentorId: "p2",
  },
];
