<script setup>
import { ref, computed, watchEffect } from "vue";
import {
  requestPermission,
  startSpeechRecognition,
  parseIndex,
} from "./handler";

const STORAGE_KEY = "vue-todomvc";

const filters = {
  all: (todos) => todos,
  active: (todos) => todos.filter((todo) => !todo.completed),
  completed: (todos) => todos.filter((todo) => todo.completed),
};

// state
const todos = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
const visibility = ref("all");
const editedTodo = ref();
const isSpeechPermissionGranted = ref(false);
const voicingText = ref("");

// derived state
const filteredTodos = computed(() => filters[visibility.value](todos.value));
const remaining = computed(() => filters.active(todos.value).length);

// handle routing
window.addEventListener("hashchange", onHashChange);
onHashChange();

// persist state
watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value));
});

function toggleAll(e) {
  todos.value.forEach((todo) => (todo.completed = e.target.checked));
}

function addTodo(e) {
  const value = e.target.value.trim();
  if (value) {
    todos.value.push({
      id: Date.now(),
      title: value,
      completed: false,
    });
    e.target.value = "";
  }
}

function removeTodo(todo) {
  todos.value.splice(todos.value.indexOf(todo), 1);
}

let beforeEditCache = "";
function editTodo(todo) {
  beforeEditCache = todo.title;
  editedTodo.value = todo;
}

function cancelEdit(todo) {
  editedTodo.value = null;
  todo.title = beforeEditCache;
}

function doneEdit(todo) {
  if (editedTodo.value) {
    editedTodo.value = null;
    todo.title = todo.title.trim();
    if (!todo.title) removeTodo(todo);
  }
}

function removeCompleted() {
  todos.value = filters.active(todos.value);
}

function onHashChange() {
  const route = window.location.hash.replace(/#\/?/, "");
  if (filters[route]) {
    visibility.value = route;
  } else {
    window.location.hash = "";
    visibility.value = "all";
  }
}

function processTranscript(transcript) {
  console.log("[processTranscript] transcript: ", transcript);
  voicingText.value = transcript;

  const ADD_REGEX = /add (.*)\.$/i;
  const COMPLETE_REGEX = /complete (.+)\.$/i;
  const REMOVE_REGEX = /remove (.+)\.$/i;

  if (ADD_REGEX.test(transcript)) {
    console.log("[processTranscript] matched ADD");

    const [, content] = transcript.match(ADD_REGEX);
    addTodo({
      target: { value: content },
    });
  } else if (COMPLETE_REGEX.test(transcript)) {
    console.log("[processTranscript] matched COMPLETE");

    const [, idxStr] = transcript.match(COMPLETE_REGEX);
    const todo = filteredTodos.value[parseIndex(idxStr)];
    if (todo) {
      todo.completed = true;
    }
  } else if (REMOVE_REGEX.test(transcript)) {
    console.log("[processTranscript] matched REMOVE");

    const [, idxStr] = transcript.match(REMOVE_REGEX);
    const todo = filteredTodos.value[parseIndex(idxStr)];
    if (todo) {
      removeTodo(todo);
    }
  } else {
    console.log("[processTranscript] no match");
  }
}

requestPermission().then((granted) => {
  isSpeechPermissionGranted.value = granted;

  if (granted) {
    startSpeechRecognition(processTranscript);
  }
});
</script>

<template>
  <section class="todoapp">
    <div class="todoapp-title">
      <h1>
        Voice Interacting Todos {{ isSpeechPermissionGranted ? "💬" : "🚫" }}
      </h1>
      <div class="todoapp-desc">
        Adapted from
        <a
          target="_blank"
          href="https://vuejs.org/examples/#todomvc"
          style="color: #999"
          >TodoMVC</a
        >. Developed on the Web Speech API.
      </div>
    </div>

    <header class="header">
      <input
        disabled
        class="new-todo"
        autofocus
        placeholder="Trying to say: 'ADD wash the dishes'"
        :value="voicingText"
      />
    </header>
    <section class="main" v-show="todos.length">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        :checked="remaining === 0"
        @change="toggleAll"
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="(todo, index) in filteredTodos"
          class="todo"
          :key="todo.id"
          :class="{ completed: todo.completed, editing: todo === editedTodo }"
        >
          <div class="view">
            <input
              class="toggle"
              type="checkbox"
              v-model="todo.completed"
              disabled
            />
            <label @dblclick="editTodo(todo)">
              {{ todo.title }}
              <span class="voice-hint">
                {{
                  `Voice command: 'COMPLETE ${index + 1}' or 'REMOVE ${
                    index + 1
                  }'`
                }}</span
              >
            </label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input
            v-if="todo === editedTodo"
            class="edit"
            type="text"
            v-model="todo.title"
            @vue:mounted="({ el }) => el.focus()"
            @blur="doneEdit(todo)"
            @keyup.enter="doneEdit(todo)"
            @keyup.escape="cancelEdit(todo)"
          />
        </li>
      </ul>
    </section>
    <footer class="footer" v-show="todos.length">
      <span class="todo-count">
        <strong>{{ remaining }}</strong>
        <span>{{ remaining === 1 ? " item" : " items" }} left</span>
      </span>
      <ul class="filters">
        <li>
          <a href="#/all" :class="{ selected: visibility === 'all' }">All</a>
        </li>
        <li>
          <a href="#/active" :class="{ selected: visibility === 'active' }"
            >Active</a
          >
        </li>
        <li>
          <a
            href="#/completed"
            :class="{ selected: visibility === 'completed' }"
            >Completed</a
          >
        </li>
      </ul>
      <button
        class="clear-completed"
        @click="removeCompleted"
        v-show="todos.length > remaining"
      >
        Clear completed
      </button>
    </footer>
  </section>
</template>

<style>
@import "./assets/app.css";
</style>
