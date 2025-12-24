// REMOVE the trailing slash from your URL
const API_BASE = "https://glowing-chainsaw-746j76g94pxhp5qj-5050.app.github.dev"; 

function extractCaseNumber() {
    // 1. Regex search for NJ-JJ-XXXXXX pattern
    const bodyText = document.body.innerText;
    const casePattern = /[A-Z]{2}-[A-Z]{2}-\d{5,}/; 
    const match = bodyText.match(casePattern);
    if (match) return match[0];

    // 2. Targeted search for "Case No" labels
    const elements = document.querySelectorAll('div, span, td, b, strong');
    for (let el of elements) {
        if (el.innerText.includes("Case No")) {
            // Try to get text immediately after "Case No"
            let text = el.innerText.split(/Case No:?|Case No\.?/i)[1]?.trim();
            // If empty, check the next element in the DOM
            if (!text || text.length < 5) {
                text = el.nextElementSibling?.innerText.trim();
            }
            if (text && text.length > 5 && text.length < 25) return text;
        }
    }
    return null;
}

function createPanel() {
    let panel = document.getElementById("tv-tracker-panel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "tv-tracker-panel";
    panel.innerHTML = `
        <div id="tv-tracker-header">
            <span>File Tracker</span>
            <button id="tv-collapse-btn">−</button>
        </div>
        <div id="tv-tracker-content">
            <div style="padding:20px; text-align:center; font-size:12px;">🔍 Detecting Case...</div>
        </div>
    `;
    document.body.appendChild(panel);

    const collapseBtn = panel.querySelector("#tv-collapse-btn");
    collapseBtn.onclick = (e) => {
        e.stopPropagation();
        panel.classList.toggle("collapsed");
        collapseBtn.textContent = panel.classList.contains("collapsed") ? "+" : "−";
    };

    panel.onclick = () => {
        if (panel.classList.contains("collapsed")) {
            panel.classList.remove("collapsed");
            collapseBtn.textContent = "−";
        }
    };
    return panel;
}

async function renderData(data) {
    const contentDiv = document.querySelector("#tv-tracker-content");
    if (!contentDiv || !data) return;

    const dateStr = new Date(data.lastUpdated).toLocaleString();

    contentDiv.innerHTML = `
        <div style="padding: 12px;">
            <div style="margin-bottom:10px;">
                <label style="font-size:10px; color: #666; font-weight:bold; display:block; text-transform:uppercase;">Case Number</label>
                <div style="font-weight:bold; font-size:15px; color:#003366;">${data.caseId}</div>
            </div>
            
            <div style="margin-bottom:10px; background:#f0f7ff; padding:8px; border-radius:4px; border-left:4px solid #003366;">
                <label style="font-size:10px; color: #666; font-weight:bold; display:block;">CURRENT LOCATION</label>
                <div style="font-weight:bold; color:#c62828; font-size:13px;">📍 ${data.currentLocation}</div>
            </div>

            <div style="font-size:11px; color:#888; margin-bottom:10px;">Last Sync: ${dateStr}</div>

            <div style="border-top: 1px solid #eee; padding-top:10px;">
                <button class="tv-btn" data-status="Dock Station">📥 Dock Station</button>
                <button class="tv-btn" data-status="Paralegal Desk">💻 Paralegal Desk</button>
                <button class="tv-btn" data-status="Attorney Review">⚖️ Attorney Review</button>
                <button class="tv-btn" data-status="Supervisor Desk">👔 Supervisor Desk</button>
                <button class="tv-btn" data-status="Ready for Signature">✍️ Ready</button>
            </div>
        </div>
    `;

    contentDiv.querySelectorAll(".tv-btn").forEach(btn => {
        btn.onclick = async () => {
            const status = btn.getAttribute("data-status");
            btn.innerText = "Saving...";
            const updated = await updateStatus(data.caseId, status);
            if (updated) renderData(updated);
        };
    });
}

async function runTracker() {
    const caseId = extractCaseNumber();
    const panel = createPanel();

    if (!caseId) {
        // If we are on a different page, hide the panel
        if (!window.location.href.includes("petition-details")) {
            panel.style.display = "none";
        }
        return;
    }

    panel.style.display = "block";
    
    if (panel.getAttribute("data-current-case") !== caseId) {
        panel.setAttribute("data-current-case", caseId);
        document.querySelector("#tv-tracker-content").innerHTML = '<div style="padding:20px; text-align:center;">🔄 Loading...</div>';
        const data = await fetchCaseStatus(caseId);
        if (data) renderData(data);
    }
}

async function fetchCaseStatus(id) { 
    try { 
        const r = await fetch(`${API_BASE}/case/${encodeURIComponent(id)}`); 
        return await r.json(); 
    } catch(e) { 
        document.querySelector("#tv-tracker-content").innerHTML = '<div style="color:red; padding:10px;">Offline: Check Codespace Port</div>';
        return null; 
    } 
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

setInterval(runTracker, 2500);
runTracker();