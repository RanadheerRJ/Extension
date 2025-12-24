const API_BASE = "https://glowing-chainsaw-746j76g94pxhp5qj-5050.app.github.dev"; 

function extractCaseNumber() {
    const labels = document.querySelectorAll('div, span, label');
    for (let el of labels) {
        if (el.innerText.trim() === "Case No") {
            const rawText = el.parentElement.innerText
                .replace("Case No", "")
                .replace("arrow_drop_down", "")
                .replace(/©.*/s, "")
                .trim();
            return rawText.split('\n')[0].trim();
        }
    }
    return null;
}

function createPanel() {
    let panel = document.getElementById("tv-tracker-panel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "tv-tracker-panel";
    panel.classList.add("collapsed"); // Start sleek and collapsed
    panel.innerHTML = `
        <div id="tv-tracker-header">
            <span style="font-size: 13px; letter-spacing: 0.5px;">🦅 FILE TRACKER</span>
            <button id="tv-collapse-btn">×</button>
        </div>
        <div id="tv-tracker-content"></div>
    `;
    document.body.appendChild(panel);

    // Expand on clicking the collapsed tab
    panel.onclick = (e) => {
        if (panel.classList.contains("collapsed")) {
            panel.classList.remove("collapsed");
        }
    };

    // Collapse only on clicking the X
    panel.querySelector("#tv-collapse-btn").onclick = (e) => {
        e.stopPropagation();
        panel.classList.add("collapsed");
    };

    return panel;
}

async function renderData(data) {
    const contentDiv = document.querySelector("#tv-tracker-content");
    if (!contentDiv || !data) return;

    const time = new Date(data.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    contentDiv.innerHTML = `
        <div style="padding: 10px 12px 12px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                <div>
                    <label style="font-size: 9px; color: #aaa; font-weight: 700; display: block; margin-bottom: 2px;">CASE NO</label>
                    <div style="font-size: 13px; font-weight: 700; color: #333;">${data.caseId}</div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 10px; color: #999;">${time}</span>
                </div>
            </div>

            <div style="background: #fff5f5; border: 1px solid #ffe3e3; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #d32f2f;">📍 ${data.currentLocation}</div>
            </div>

            <label style="font-size: 9px; color: #aaa; font-weight: 700; display: block; margin-bottom: 6px;">MOVE TO</label>
            <div class="tv-btn-group">
                <button class="tv-btn" data-status="Dock Station">📥 Dock Station</button>
                <button class="tv-btn" data-status="Paralegal Desk">💻 Paralegal Desk</button>
                <button class="tv-btn" data-status="Attorney Review">⚖️ Attorney Review</button>
                <button class="tv-btn" data-status="Supervisor Desk">👔 Supervisor Desk</button>
                <button class="tv-btn" data-status="Ready for Signature">✍️ Ready</button>
            </div>
        </div>
    `;

    // Re-bind click events
    contentDiv.querySelectorAll(".tv-btn").forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const status = btn.getAttribute("data-status");
            const originalText = btn.innerHTML;
            btn.innerHTML = `<span style="opacity:0.5">Saving...</span>`;
            const updated = await updateStatus(data.caseId, status);
            if (updated) renderData(updated);
            else btn.innerHTML = originalText;
        };
    });
}

async function runTracker() {
    const caseId = extractCaseNumber();
    const panel = createPanel();

    if (!caseId) {
        if (!window.location.href.includes("petition-details")) {
            panel.style.display = "none";
        }
        return;
    }

    panel.style.display = "flex";
    
    if (panel.getAttribute("data-current-case") !== caseId) {
        panel.setAttribute("data-current-case", caseId);
        const data = await fetchCaseStatus(caseId);
        if (data) renderData(data);
    }
}

async function fetchCaseStatus(id) { 
    try { 
        const r = await fetch(`${API_BASE}/case/${encodeURIComponent(id)}`); 
        return await r.json(); 
    } catch(e) { return null; } 
}

async function updateStatus(id, status) {
    try { 
        const r = await fetch(`${API_BASE}/case/${encodeURIComponent(id)}/status`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ status })
        });
        return await r.json();
    } catch(e) { return null; }
}

setInterval(runTracker, 2000);
runTracker();