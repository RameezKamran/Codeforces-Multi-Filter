
console.log("CF Multi Filter loaded!");

chrome.storage.local.get(null, (data) => {
    console.log("Storage:", data);
});

chrome.runtime.onMessage.addListener((request) => {

    if (request.action === "filter") {

        chrome.storage.local.get(["handles", "limit", "filters"], async (data) => {
            let allUsers = {};

            for (let handle of data.handles) {


                let response = await fetch(
                    `https://codeforces.com/api/user.status?handle=${handle}`
                );


                let result = await response.json();
                if (result.status !== "OK") {

                    chrome.storage.local.set({
                        error: `Invalid handle: ${handle}`
                    });

                    chrome.runtime.sendMessage({
                        action: "showError"
                    });

                    return;
                }

                let solved = {};

                for (let sub of result.result) {

                    if (sub.verdict !== "OK") continue;

                    let contest = sub.contestId;
                    let problem = sub.problem.index;

                    if (!solved[contest])
                        solved[contest] = new Set();

                    solved[contest].add(problem);
                }

                let counts = {};

                for (let contest in solved) {
                    counts[contest] = solved[contest].size;
                }

                allUsers[handle] = counts;
            }

            let limit = Number(data.limit);

            let contestResponse = await fetch("https://codeforces.com/api/contest.list");
            let contests = await contestResponse.json();

            let filtered = [];

            contests.result.sort((a, b) => b.id - a.id);

            for (let contest of contests.result) {
                if (contest.phase !== "FINISHED")
                    continue;

                let name = contest.name;

                let allowed = false;

                if (data.filters.div12 && name.includes("Div. 1 + Div. 2"))
                    allowed = true;

                else if (data.filters.div1 && name.includes("Div. 1"))
                    allowed = true;

                else if (data.filters.div2 && name.includes("Div. 2"))
                    allowed = true;

                else if (data.filters.div3 && name.includes("Div. 3"))
                    allowed = true;

                else if (data.filters.div4 && name.includes("Div. 4"))
                    allowed = true;

                else if (data.filters.edu && name.includes("Educational"))
                    allowed = true;

                else if (data.filters.global && name.includes("Global"))
                    allowed = true;


                if (!allowed)
                    continue;

                let ok = true;


                for (let user in allUsers) {

                    let solved = allUsers[user][contest.id] || 0;

                    if (solved > limit) {
                        ok = false;
                        break;
                    }
                }

                if (ok) {
                    let s = [];

                    for (let user in allUsers) {
                        s.push(`${user}: ${allUsers[user][contest.id] || 0}`);
                    }
                    filtered.push({
                        id: contest.id,
                        name: contest.name,
                        users: s
                    });


                }
            }

            chrome.storage.local.set({
                results: filtered
            });
            console.log("Filtered contests:", filtered);
        });

    }

});