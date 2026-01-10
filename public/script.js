document.addEventListener("DOMContentLoaded", () => {

    const playerNameInput = document.getElementById("playerName");
    const playerEmailInput = document.getElementById("playerEmail");
    const playerEmojiInput = document.getElementById("playerEmoji");
    const saveNameBtn = document.getElementById("saveName");
    const welcomeText = document.getElementById("welcome");

    const dateInput = document.getElementById("dateInput");
    const addDateBtn = document.getElementById("addDate");
    const dateList = document.getElementById("dateList");

    const adminBtn = document.getElementById("adminBtn");
    const adminModal = document.getElementById("adminModal");
    const adminPinInput = document.getElementById("adminPinInput");
    const adminLoginBtn = document.getElementById("loginAdminBtn");
    const logoutAdminBtn = document.getElementById("logoutAdminBtn");

    let playerId = localStorage.getItem("playerId");
    let votedDates = [];
    let isPlayerRegistered = false;
    let isAdmin = localStorage.getItem("isAdmin") === "true";

    if (!playerId) {
        playerId = crypto.randomUUID();
        localStorage.setItem("playerId", playerId);
    }

    const savedName = localStorage.getItem("playerName");
    if (savedName) {
        isPlayerRegistered = true;
        welcomeText.textContent = `Witaj, ${savedName}!`;
        fetchVotes();
    }

    // ===== ZAPIS GRACZA =====
    saveNameBtn.addEventListener("click", async () => {
        const name = playerNameInput.value.trim();
        const email = playerEmailInput.value.trim();
        const emoji = playerEmojiInput.value || "🎲";

        if (!name) {
            alert("Podaj imię!");
            return;
        }

        localStorage.setItem("playerName", name);
        isPlayerRegistered = true;
        welcomeText.textContent = `Witaj, ${name}!`;

        await fetch("/api/players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: playerId, name, email, emoji })
        });

        fetchVotes();
        fetchDates();
    });

    async function fetchVotes() {
        const res = await fetch(`/api/votes/${playerId}`);
        votedDates = await res.json();
    }

    async function fetchDates() {
        const res = await fetch("/api/dates");
        const data = await res.json();
        renderDates(data);
    }

    // ===== DODAWANIE DATY =====
    addDateBtn.addEventListener("click", async () => {
        if (!isPlayerRegistered) {
            alert("Najpierw podaj imię!");
            return;
        }

        const dateValue = dateInput.value;
        if (!dateValue) {
            alert("Wybierz datę!");
            return;
        }

        const res = await fetch("/api/dates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateValue })
        });

        if (!res.ok) {
            alert("Błąd dodawania daty");
            return;
        }

        dateInput.value = "";
        fetchDates();
    });

    // ===== RENDER DAT =====
    function renderDates(dates) {
        dateList.innerHTML = "";

        if (!dates.length) return;

        const maxVotes = Math.max(...dates.map(d => d.votes));

        dates.forEach(item => {
            const li = document.createElement("li");

            let label = item.date;
            if (item.votes === maxVotes && maxVotes > 0) label += " 👑";

            li.textContent = label;

            if (isAdmin) {
                const delBtn = document.createElement("button");
                delBtn.textContent = "Usuń";
                delBtn.onclick = async () => {
                    await fetch(`/api/admin/date/${item.id}/delete`, { method: "POST" });
                    fetchDates();
                };

                const confirmBtn = document.createElement("button");
                confirmBtn.textContent = "Zatwierdź";
                confirmBtn.onclick = async () => {
                    await fetch(`/api/admin/date/${item.id}/confirm`, { method: "POST" });
                    fetchDates();
                };

                li.appendChild(confirmBtn);
                li.appendChild(delBtn);
            } else {
                const voteBtn = document.createElement("button");

                if (!isPlayerRegistered) {
                    voteBtn.textContent = "Podaj imię";
                    voteBtn.disabled = true;
                } else if (votedDates.includes(item.date)) {
                    voteBtn.textContent = `Oddano (${item.votes})`;
                    voteBtn.disabled = true;
                } else {
                    voteBtn.textContent = `Głosuj (${item.votes})`;
                    voteBtn.onclick = async () => {
                        await fetch("/api/vote", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ date: item.date, playerId })
                        });
                        votedDates.push(item.date);
                        fetchDates();
                    };
                }

                li.appendChild(voteBtn);
            }

            dateList.appendChild(li);
        });
    }

    // ===== ADMIN =====
    adminBtn.addEventListener("click", () => {
        adminModal.style.display = "flex";
    });

    adminLoginBtn.addEventListener("click", async () => {
        const pin = adminPinInput.value.trim();
        const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin })
        });

        if (!res.ok) {
            alert("Zły PIN");
            return;
        }

        isAdmin = true;
        localStorage.setItem("isAdmin", "true");
        adminModal.style.display = "none";
        fetchDates();
    });

    logoutAdminBtn.addEventListener("click", () => {
        isAdmin = false;
        localStorage.setItem("isAdmin", "false");
        fetchDates();
    });

    fetchDates();
});
