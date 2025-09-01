import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  X,
  CheckCircle2,
  Coffee,
  Upload,
  Download,
  MessageSquare,
  Search,
} from "lucide-react";

// =================== CONFIG GOOGLE APPS SCRIPT ===================
const FETCH_URL =
  "https://script.google.com/macros/s/AKfycby_9_mXaXLoEiETPgfXYK80o5Y6ysS1IMzEEMIO-aetx_3AE27yDrhqannagHYGD7vQ/exec";
const NO_CORS = true;

// =================== EXAMPLE STAFF DATA ===================
const DEFAULT_STAFF = [
  {
    id: "e1",
    name: "Hiếu Hiếu",
    role: "Phục vụ",
    avatar:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=512&auto=format&fit=crop",
  },
  {
    id: "e2",
    name: "Hòa Hòa",
    role: "Phục vụ",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=512&auto=format&fit=crop",
  },
  {
    id: "e3",
    name: "Hồng Nhung",
    role: "Thu ngân",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=512&auto=format&fit=crop",
  },
  {
    id: "e4",
    name: "Minh Nguyễn",
    role: "Phục vụ",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=512&auto=format&fit=crop",
  },
  {
    id: "e5",
    name: "Ly Ly",
    role: "Phục vụ",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=512&auto=format&fit=crop",
  },
  {
    id: "e6",
    name: "Như Như",
    role: "Phục vụ",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=512&auto=format&fit=crop",
  },
];

// =================== LOCAL STORAGE HELPERS ===================
const LS_KEY = "cafe_staff_feedback_v1";
const loadFeedback = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveFeedback = (rows) => {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
};

// =================== DEVICE/ENV HELPERS ===================
const getDeviceInfo = () => {
  try {
    return navigator.userAgent || "unknown";
  } catch {
    return "unknown";
  }
};
const getSource = () => {
  try {
    return window.location.href || "web";
  } catch {
    return "web";
  }
};

// =================== NETWORK HELPER ===================
async function postToSheet(payload) {
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  if (NO_CORS) {
    await fetch(FETCH_URL, { ...opts, mode: "no-cors" });
    return { ok: true, noCors: true };
  }

  const res = await fetch(FETCH_URL, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed: ${res.status} ${text}`);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Nếu GAS trả text, coi như ok
  }
  return { ok: true, data };
}

// =================== CSV PARSER ===================
function parseCSV(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const rows = lines.map((line) => {
    const parts = line.split(",").map((s) => (s ?? "").trim());
    const [name, role, avatar] = [
      parts[0] ?? "",
      parts[1] ?? "",
      parts[2] ?? "",
    ];
    return { name, role, avatar };
  });
  return rows;
}

// =================== UI: STARS ===================
function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1" aria-label="Chọn số sao">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-1"
          aria-label={`${s} sao`}
        >
          <Star
            className={`h-7 w-7 transition-transform ${
              (hover || value) >= s ? "fill-current" : ""
            } ${hover >= s ? "scale-110" : ""}`}
          />
        </button>
      ))}
    </div>
  );
}

// =================== UI: MODAL ===================
function Modal({ open, onClose, children, title }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-zinc-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =================== UI: TOAST ===================
function Toast({ show, message }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =================== ADMIN VIEW ===================
function AdminView({ data, staff }) {
  const withNames = data.map((r) => ({
    ...r,
    employee: staff.find((s) => s.id === r.employeeId)?.name || r.employeeId,
  }));

  const exportCSV = () => {
    const headers = [
      "timestamp",
      "employeeId",
      "employee",
      "rating",
      "comment",
      "orderCode",
      "source",
      "device",
    ];
    const rows = withNames.map((r) =>
      headers
        .map((h) => `${String(r[h] ?? "").replaceAll('"', '""')}`)
        .map((c) => `"${c}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return withNames;
    const k = q.toLowerCase();
    return withNames.filter(
      (r) =>
        r.employee.toLowerCase().includes(k) ||
        (r.comment || "").toLowerCase().includes(k) ||
        (r.orderCode || "").toLowerCase().includes(k)
    );
  }, [withNames, q]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Bảng phản hồi (Admin)</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Search className="h-4 w-4" />
            <input
              placeholder="Tìm theo tên, nội dung, mã đơn…"
              className="w-60 outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white shadow active:translate-y-[1px]"
          >
            <Download className="h-4 w-4" /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full divide-y">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="p-3">Thời gian</th>
              <th className="p-3">Nhân viên</th>
              <th className="p-3">Sao</th>
              <th className="p-3">Nhận xét</th>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Nguồn</th>
              <th className="p-3">Thiết bị</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-zinc-50">
                <td className="p-3 whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
                <td className="p-3">{r.employee}</td>
                <td className="p-3">{r.rating}★</td>
                <td className="p-3 max-w-md">{r.comment}</td>
                <td className="p-3">{r.orderCode}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">{r.device}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={7}>
                  Chưa có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mx-auto mt-6 max-w-5xl rounded-2xl border bg-white p-4 text-sm text-zinc-600">
        <div className="font-medium mb-2">Gợi ý:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Mở trang này với <code>#admin</code> ở cuối URL để vào chế độ quản trị.
          </li>
          <li>Nhấp “Xuất CSV” để tải dữ liệu phản hồi về máy.</li>
          <li>
            Nếu bạn đã cấu hình Google Apps Script, dữ liệu mới cũng sẽ được ghi
            lên Google Sheet song song với localStorage.
          </li>
        </ul>
      </div>
    </div>
  );
}

