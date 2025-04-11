document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const noteList = document.getElementById("note-list");
  const noteTitle = document.getElementById("note-title");
  const noteContent = document.getElementById("note-content");
  const newNoteBtn = document.getElementById("new-note-btn");
  const deleteNoteBtn = document.getElementById("delete-note-btn");
  const setAlarmBtn = document.getElementById("set-alarm-btn");
  const alarmTime = document.getElementById("alarm-time");
  const currentTimeDisplay = document.getElementById("current-time");
  const alarmSound = document.getElementById("alarm-sound");
  const alarmModal = document.getElementById("alarm-modal");
  const alarmMessage = document.getElementById("alarm-message");
  const dismissAlarmBtn = document.getElementById("dismiss-alarm-btn");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const textColorPicker = document.getElementById("text-color");

  // App State
  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  let currentNoteId = null;
  let alarms = JSON.parse(localStorage.getItem("alarms")) || [];

  // Initialize the app
  function init() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    renderNoteList();
    checkAlarms();
    setInterval(checkAlarms, 1000);

    if (notes.length > 0) {
      loadNote(notes[0].id);
    } else {
      createNewNote();
    }
  }

  // Update current time display
  function updateTimeDisplay() {
    const now = new Date();
    currentTimeDisplay.textContent =
      now.toLocaleTimeString() + " " + now.toLocaleDateString();
  }

  // Create a new note
  function createNewNote() {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alarm: null,
    };

    notes.push(newNote);
    saveNotes();
    renderNoteList();
    loadNote(newNote.id);
  }

  // Load a note into the editor
  function loadNote(noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    currentNoteId = noteId;
    noteTitle.value = note.title;
    noteContent.innerHTML = note.content;

    // Update active state in note list
    document.querySelectorAll(".note-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.id === noteId);
    });

    // Set alarm time if exists
    if (note.alarm) {
      const alarmDate = new Date(note.alarm);
      const localDateTime = new Date(
        alarmDate.getTime() - alarmDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      alarmTime.value = localDateTime;
    } else {
      alarmTime.value = "";
    }
  }

  // Save the current note
  function saveCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex((n) => n.id === currentNoteId);
    if (noteIndex === -1) return;

    notes[noteIndex] = {
      ...notes[noteIndex],
      title: noteTitle.value,
      content: noteContent.innerHTML,
      updatedAt: new Date().toISOString(),
    };

    saveNotes();
    renderNoteList();
  }

  // Delete the current note
  function deleteCurrentNote() {
    if (!currentNoteId) return;

    // Remove any associated alarm
    const alarmIndex = alarms.findIndex((a) => a.noteId === currentNoteId);
    if (alarmIndex !== -1) {
      alarms.splice(alarmIndex, 1);
      saveAlarms();
    }

    // Remove the note
    notes = notes.filter((n) => n.id !== currentNoteId);
    saveNotes();

    if (notes.length > 0) {
      loadNote(notes[0].id);
    } else {
      createNewNote();
    }
  }

  // Set alarm for current note
  function setAlarmForCurrentNote() {
    if (!currentNoteId || !alarmTime.value) return;

    const alarmDateTime = new Date(alarmTime.value);
    const now = new Date();

    if (alarmDateTime <= now) {
      alert("Please select a future time for the alarm.");
      return;
    }

    // Remove any existing alarm for this note
    alarms = alarms.filter((a) => a.noteId !== currentNoteId);

    // Add new alarm
    const alarm = {
      noteId: currentNoteId,
      triggerTime: alarmDateTime.toISOString(),
      noteTitle: noteTitle.value,
    };

    alarms.push(alarm);
    saveAlarms();

    // Update note with alarm reference
    const noteIndex = notes.findIndex((n) => n.id === currentNoteId);
    if (noteIndex !== -1) {
      notes[noteIndex].alarm = alarmDateTime.toISOString();
      saveNotes();
      renderNoteList();
    }

    alert(`Alarm set for ${alarmDateTime.toLocaleString()}`);
  }

  // Check for alarms that need to trigger
  function checkAlarms() {
    const now = new Date();
    const alarmsToTrigger = alarms.filter(
      (a) => new Date(a.triggerTime) <= now
    );

    if (alarmsToTrigger.length > 0) {
      triggerAlarm(alarmsToTrigger[0]);
    }
  }

  // Trigger an alarm
  function triggerAlarm(alarm) {
    // Play sound
    alarmSound.currentTime = 0;
    alarmSound.play();

    // Show modal
    alarmMessage.textContent = `Alarm for note: "${alarm.noteTitle}"`;
    alarmModal.style.display = "flex";

    // Remove the alarm
    alarms = alarms.filter((a) => a.noteId !== alarm.noteId);
    saveAlarms();

    // Remove alarm reference from note
    const noteIndex = notes.findIndex((n) => n.id === alarm.noteId);
    if (noteIndex !== -1) {
      notes[noteIndex].alarm = null;
      saveNotes();
      renderNoteList();
    }
  }

  // Dismiss the alarm
  function dismissAlarm() {
    alarmSound.pause();
    alarmModal.style.display = "none";
  }

  // Render the note list
  function renderNoteList() {
    noteList.innerHTML = "";

    // Sort notes by updated time (newest first)
    const sortedNotes = [...notes].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    sortedNotes.forEach((note) => {
      const noteItem = document.createElement("div");
      noteItem.className = `note-item ${
        note.id === currentNoteId ? "active" : ""
      }`;
      noteItem.dataset.id = note.id;
      noteItem.textContent = note.title;

      if (note.alarm) {
        const alarmIcon = document.createElement("i");
        alarmIcon.className = "fas fa-bell";
        alarmIcon.style.marginLeft = "5px";
        alarmIcon.style.color = "var(--accent-color)";
        noteItem.appendChild(alarmIcon);
      }

      noteItem.addEventListener("click", () => loadNote(note.id));
      noteList.appendChild(noteItem);
    });
  }

  // Save notes to localStorage
  function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  // Save alarms to localStorage
  function saveAlarms() {
    localStorage.setItem("alarms", JSON.stringify(alarms));
  }

  // Format text in the editor
  function formatText(command, value = null) {
    document.execCommand(command, false, value);
    noteContent.focus();
  }

  // Event Listeners
  newNoteBtn.addEventListener("click", createNewNote);
  deleteNoteBtn.addEventListener("click", deleteCurrentNote);
  setAlarmBtn.addEventListener("click", setAlarmForCurrentNote);
  dismissAlarmBtn.addEventListener("click", dismissAlarm);

  noteTitle.addEventListener("input", saveCurrentNote);
  noteContent.addEventListener("input", saveCurrentNote);

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      formatText(button.dataset.command);
    });
  });

  textColorPicker.addEventListener("input", (e) => {
    formatText("foreColor", e.target.value);
  });

  // Initialize the app
  init();
});
