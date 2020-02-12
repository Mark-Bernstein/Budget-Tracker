let transactions = [];
let myChart;

fetch("/api/transaction")
    .then(response => response.json())
    .then(data => {
        // Save the db data on a global variable
        transactions = data;
        populateTotal();
        populateTable();
        populateChart();
    });

function populateTotal() {
    // Combine the transactions into a single total value
    let total = transactions.reduce((total, t) => {
        return total + parseInt(t.value);
    }, 0);

    let totalEl = document.querySelector("#total");
    totalEl.textContent = total;
}

function populateTable() {
    const tbody = document.querySelector("#tbody");
    tbody.innerHTML = "";

    transactions.forEach(transaction => {
        // Create and populate a table row
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${transaction.name}</td>
            <td>${transaction.value}</td>
        `;
        tbody.appendChild(tr);
    });
}

function populateChart() {
    // Copy the 'transactions' array, then reverse it
    const reversed = transactions.slice().reverse();

    // Create date labels for the chart
    const labels = reversed.map(t => {
        const date = new Date(t.date);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });

    // Create incremental values for the chart
    const data = reversed.map(t => {
        let sum = 0;
        sum += parseInt(t.value);
        return sum;
    });

    // Remove old chart if it already exists
    if (myChart) {
        myChart.destroy();
    }

    const ctx = document.getElementById("myChart").getContext("2d");

    myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Total Over Time",
                    fill: true,
                    backgroundColor: "#6666ff",
                    data
                }
            ]
        }
    });
}

function sendTransaction(isAdding) {
    const nameEl = document.querySelector("#transaction-name");
    const amountEl = document.querySelector("#transaction-amount");
    const errorEl = document.querySelector(".error");

    // Make sure user inputs data for both the name and amount of the transaction
    if (nameEl.value === "" || amountEl.value === "") {
        errorEl.textContent = "Name of Transaction and Transaction Amount must both be entered.";
        return;
    }

    // Creates the record
    const transaction = {
        name: nameEl.value,
        value: amountEl.value,
        date: new Date().toISOString()
    };

    // If subtracting funds, convert the amount to a negative number
    if (!isAdding) {
        transaction.value *= -1;
    }

    // Add to the beginning of the current array of data
    transactions.unshift(transaction);

    // Re-call the functions to repopulate the User Interface with the new record
    populateChart();
    populateTable();
    populateTotal();

    // Now send data to the server again
    fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.errors) {
                errorEl.textContent = "Name of Transaction and Transaction Amount must both be entered.";
            } else {
                // Clear the form
                nameEl.value = "";
                amountEl.value = "";
            }
        })
        .catch(err => {
            // Here is where if the (POST) fetch failed --> save in indexed db
            saveRecord(transaction);

            // Clear the form
            nameEl.value = "";
            amountEl.value = "";
        });
}

document.querySelector("#add-btn").addEventListener("click", function (event) {
    event.preventDefault();
    sendTransaction(true);
});

document.querySelector("#sub-btn").addEventListener("click", function (event) {
    event.preventDefault();
    sendTransaction(false);
});