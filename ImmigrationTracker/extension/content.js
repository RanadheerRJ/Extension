// Update the API base URL to match your actual API endpoint 
const API_BASE = "https://glowing-chainsaw-746j76g94pxhp5qj-5050.app.github.dev/"; 

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

    // Create Main Panel
    panel = document.createElement("div");
    panel.id = "tv-tracker-panel";
    panel.classList.add("collapsed"); 
    panel.innerHTML = `
        <div id="tv-tracker-header">
            <span>FILE TRACKER</span>
            <button id="tv-collapse-btn">×</button>
        </div>
        <div id="tv-tracker-content"></div>
    `;
    document.body.appendChild(panel);

    // Create Trigger Tab (The "Tesla" handle)
    const trigger = document.createElement("div");
    trigger.id = "tv-tracker-trigger";
    trigger.innerText = "TRACKER";
    document.body.appendChild(trigger);

    // Event Listeners
    trigger.onclick = () => panel.classList.remove("collapsed");
    panel.querySelector("#tv-collapse-btn").onclick = () => panel.classList.add("collapsed");

    return panel;
}

async function renderData(data) {
    const contentDiv = document.querySelector("#tv-tracker-content");
    if (!contentDiv || !data) return;

    const locations = [
        { id: "Dock Station", label: "📥 Dock Station" },
        { id: "Paralegal Desk", label: "💻 Paralegal Desk" },
        { id: "Attorney Review", label: "⚖️ Attorney Review" },
        { id: "Supervisor Desk", label: "👔 Supervisor Desk" },
        { id: "Ready for Signature", label: "✍️ Ready" }
    ];

    contentDiv.innerHTML = `
        <div style="padding: 0 24px 24px 24px;">
            <div style="margin-bottom: 30px;">
                <p style="font-size: 11px; color: #5c5e62; margin-bottom: 4px;">CASE ID</p>
                <p style="font-size: 18px; font-weight: 500; color: #171a20; margin: 0;">${data.caseId}</p>
            </div>

            <div style="margin-bottom: 30px; padding: 16px; background: #f9f9f9; border-radius: 12px;">
                <p style="font-size: 11px; color: #5c5e62; margin-bottom: 4px;">CURRENT LOCATION</p>
                <p style="font-size: 14px; font-weight: 600; color: #3d69e1; margin: 0;">${data.currentLocation}</p>
            </div>

            <p style="font-size: 11px; color: #5c5e62; margin-bottom: 15px; font-weight: 600;">CHANGE STATUS</p>
            <div class="tv-btn-group" style="padding: 0;">
                ${locations.map(loc => `
                    <button class="tv-btn ${data.currentLocation === loc.id ? 'active-loc' : ''}" data-status="${loc.id}">
                        ${loc.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    contentDiv.querySelectorAll(".tv-btn").forEach(btn => {
        btn.onclick = async () => {
            const status = btn.getAttribute("data-status");
            btn.innerText = "Updating...";
            const updated = await updateStatus(data.caseId, status);
            if (updated) renderData(updated);
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