// =================== MAIN APP ===================
export default function EmployeeFeedbackApp() {
  const [staff, setStaff] = useState(DEFAULT_STAFF);
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [toast, setToast] = useState("");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const isAdmin =
    typeof window !== "undefined" && window.location.hash === "#admin";

  useEffect(() => {
    setData(loadFeedback());
  }, []);

  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    const k = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(k) || s.role.toLowerCase().includes(k)
    );
  }, [search, staff]);

  const openRate = (emp) => {
    setSelected(emp);
    setRating(0);
    setComment("");
    setOrderCode("");
  };

  const handleAfterSubmitUI = () => {
    setSelected(null);
    setRating(0);
    setComment("");
    setOrderCode("");
    setToast("Cảm ơn bạn đã đánh giá!");
    setTimeout(() => setToast(""), 2500);
  };
const [loading, setLoading] = useState(false);

  const submit = async () => {
  if (!selected || rating === 0 || loading) return;

  setLoading(true); // 👉 bật trạng thái loading

  const payload = {
    timestamp: new Date().toISOString(),
    employeeName: selected.name,   // 👈 gửi tên nhân viên
    rating,
    comment: comment.trim(),
    orderCode: orderCode.trim(),
    source: getSource(),
    device: getDeviceInfo(),
  };

  const newData = [...data, payload];
  setData(newData);
  saveFeedback(newData);

  try {
    const result = await postToSheet(payload);
    console.log("Đã gửi đánh giá lên Google Sheet:", result);

    setToast("Gửi thành công lên Google Sheet!");
    setTimeout(() => setToast(""), 2500);

    handleAfterSubmitUI();
  } catch (err) {
    console.warn("Không gửi được lên Google Sheet:", err);

    setToast("Đã lưu local nhưng KHÔNG gửi được lên Google Sheet.");
    setTimeout(() => setToast(""), 3500);

    handleAfterSubmitUI();
  } finally {
    setLoading(false); // 👉 tắt loading
  }
};

  const addStaffByUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const rows = parseCSV(String(text));
      if (!rows.length) return;
      const newStaff = rows.map((r, idx) => ({
        id: `u_${Date.now()}_${idx}`,
        name: r.name || `Nhân viên ${idx + 1}`,
        role: r.role || "Nhân viên",
        avatar: r.avatar || DEFAULT_STAFF[0].avatar,
      }));
      setStaff((prev) => [...prev, ...newStaff]);
    };
    reader.readAsText(file);
  };

  if (isAdmin) {
    return <AdminView data={data} staff={staff} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-200">
              <Coffee className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Đánh giá nhân viên</h1>
              <p className="text-sm text-zinc-500">
                Cảm ơn bạn đã giúp chúng tôi phục vụ tốt hơn!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex">
              <Search className="h-4 w-4" />
              <input
                placeholder="Tìm nhân viên…"
                className="w-48 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Nhập danh sách (CSV)</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && addStaffByUpload(e.target.files[0])
                }
              />
            </label>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-6 pt-8">
        <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">
              Hãy chia sẻ trải nghiệm của bạn ✨
            </h2>
            <p className="text-zinc-600">
              Chọn đúng nhân viên đã phục vụ bạn rồi chấm số sao và để lại lời
              nhận xét (nếu muốn).
            </p>
            <ul className="list-inside list-disc text-zinc-600">
              <li>Nhanh, đơn giản, ẩn danh.</li>
              <li>
                Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ mỗi ngày.
              </li>
            </ul>
          </div>
          <div className="grid place-items-center">
            <div className="rounded-3xl bg-amber-100 p-6 text-center">
              <div className="text-3xl">⭐️⭐️⭐️⭐️⭐️</div>
              <div className="mt-2 text-sm text-amber-900">
                Trung bình 4.8/5 từ 160+ đánh giá
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-4 flex items-center gap-2 sm:hidden">
          <div className="flex w-full items-center gap-2 rounded-xl border px-3 py-2">
            <Search className="h-4 w-4" />
            <input
              placeholder="Tìm nhân viên…"
              className="w-full outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {filteredStaff.map((emp) => (
            <motion.button
              key={emp.id}
              onClick={() => openRate(emp)}
              whileHover={{ y: -2 }}
              className="group rounded-3xl border bg-white p-4 text-left shadow-sm hover:shadow-md focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">
                    {emp.name}
                  </div>
                  <div className="truncate text-sm text-zinc-500">
                    {emp.role}
                  </div>
                  <div className="mt-1 text-sm text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Nhấn để đánh giá →
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-center text-zinc-600">
            Không tìm thấy nhân viên phù hợp.
          </div>
        )}
      </section>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Đánh giá ${selected.name}` : ""}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={selected.avatar}
                alt={selected.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div>
                <div className="font-medium">{selected.name}</div>
                <div className="text-sm text-zinc-500">{selected.role}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4">
              <div className="mb-2 text-sm text-zinc-600">
                Mức độ hài lòng của bạn:
              </div>
              <Stars value={rating} onChange={setRating} />
              {rating === 0 && (
                <div className="mt-1 text-xs text-red-500">
                  Vui lòng chọn số sao.
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-zinc-600">
                  Nhận xét (không bắt buộc)
                </label>
                <div className="rounded-xl border bg-white p-2 focus-within:ring-2 focus-within:ring-amber-300">
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full resize-none outline-none"
                    placeholder="Bạn có thể góp ý về thái độ, tốc độ phục vụ…"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-600">Mã đơn (nếu có)</label>
                <input
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="VD: A123"
                  className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                />
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                  <MessageSquare className="mt-0.5 h-4 w-4" />
                  <span>
                    Thông tin này giúp chúng tôi xác minh và phản hồi chính xác
                    hơn.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl px-4 py-2 text-zinc-700 hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
  onClick={submit}
  disabled={loading}
  className={`px-4 py-2 rounded-lg text-white transition ${
    loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {loading ? "Đang gửi..." : "Gửi đánh giá"}
</button>

            </div>
          </div>
        )}
      </Modal>

      <Toast show={!!toast} message={toast} />

      <footer className="border-t bg-white/70">
        <div className="mx-auto max-w-5xl p-4 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Ông Gấu Coffee – Cảm ơn bạn đã dành thời
          gian đánh giá 💛
        </div>
      </footer>
    </div>
  );
}