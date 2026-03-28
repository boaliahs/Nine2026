const API_URL = "https://script.google.com/macros/s/AKfycbzavFa087rlF20emsl7RrzTzNjhxS-tw9p3pSMeO3E0OFIwsxZ90BtSpUym1r1PxKVs4g/exec";


// ================= LOGIN CHECK =================
if (!localStorage.getItem("loggedIn") && location.pathname.includes("index")) {
    window.location.href = "login.html";
}

// ================= LOGIN =================
async function login(e) {
    if (e) e.preventDefault();
    
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");

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
            window.location.href = "index.html"; // লগইন সফল হলে ড্যাশবোর্ডে যাবে
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Failed to connect to server!");
    } finally {
        btn.innerText = "Login";
        btn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}


// ================= GLOBAL STATE =================
let allStudents = [];
let currentSearch = "";
let currentGroup = "";


// ================= LOAD STUDENTS =================
async function loadStudents() {
    try {
        const res = await fetch(API_URL + "?action=read");
        allStudents = await res.json();
        applyFilters();
    } catch (err) {
        alert("Failed to load data");
        console.error(err);
    }
}


// ================= DISPLAY TABLE =================
function displayStudents(data) {
    const table = document.getElementById("studentTable");
    if (!table) return;

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="6">No Data Found</td></tr>`;
        return;
    }

    data.forEach(s => {
        table.innerHTML += `
      <tr>
        <td>${s.Sl || ""}</td>
        <td>${s.ID || ""}</td>
        <td>${s.NewRoll || ""}</td>
        <td>${s.NameInBangla || ""} <br> ${s.FathersNameBangla || ""} <br> ${s.MothersNameBangla || ""}</td>
        <td>${s.NameInEnglish || ""} <br> ${s.FathersNameEnglish || ""} <br> ${s.MothersNameEnglish || ""}</td>
        <td>${s.Religion || ""} <br> ${s.Group || ""} <br> ${s.FourthSubject || ""}</td>
        <td >${s.DOB ? new Date(s.DOB).toLocaleDateString('en-GB').replace(/\//g, '-') : ""} <br> ${s.Phone || ""}</td>
        <td>
          <button class="btn btn-sm btn-warning"
            onclick='editStudent(${JSON.stringify(s)})'>
            Edit
          </button>
        </td>
      </tr>
    `;
    });
}


// ================= FILTER =================
function applyFilters() {
    let filtered = [...allStudents];

    if (currentSearch) {
        filtered = filtered.filter(s =>
            String(s.NameInEnglish || "").toLowerCase().includes(currentSearch) ||
            String(s.ID || "").toLowerCase().includes(currentSearch)
        );
    }

    if (currentGroup) {
        filtered = filtered.filter(s => s.Group === currentGroup);
    }

    displayStudents(filtered);
}


// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("studentTable")) {
        loadStudents();
    }

    const searchBox = document.getElementById("searchInput");
    if (searchBox) {
        searchBox.addEventListener("input", function () {
            currentSearch = this.value.toLowerCase();
            applyFilters();
        });
    }

    const groupBox = document.getElementById("groupFilter");
    if (groupBox) {
        groupBox.addEventListener("change", function () {
            currentGroup = this.value;
            applyFilters();
        });
    }

    setupForm();
});


// ================= FORM SYSTEM =================
function setupForm() {

    const form = document.getElementById("studentForm");
    if (!form) return;

    const editData = JSON.parse(localStorage.getItem("editData"));

    if (editData) {
        document.getElementById("formTitle").innerText = "Update Student";

        Object.keys(editData).forEach(key => {
            const field = document.getElementById(key);
            if (!field) return;

            if (key === "DOB" && editData[key]) {
                // Convert to yyyy-mm-dd
                const d = new Date(editData[key]);
                const formatted =
                    d.getFullYear() +
                    "-" +
                    String(d.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(d.getDate()).padStart(2, "0");

                field.value = formatted;
            } else {
                field.value = editData[key];
            }
        });
        document.getElementById("Sl").readOnly = true;
        document.getElementById("ID").readOnly = true;
        document.getElementById("OldRoll").readOnly = true;
        document.getElementById("NewRoll").readOnly = true;

    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const action = editData ? "update" : "create";

        const data = {
            Sl: document.getElementById("Sl").value,
            ID: document.getElementById("ID").value,
            OldRoll: document.getElementById("OldRoll").value,
            NewRoll: document.getElementById("NewRoll").value,
            NameInBangla: document.getElementById("NameInBangla").value,
            NameInEnglish: document.getElementById("NameInEnglish").value,
            FathersNameBangla: document.getElementById("FathersNameBangla").value,
            FathersNameEnglish: document.getElementById("FathersNameEnglish").value,
            MothersNameBangla: document.getElementById("MothersNameBangla").value,
            MothersNameEnglish: document.getElementById("MothersNameEnglish").value,
            Religion: document.getElementById("Religion").value,
            DOB: document.getElementById("DOB").value,
            Group: document.getElementById("Group").value,
            FourthSubject: document.getElementById("FourthSubject").value,
            Phone: document.getElementById("Phone").value
        };

        try {
            // 🔥 CORS SAFE REQUEST (NO HEADERS)
            const res = await fetch(API_URL + "?action=" + action, {
                method: "POST",
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.success) {
                alert(action === "create" ? "Student Added!" : "Student Updated!");
                localStorage.removeItem("editData");
                window.location.href = "index.html";
            } else {
                alert(result.message || "Something went wrong!");
            }

        } catch (err) {
            alert("Failed to save data!");
            console.error(err);
        }

    });
}


// ================= NAVIGATION =================
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
