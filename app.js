// ================= CONFIGURATION =================
const API_URL = "https://script.google.com/macros/s/AKfycbzavFa087rlF20emsl7RrzTzNjhxS-tw9p3pSMeO3E0OFIwsxZ90BtSpUym1r1PxKVs4g/exec";

// ================= 1. AUTHENTICATION CHECK =================
(function authCheck() {
    const isLoggedIn = localStorage.getItem("loggedIn");
    const isLoginPage = window.location.pathname.includes("login.html");

    if (!isLoggedIn && !isLoginPage) {
        window.location.href = "login.html";
    } else if (isLoggedIn && isLoginPage) {
        window.location.href = "index.html";
    }
})();

// ================= 2. LOGIN & LOGOUT =================
async function login(e) {
    if (e) e.preventDefault();
    
    const userField = document.getElementById("username");
    const passField = document.getElementById("password");
    const btn = document.getElementById("loginBtn");

    if (!userField || !passField || !btn) return;

    const user = userField.value;
    const pass = passField.value;

    btn.innerText = "Checking...";
    btn.disabled = true;

    try {
        const res = await fetch(API_URL + "?action=login", {
            method: "POST",
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const result = await res.json();

        if (result.success) {
            localStorage.setItem("loggedIn", "true");
            window.location.href = "index.html";
        } else {
            alert(result.message || "Invalid Credentials");
        }
    } catch (err) {
        alert("Server Error! Please try again.");
        console.error(err);
    } finally {
        btn.innerText = "Login";
        btn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("editData");
    window.location.href = "login.html";
}

// ================= 3. GLOBAL STATE =================
let allStudents = [];
let currentSearch = "";
let currentGroup = "";

// ================= 4. DATA LOADING =================
async function loadStudents() {
    const tableBody = document.getElementById("studentTable");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8">Loading data...</td></tr>`;

    try {
        const res = await fetch(API_URL + "?action=read");
        allStudents = await res.json();
        applyFilters();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-danger">Failed to load data</td></tr>`;
        console.error(err);
    }
}

// ================= 5. DISPLAY & FILTER =================
function displayStudents(data) {
    const table = document.getElementById("studentTable");
    if (!table) return;

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="8">No Student Found</td></tr>`;
        return;
    }

    data.forEach(s => {
        let formattedDate = "";
        if (s.DOB) {
            const d = new Date(s.DOB);
            formattedDate = d.toLocaleDateString('en-GB').replace(/\//g, '-');
        }

        table.innerHTML += `
            <tr>
                <td>${s.Sl || ""}</td>
                <td>${s.ID || ""}</td>
                <td>${s.NewRoll || ""}</td>
                <td class="text-start">${s.NameInBangla || ""}<br><small class="text-muted">${s.FathersNameBangla || ""}<br>${s.MothersNameBangla || ""}</small></td>
                <td class="text-start">${s.NameInEnglish || ""}<br><small class="text-muted">${s.FathersNameEnglish || ""}<br>${s.MothersNameEnglish || ""}</small></td>
                <td>${s.Religion || ""}<br>${s.Group || ""}<br>${s.FourthSubject || ""}</td>
                <td>${formattedDate}<br>${s.Phone || ""}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick='editStudent(${JSON.stringify(s)})'>Edit</button>
                </td>
            </tr>
        `;
    });
}

function applyFilters() {
    let filtered = allStudents.filter(s => {
        const nameMatch = String(s.NameInEnglish || "").toLowerCase().includes(currentSearch);
        const idMatch = String(s.ID || "").toLowerCase().includes(currentSearch);
        const groupMatch = currentGroup === "" || s.Group === currentGroup;
        return (nameMatch || idMatch) && groupMatch;
    });
    displayStudents(filtered);
}

// ================= 6. FORM SYSTEM (ADD/EDIT) =================
function setupForm() {
    const form = document.getElementById("studentForm");
    if (!form) return;

    const editData = JSON.parse(localStorage.getItem("editData"));
    const formTitle = document.getElementById("formTitle");

    if (editData) {
        if (formTitle) formTitle.innerText = "Update Student Information";
        
        Object.keys(editData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (key === "DOB" && editData[key]) {
                    field.value = new Date(editData[key]).toISOString().split('T')[0];
                } else {
                    field.value = editData[key];
                }
            }
        });

        const readOnlyFields = ["Sl", "ID", "NewRoll"];
        readOnlyFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.readOnly = true;
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const submitBtn = form.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Saving...";

        const action = editData ? "update" : "create";
        const formData = {};
        
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.id) formData[el.id] = el.value;
        }

        try {
            const res = await fetch(API_URL + "?action=" + action, {
                method: "POST",
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (result.success) {
                alert(action === "create" ? "Student Added Successfully!" : "Student Updated!");
                localStorage.removeItem("editData");
                window.location.href = "index.html";
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            alert("Failed to save data!");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Save Student";
        }
    });
}

// ================= 7. NAVIGATION & EVENTS =================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("studentTable")) {
        loadStudents();
        
        document.getElementById("searchInput")?.addEventListener("input", (e) => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        });

        document.getElementById("groupFilter")?.addEventListener("change", (e) => {
            currentGroup = e.target.value;
            applyFilters();
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }

    setupForm();
});

function goToAdd() {
    localStorage.removeItem("editData");
    window.location.href = "form.html";
}

function editStudent(student) {
    localStorage.setItem("editData", JSON.stringify(student));
    window.location.href = "form.html";
}

function goBack() {
    localStorage.removeItem("editData");
    window.location.href = "index.html";
}
