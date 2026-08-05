document.getElementById("save").onclick = () => {

    document.getElementById("error").style.display = "none";
    let handles = document
        .getElementById("handles")
        .value
        .split(",")
        .map(x => x.trim())
        .filter(x => x.length > 0);

    if (handles.length === 0) {
        alert("Please enter at least one Codeforces handle");
        return;
    }

    let saveBtn = document.getElementById("save");
    saveBtn.disabled = true;
    saveBtn.innerText = "Searching...";
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").innerHTML = "";

    let limit = document
        .getElementById("limit")
        .value;

    let filters = {
        div1: document.getElementById("div1").checked,
        div2: document.getElementById("div2").checked,
        div12: document.getElementById("div12").checked,
        div3: document.getElementById("div3").checked,
        div4: document.getElementById("div4").checked,
        edu: document.getElementById("edu").checked,
        global: document.getElementById("global").checked
    };



    chrome.storage.local.set(
        {
            handles,
            limit,
            filters
        },
        () => {

            chrome.storage.local.remove("error");
            console.log("Saved:", handles, limit);
            chrome.tabs.query(
                {
                    active: true,
                    currentWindow: true
                },
                (tabs) => {

                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        {
                            action: "filter"
                        }
                    ).catch((err) => { console.log("Content script not available on this page") });

                }
            );

        }
    );

};

document.getElementById("themeToggle").onclick = () => {

    document.body.classList.toggle("light");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("light")
            ? "light"
            : "dark"
    );

};

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}


function showResults() {

    let saveBtn = document.getElementById("save");
    document.getElementById("loading").style.display = "none";
    saveBtn.disabled = false;
    saveBtn.innerText = "Save & Filter";
    chrome.storage.local.get(["results"], (data) => {

        let output = document.getElementById("results");
        let count = document.getElementById("count");
        output.innerHTML = "";

        if (!data.results || data.results.length === 0) {
            count.innerText = "Found 0 contests";
            output.innerHTML = "No contests found";
            return;
        }
        count.innerText = `Found ${data.results.length} contests`;

        for (let contest of data.results) {

            let div = document.createElement("div");
            div.className = "contest";

            div.innerHTML = `
    <h4>
        <a href="https://codeforces.com/contest/${contest.id}" target="_blank">
            ${contest.name}
        </a>
    </h4>
    <p>${contest.users.join("<br>")}</p>
    <hr>
`;

            output.appendChild(div);
        }

    });
}
chrome.storage.local.get(["results"], (data) => {
    if (data.results) {
        showResults();
    }
});


function showError(message) {

    document.getElementById("loading").style.display = "none";

    let saveBtn = document.getElementById("save");
    saveBtn.disabled = false;
    saveBtn.innerText = "Save & Filter";

    let error = document.getElementById("error");
    error.innerText = message;
    error.style.display = "block";
}

chrome.runtime.onMessage.addListener((message) => {

    if (message.action === "showError") {

        chrome.storage.local.get(["error"], (data) => {
            showError(data.error);
        });

    }

});

chrome.storage.onChanged.addListener((changes) => {

    if (changes.results) {
        showResults();
    }

});