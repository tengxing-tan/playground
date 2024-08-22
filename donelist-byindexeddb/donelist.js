(function () {
  let db;
  const TASKLIST = "tasklist";

  document.addEventListener("DOMContentLoaded", (e) => {
    const dbRequest = initIndexedDB();
    dbRequest.onsuccess = () => {
      db = dbRequest.result;
      getTasks(appendToTaskList);
    };

    document.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        taskid: Date.now(),
        title: document.querySelector("#taskTitle").value,
        isDone: false,
      };
      createTask(data).onsuccess = () => {
        appendToTaskList(data);
        clearForm();
      };
    });
  });

  function initIndexedDB() {
    // Step: open db request, error? if no structure (upgrade)? success?
    const request = window.indexedDB.open("DoneListDB", 1);

    request.onerror = (event) => {
      console.error("Handle error!");
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

    return request;
  }

  function getTasks(handleRetrievedTask) {
    db
      .transaction(TASKLIST, "readonly")
      .objectStore(TASKLIST)
      .openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        return;
      }

      handleRetrievedTask(cursor.value);
      cursor.continue();
    };
  }

  function createTask(data) {
    return db
      .transaction(TASKLIST, "readwrite")
      .objectStore(TASKLIST)
      .add(data);
  }

  function deleteTask(event) {
    const taskid = Number(event.target.getAttribute("data-task"));

    const delReq = db
      .transaction(TASKLIST, "readwrite")
      .objectStore(TASKLIST)
      .delete(taskid);
    delReq.onsuccess = () => {
      document.querySelector("#tasklist").removeChild(event.target.parentNode);
    };
  }

  function markDone(event) {
    const dataTask = event.target.getAttribute("data-task");

    const objectStore = db
      .transaction(TASKLIST, "readwrite")
      .objectStore(TASKLIST);

    objectStore.get(Number(dataTask)).onsuccess = (succEvent) => {
      const updated = succEvent.target.result;
      updated.isDone = !updated.isDone;
      objectStore.put(updated);

      event.target.classList.toggle("done-task");
    };
  }

  function appendToTaskList(data) {
    const taskEl = document.createElement("li");
    const taskTitle = document.createElement("p");
    taskTitle.textContent = data.title;
    taskEl.appendChild(taskTitle);

    const taskButtons = initActionButtons([
      {
        classList: "removeBtn ",
        taskid: data.taskid,
        click: deleteTask,
      },
      {
        classList: "doneBtn " + (data.isDone && "done-task"),
        taskid: data.taskid,
        click: markDone,
      },
    ]);

    taskButtons.forEach((button) => taskEl.appendChild(button));
    document.querySelector("#tasklist").appendChild(taskEl);
  }

  function initActionButtons(props) {
    return props.map((prop) => {
      const button = document.createElement("button");
      button.classList = prop.classList;
      button.setAttribute("data-task", prop.taskid);
      button.addEventListener("click", (e) => prop.click(e));
      return button;
    });
  }

  function clearForm() {
    document.querySelectorAll("input").forEach((el) => (el.value = ""));
  }
})();
