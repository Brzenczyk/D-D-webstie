document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTY
    const playerNameInput = document.getElementById("playerName");
    const playerEmailInput = document.getElementById("playerEmail");
    const playerEmojiSelect = document.getElementById("playerEmoji");
    const saveNameBtn = document.getElementById("saveName");
    const welcomeText = document.getElementById("welcome");
    const playerSelect = document.getElementById("playerSelect");
    const dateInput = document.getElementById("dateInput");
    const addDateBtn = document.getElementById("addDate");
    const dateList = document.getElementById("dateList");

    // ADMIN
    const adminBtn = document.getElementById("adminBtn");
    const adminModal = document.getElementById("adminModal");
    const closeModal = document.getElementById("closeModal");
    const loginAdminBtn = document.getElementById("loginAdminBtn");
    const adminPinInput = document.getElementById("adminPinInput");
    const adminError = document.getElementById("adminError");
    const logoutAdminBtn = document.getElementById("logoutAdminBtn");

    // ZMIENNE
    let playerId = localStorage.getItem("playerId") || crypto.randomUUID();
    localStorage.setItem("playerId", playerId);
    let playerName = localStorage.getItem("playerName") || "";
    let isPlayerRegistered = !!playerName;
    let isAdmin = localStorage.getItem("isAdmin") === "true";
    let votedDates = [];

    if (isPlayerRegistered) welcomeText.textContent = `Witaj, ${playerName}!`;

    // ===== REJESTRACJA GRACZA =====
    saveNameBtn.addEventListener("click", async () => {
        const name = playerNameInput.value.trim();
        const email = playerEmailInput.value.trim() || null;
        const emoji = playerEmojiSelect.value || "🧙";

        if (!name) return alert("Podaj imię!");

        // sprawdzamy czy gracz już istnieje
        const players = await (await fetch("/api/players")).json();
        let existing = players.find(p => p.name === name && p.emoji === emoji);
        if (existing) playerId = existing.id;
        else playerId = crypto.randomUUID();

        playerName = name;
        isPlayerRegistered = true;
        localStorage.setItem("playerId", playerId);
        localStorage.setItem("playerName", playerName);

        welcomeText.textContent = `Witaj, ${playerName}!`;
        playerNameInput.value = "";
        playerEmailInput.value = "";

        await fetch("/api/players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: playerId, name, email, emoji })
        });

        await fetchPlayers();
        playerSelect.value = playerId;
        await fetchVotes();
        fetchDates();
    });

    // ===== ZMIANA AKTYWNEGO GRACZA =====
    playerSelect.addEventListener("change", async () => {
        playerId = playerSelect.value;
        localStorage.setItem("playerId", playerId);
        isAdmin = false;
        localStorage.setItem("isAdmin", "false");

        const players = await (await fetch("/api/players")).json();
        const p = players.find(p => p.id === playerId);
        if (p) {
            playerName = p.name;
            localStorage.setItem("playerName", playerName);
            welcomeText.textContent = `Witaj, ${playerName}!`;
            isPlayerRegistered = true;
            await fetchVotes();
            fetchDates();
        }
    });

    // ===== ADMIN MODAL =====
    adminBtn.addEventListener("click", () => adminModal.style.display = "flex");
    closeModal.addEventListener("click", () => adminModal.style.display = "none");
    window.addEventListener("click", (e) => { if(e.target==adminModal) adminModal.style.display="none"; });

    loginAdminBtn.addEventListener("click", () => {
        if(adminPinInput.value === localStorage.getItem("ADMIN_PIN") || adminPinInput.value === "1234") {
            isAdmin = true;
            localStorage.setItem("isAdmin","true");
            adminModal.style.display="none";
            alert("Zalogowano jako admin!");
            fetchDates();
        } else adminError.textContent = "Nieprawidłowy PIN!";
    });

    logoutAdminBtn.addEventListener("click", () => {
        isAdmin = false;
        localStorage.setItem("isAdmin","false");
        alert("Wylogowano z konta admina! ✅");
        fetchDates();
    });

    // ===== FUNKCJE =====

    // pobranie graczy
    async function fetchPlayers() {
        const players = await (await fetch("/api/players")).json();
        playerSelect.innerHTML = `<option value="">— wybierz gracza —</option>`;
        players.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.emoji} ${p.name}`;
            if (p.id === playerId) opt.selected = true;
            playerSelect.appendChild(opt);
        });
    }

    // pobranie głosów
    async function fetchVotes() {
        const res = await fetch(`/api/votes/${playerId}`);
        votedDates = await res.json();
    }

    // pobranie dat
    async function fetchDates() {
        const res = await fetch("/api/dates");
        const dates = await res.json();
        renderDates(dates);
    }

    // dodawanie dat
    addDateBtn.addEventListener("click", async () => {
        if(!isPlayerRegistered) return alert("Najpierw podaj imię!");
        if(!dateInput.value) return alert("Wybierz datę!");

        const res = await fetch("/api/dates", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ date: dateInput.value })
        });

        const data = await res.json();
        if(!res.ok) return alert(data.error || "Błąd");
        dateInput.value="";
        fetchDates();
    });

    // render dat
    async function renderDates(dates) {
        dateList.innerHTML="";
        const maxVotes = Math.max(...dates.map(d=>d.votes),0);
        const voteMap = await (await fetch("/api/date-votes")).json();

        dates.forEach(d => {
            const li = document.createElement("li");
            li.textContent = d.date + (d.is_confirmed?" ✅":"");
            if(d.votes>0 && d.votes===maxVotes) li.textContent+=" 👑";

            if(voteMap[d.date]){
                const voters = voteMap[d.date].map(v=>`${v.emoji} ${v.name}`).join(", ");
                const span = document.createElement("span");
                span.style.marginLeft="10px";
                span.style.fontSize="0.9em";
                span.textContent=`🗳️ ${voters}`;
                li.appendChild(span);
            }

            const btn = document.createElement("button");
            if(!isPlayerRegistered){ btn.textContent="Podaj imię"; btn.disabled=true; }
            else if(votedDates.includes(d.date)){ btn.textContent=`Oddano (${d.votes})`; btn.disabled=true; }
            else {
                btn.textContent=`Głosuj (${d.votes})`;
                btn.addEventListener("click", async ()=>{
                    const res = await fetch("/api/vote", {
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ date:d.date, playerId })
                    });
                    const data = await res.json();
                    if(!res.ok) return alert(data.error || "Błąd głosowania");
                    votedDates.push(d.date);
                    fetchDates();
                });
            }
            li.appendChild(btn);

            // ADMIN BUTTONS
            if(isAdmin){
                const delBtn = document.createElement("button");
                delBtn.textContent = "Usuń";
                delBtn.addEventListener("click", async ()=>{
                    await fetch(`/api/admin/date/${d.id}/delete`, {
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ pin:"1234" })
                    });
                    fetchDates();
                });
                li.appendChild(delBtn);

                const confBtn = document.createElement("button");
                confBtn.textContent = "Zatwierdź";
                confBtn.addEventListener("click", async ()=>{
                    await fetch(`/api/admin/date/${d.id}/confirm`, {
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ pin:"1234" })
                    });
                    fetchDates();
                });
                li.appendChild(confBtn);
            }

            dateList.appendChild(li);
        });
    }

    // START
    fetchPlayers();
    if(isPlayerRegistered) fetchVotes();
    fetchDates();
});
