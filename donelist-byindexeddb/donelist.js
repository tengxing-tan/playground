(function () {
  let db;
  const TASKLIST = "tasklist";

  document.addEventListener("DOMContentLoaded", (e) => {
    initIndexedDB();

    document.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      create();
    });
  });

  function initIndexedDB() {
    const request = window.indexedDB.open("DoneListDB", 1);

    request.onerror = (event) => {
      console.error("Handle error!");
    };

    request.onsuccess = () => {
      db = request.result;
      read();
    };

    request.onupgradeneeded = (event) => {
      const upgradedDB = event.target.result;
      const objectStore = upgradedDB.createObjectStore(TASKLIST, {
        keyPath: "taskid",
      });

      // Define what data items the objectStore will contain
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("isDone", "isDone", { unique: false });
    };
  }

  function read() {
    db
      .transaction(TASKLIST, "readonly")
      .objectStore(TASKLIST)
      .openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        console.log("end of list");
        return;
      }

      appendToTaskList(cursor.value);
      console.log(cursor.value);
      cursor.continue();
    };
  }

  function create() {
    const data = {
      taskid: Date.now(),
      title: document.querySelector("#taskTitle").value,
      isDone: false,
    };
    const store = db.transaction(TASKLIST, "readwrite").objectStore(TASKLIST);
    store.add(data).onsuccess = (event) => {
      appendToTaskList(data);
      clearForm();
    };
  }

  function deleteTask(event) {
    const dataTask = event.target.getAttribute("data-task");

    const transaction = db.transaction(TASKLIST, "readwrite");
    transaction.objectStore(TASKLIST).delete(Number(dataTask)).onsuccess =
      () => {
        document
          .querySelector("#tasklist")
          .removeChild(event.target.parentNode);
      };
  }

  function markDone(event) {
    const dataTask = event.target.getAttribute("data-task");

    const objectStore = db
      .transaction(TASKLIST, "readwrite")
      .objectStore(TASKLIST);
    objectStore.get(Number(dataTask)).onsuccess = (succEvent) => {
      const updated = succEvent.target.result;
      updated.isDone = toggle(updated.isDone);
      objectStore.put(updated);

      event.target.classList.toggle('done-task')
    };
  }

  function appendToTaskList(data) {
    const taskEl = document.createElement("li");
    const taskTitle = document.createElement("p");
    taskTitle.textContent = data.title;
    taskEl.appendChild(taskTitle);

    const removeBtn = document.createElement("button");
    removeBtn.classList = "removeBtn";
    removeBtn.setAttribute("data-task", data.taskid);
    removeBtn.addEventListener("click", deleteTask);
    taskEl.appendChild(removeBtn);

    const doneBtn = document.createElement("button");
    doneBtn.classList = "doneBtn " + (data.isDone && "done-task");
    doneBtn.setAttribute("data-task", data.taskid);
    doneBtn.addEventListener("click", markDone);
    taskEl.appendChild(doneBtn);

    document.querySelector("#tasklist").appendChild(taskEl);
  }

  function clearForm() {
    document.querySelectorAll("input").forEach((el) => (el.value = ""));
  }

  function toggle(value) {
    return !value;
  }
})();
