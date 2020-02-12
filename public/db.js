let db;

// Request version 1 of the database
const request = indexedDB.open("budget", 1);

// This event handles the event whereby a new version of the
// database needs to be created. Either one has not been created
// before, or a new version number has been submitted via the
// indexedDB.open line above.
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  // Check if the app is online before reading from the db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (errorEvent) {
  console.log("Error loading database. " + errorEvent.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");

  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // Delete records if successful
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);