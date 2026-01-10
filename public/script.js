const playerNameInput = document.getElementById("playerName");
const playerEmailInput = document.getElementById("playerEmail");
const playerEmojiInput = document.getElementById("playerEmoji"); // select/emoji input
const saveNameBtn = document.getElementById("saveName");
const welcomeText = document.getElementById("welcome");
const dateInput = document.getElementById("dateInput");
const addDateBtn = document.getElementById("addDate");
const dateList = document.getElementById("dateList");

const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const adminPinInput = document.getElementById("adminPin");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const logoutAdminBtn = document.getElementById("logoutAdminBtn");

let playerName = "";
let playerId = localStorage.getItem("playerId");
let votedDates = [];
let isPlayerRegistered = false;
let isAdmin = localStorage.getItem("isAdmin") === "true";

// UUID gracza
if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem("playerId", playerId);
}

// jeśli imię zapisane lokalnie
const savedName = localStorage.getItem("playerName");
if (savedName) {
    playerName = savedName;
    isPlayerRegistered = true;
    welcomeText.textContent = `Witaj, ${playerName}!`;
    fetchVotes();
}

// ====== Gracz zapis ======
saveNameBtn.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    const email = playerEmailInput.value.trim();
    const emoji = playerEmojiInput.value.trim() || "🎲";

    if (!name) { alert("Podaj imię!"); return; }

    playerName = name;
    isPlayerRegistered = true;
    localStorage.setItem("playerName", name);

    welcomeText.textContent = `Witaj, ${playerName}!`;
    playerNameInput.value = "";

    await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: playerId, name, email, emoji })
    });

    fetchVotes();
    fetchDates();
});

// ====== Pobieranie głosów ======
async function fetchVotes() {
    const res = await fetch(`/api/votes/${playerId}`);
    votedDates = await res.json();
}

// ====== Pobieranie dat ======
async function fetchDates() {
    const res = await fetch("/api/dates");
    const data = await res.json();
    renderDates(data);
}

// ====== Dodawanie daty ======
addDateBtn.addEventListener("click", async () => {
    if (!isPlayerRegistered) { alert("Najpierw podaj imię!"); return; }
    const dateValue = dateInput.value;
    if (!dateValue) { alert("Wybierz datę!"); return; }

    const res = await fetch("/api/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateValue })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    dateInput.value = "";
    fetchDates();
});

// ====== Render dat ======
function renderDates(dates) {
    dateList.innerHTML = "";
    const sorted = [...dates].sort((a, b) => b.votes - a.votes);

    const maxVotes = Math.max(...sorted.map(d => d.votes));

    sorted.forEach((item) => {
        const li = document.createElement("li");

        let label = item.date;
        if (item.votes === maxVotes && maxVotes > 0) label += " 👑"; // korona

        li.textContent = label;

        const btn = document.createElement("button");

        if (isAdmin) {
            btn.textContent = "Usuń";
            btn.addEventListener("click", async () => {
                await fetch(`/api/admin/date/${item.id}/delete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isAdmin })
                });
                fetchDates();
            });

            const confirmBtn = document.createElement("button");
            confirmBtn.textContent = "Zatwierdź";
            confirmBtn.addEventListener("click", async () => {
                await fetch(`/api/admin/date/${item.id}/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isAdmin })
                });
                fetchDates();
            });

            li.appendChild(confirmBtn);

        } else {
            if (!isPlayerRegistered) {
                btn.textContent = "Podaj imię";
                btn.disabled = true;
            } else if (votedDates.includes(item.date)) {
                btn.textContent = `Oddano (${item.votes})`;
                btn.disabled = true;
            } else {
                btn.textContent = `Głosuj (${item.votes})`;
                btn.addEventListener("click", async () => {
                    const res = await fetch("/api/vote", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ date: item.date, playerId })
                    });
                    const data = await res.json();
                    if (!res.ok) { alert(data.error); return; }
                    votedDates.push(item.date);
                    fetchDates();
                });
            }
        }

        li.appendChild(btn);
        dateList.appendChild(li);
    });
}

// ====== Admin login ======
adminBtn.addEventListener("click", () => adminModal.style.display = "flex");
adminLoginBtn.addEventListener("click", async () => {
    const pin = adminPinInput.value.trim();
    const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
    });

    if (!res.ok) { alert("Zły PIN!"); return; }

    isAdmin = true;
    localStorage.setItem("isAdmin", "true");
    adminModal.style.display = "none";
    fetchDates();
});

// ====== Wyloguj admina ======
logoutAdminBtn.addEventListener("click", () => {
    isAdmin = false;
    localStorage.setItem("isAdmin", "false");
    fetchDates();
});

// ====== Start ======
fetchDates();
