import {
  Time,
  camelCase,
  camelize,
  capitalize,
  clone,
  contain,
  deduplicate,
  defineProperty,
  difference,
  hyphenate,
  intersection,
  isNullable,
  isPlainObject,
  lib_default,
  makeArray,
  noop,
  omit,
  paramCase,
  pick,
  remove,
  sanitize,
  snakeCase,
  trimSlash,
  uncapitalize,
  union,
  valueMap
} from "./chunk-AIBGTUV2.js";
import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  installer
} from "./chunk-Z2H67J6D.js";
import {
  useLocalStorage
} from "./chunk-VYKO7HUI.js";
import {
  START_LOCATION_NORMALIZED,
  createRouter,
  createWebHistory
} from "./chunk-3YPBZQR5.js";
import {
  Comment,
  Fragment,
  Text,
  defineComponent,
  h,
  markRaw,
  reactive,
  ref,
  resolveComponent,
  watch,
  withDirectives
} from "./chunk-ZODGDGOD.js";
import {
  __export,
  __publicField
} from "./chunk-IN47U6CF.js";

// node_modules/@koishijs/client/client/data.ts
function createStorage(key, version, fallback) {
  const storage = useLocalStorage("koishi.console." + key, {});
  const initial = fallback ? fallback() : {};
  if (storage.value.version !== version) {
    storage.value = { version, data: initial };
  } else if (!Array.isArray(storage.value.data)) {
    storage.value.data = { ...initial, ...storage.value.data };
  }
  return reactive(storage.value["data"]);
}
var config = KOISHI_CONFIG;
var store = reactive({});
var socket = ref(null);
var listeners = {};
var responseHooks = {};
function send(type, ...args) {
  if (!socket.value)
    return;
  const id = Math.random().toString(36).slice(2, 9);
  socket.value.send(JSON.stringify({ id, type, args }));
  return new Promise((resolve, reject) => {
    responseHooks[id] = [resolve, reject];
    setTimeout(() => {
      delete responseHooks[id];
      reject(new Error("timeout"));
    }, 6e4);
  });
}
function receive(event, listener) {
  listeners[event] = listener;
}
receive("data", ({ key, value }) => {
  store[key] = value;
});
receive("patch", ({ key, value }) => {
  if (Array.isArray(store[key])) {
    store[key].push(...value);
  } else {
    Object.assign(store[key], value);
  }
});
receive("response", ({ id, value, error }) => {
  if (!responseHooks[id])
    return;
  const [resolve, reject] = responseHooks[id];
  delete responseHooks[id];
  if (error) {
    reject(error);
  } else {
    resolve(value);
  }
});
function connect(value) {
  socket.value = markRaw(value);
  socket.value.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    console.debug("%c", "color:purple", data.type, data.body);
    if (data.type in listeners) {
      listeners[data.type](data.body);
    }
  };
  socket.value.onclose = (ev) => {
    socket.value = null;
    for (const key in store) {
      store[key] = void 0;
    }
    console.log("[koishi] websocket disconnected, will retry in 1s...");
    setTimeout(() => connect(value), 1e3);
  };
  return new Promise((resolve) => {
    socket.value.onopen = resolve;
  });
}

// node_modules/@koishijs/client/client/components/common/index.ts
import Button from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/common/k-button.vue";
import Form from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/common/k-form.vue";
import Tab from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/common/k-tab.vue";
function common_default(app) {
  app.component("k-button", Button);
  app.component("k-form", Form);
  app.component("k-tab", Tab);
}

// node_modules/schemastery-vue/src/index.ts
import Markdown from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/schemastery-vue/src/markdown.vue";
import Schema from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/schemastery-vue/src/schema.vue";

// node_modules/schemastery-vue/src/icons/index.ts
import IconExternal from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/schemastery-vue/src/icons/external.vue";
import IconEyeSlash from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/schemastery-vue/src/icons/eye-slash.vue";
import IconEye from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/schemastery-vue/src/icons/eye.vue";

// node_modules/schemastery-vue/src/utils.ts
var primitive = ["string", "number", "boolean", "bitset", "const"];
var dynamic = ["function", "transform", "is"];
var composite = ["array", "dict"];
function isObjectSchema(schema) {
  if (schema.type === "object") {
    return true;
  } else if (schema.type === "intersect") {
    return schema.list.every(isObjectSchema);
  } else if (schema.type === "union") {
    return getChoices(schema).every(isObjectSchema);
  } else {
    return false;
  }
}
function getChoices(schema) {
  const inner = [];
  const choices = schema.list.filter((item) => {
    if (item.meta.hidden)
      return;
    if (item.type === "transform")
      inner.push(item.inner);
    return !dynamic.includes(item.type);
  });
  return choices.length ? choices : inner;
}
function getFallback(schema, required = false) {
  var _a;
  if (!schema || schema.type === "union" && getChoices(schema).length === 1)
    return;
  return (_a = clone(schema.meta.default)) != null ? _a : required ? inferFallback(schema) : void 0;
}
function inferFallback(schema) {
  if (schema.type === "string")
    return "";
  if (schema.type === "number")
    return 0;
  if (schema.type === "boolean")
    return false;
  if (["dict", "object", "intersect"].includes(schema.type))
    return {};
}
function validate(schema) {
  if (!schema || schema.meta.hidden)
    return true;
  if (schema.type === "object") {
    return Object.values(schema.dict).every(validate);
  } else if (schema.type === "intersect") {
    return schema.list.every(isObjectSchema);
  } else if (schema.type === "union") {
    const choices = getChoices(schema);
    return choices.length === 1 || choices.every((item) => validate(item));
  } else if (composite.includes(schema.type)) {
    return validate(schema.inner);
  } else if (schema.type === "tuple") {
    return schema.list.every((item) => primitive.includes(item.type));
  } else {
    return primitive.includes(schema.type);
  }
}
function hasTitle(schema, root2) {
  if (!schema)
    return true;
  if (schema.type === "object") {
    if (schema.meta.description)
      return true;
    const keys = Object.keys(schema.dict);
    if (!keys.length)
      return true;
    return hasTitle(schema.dict[keys[0]]);
  } else if (schema.type === "intersect") {
    return hasTitle(schema.list[0]);
  } else if (schema.type === "union") {
    const choices = getChoices(schema);
    return choices.length === 1 ? hasTitle(choices[0]) : false;
  } else if (root2 && composite.includes(schema.type) && validate(schema.inner)) {
    return true;
  } else {
    return false;
  }
}
function deepEqual(a, b) {
  if (a === b)
    return true;
  if (typeof a !== typeof b)
    return false;
  if (typeof a !== "object")
    return false;
  if (!a || !b)
    return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  } else if (Array.isArray(b)) {
    return false;
  }
  return Object.keys({ ...a, ...b }).every((key) => deepEqual(a[key], b[key]));
}

// node_modules/schemastery-vue/src/index.ts
function src_default(app) {
  app.component("k-markdown", Markdown);
  app.component("k-schema", Schema);
}

// node_modules/@koishijs/client/client/components/index.ts
import ChatImage from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/chat/image.vue";

// node_modules/@koishijs/client/client/components/icons/index.ts
var icons_exports = {};
__export(icons_exports, {
  install: () => install,
  register: () => register
});
import Home from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/activity/home.vue";
import Moon from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/activity/moon.vue";
import Sun from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/activity/sun.vue";
import Application from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/application.vue";
import BoxOpen from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/box-open.vue";
import CheckFull from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/check-full.vue";
import ChevronDown from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/chevron-down.vue";
import ChevronLeft from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/chevron-left.vue";
import ChevronRight from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/chevron-right.vue";
import ChevronUp from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/chevron-up.vue";
import ClipboardList from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/clipboard-list.vue";
import Edit from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/edit.vue";
import ExclamationFull from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/exclamation-full.vue";
import Expand from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/expand.vue";
import FileArchive from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/file-archive.vue";
import Filter from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/filter.vue";
import GitHub from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/github.vue";
import GitLab from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/gitlab.vue";
import InfoFull from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/info-full.vue";
import Koishi from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/koishi.vue";
import Link from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/link.vue";
import PaperPlane from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/paper-plane.vue";
import QuestionEmpty from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/question-empty.vue";
import Redo from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/redo.vue";
import Search from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/search.vue";
import SearchMinus from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/search-minus.vue";
import SearchPlus from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/search-plus.vue";
import StarEmpty from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/star-empty.vue";
import StarFull from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/star-full.vue";
import Tag from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/tag.vue";
import TimesFull from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/times-full.vue";
import Tools from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/tools.vue";
import Undo from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/undo.vue";
import User from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/svg/user.vue";
import "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/icons/style.scss";
var registry = {};
register("activity:home", Home);
register("activity:moon", Moon);
register("activity:sun", Sun);
register("application", Application);
register("box-open", BoxOpen);
register("check-full", CheckFull);
register("chevron-down", ChevronDown);
register("chevron-left", ChevronLeft);
register("chevron-right", ChevronRight);
register("chevron-up", ChevronUp);
register("clipboard-list", ClipboardList);
register("edit", Edit);
register("exclamation-full", ExclamationFull);
register("expand", Expand);
register("external", IconExternal);
register("eye-slash", IconEyeSlash);
register("eye", IconEye);
register("file-archive", FileArchive);
register("filter", Filter);
register("github", GitHub);
register("gitlab", GitLab);
register("info-full", InfoFull);
register("koishi", Koishi);
register("link", Link);
register("paper-plane", PaperPlane);
register("question-empty", QuestionEmpty);
register("redo", Redo);
register("search", Search);
register("search-minus", SearchMinus);
register("search-plus", SearchPlus);
register("star-empty", StarEmpty);
register("star-full", StarFull);
register("tag", Tag);
register("times-full", TimesFull);
register("tools", Tools);
register("undo", Undo);
register("user", User);
function register(name, component) {
  registry[name] = component;
}
function install(app) {
  app.component("k-icon", defineComponent({
    props: {
      name: String
    },
    render(props) {
      return props.name && h(registry[props.name]);
    }
  }));
}

// node_modules/@koishijs/client/client/components/layout/index.ts
import Layout from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/k-layout.vue";
import Status from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/k-status.vue";
import CardNumeric from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/card-numeric.vue";
import Card from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/card.vue";
import Content from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/content.vue";
import Empty from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/empty.vue";
import TabGroup from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/tab-group.vue";
import TabItem from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/layout/tab-item.vue";

// node_modules/@koishijs/client/client/components/layout/utils.ts
var isLeftAsideOpen = ref(false);

// node_modules/@koishijs/client/client/components/layout/index.ts
function layout_default(app) {
  app.component("k-layout", Layout);
  app.component("k-status", Status);
  app.component("k-numeric", CardNumeric);
  app.component("k-card", Card);
  app.component("k-content", Content);
  app.component("k-empty", Empty);
  app.component("k-tab-group", TabGroup);
  app.component("k-tab-item", TabItem);
}

// node_modules/@koishijs/client/client/components/notice/index.ts
import Badge from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/notice/badge.vue";
import Comment2 from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/notice/comment.vue";
import Hint from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/notice/hint.vue";
function notice_default(app) {
  app.component("k-badge", Badge);
  app.component("k-comment", Comment2);
  app.component("k-hint", Hint);
}

// node_modules/@koishijs/client/client/components/slot.ts
var slot_default = defineComponent({
  props: {
    name: String,
    tag: {
      default: "div"
    }
  },
  setup: ({ name, tag }, { slots }) => () => {
    var _a;
    return h(tag, [
      ...((_a = slots.default) == null ? void 0 : _a.call(slots)) || [],
      ...(views[name] || []).map((view) => h(view.component))
    ]);
  }
});

// node_modules/@koishijs/client/client/components/index.ts
import "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/element-plus/dist/index.css";
import "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/style.scss";

// node_modules/@satorijs/components/src/chat/index.ts
import ChatInput from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/chat/input.vue";
import MessageContent from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/chat/content.vue";

// node_modules/@satorijs/components/src/popper/index.ts
import Dropdown from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/popper/dropdown.vue";
import Popper from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/popper/popper.vue";
import Tooltip from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/popper/tooltip.vue";

// node_modules/@satorijs/components/src/popper/shared.ts
var injections;
((injections2) => {
  injections2.placement = Symbol("INJECTION_PLACEMENT");
  injections2.teleport = Symbol("INJECTION_TELEPORT");
})(injections || (injections = {}));

// node_modules/@satorijs/components/src/virtual/item.ts
var useRefDirective = (ref2) => ({
  mounted(el) {
    ref2.value = el;
  },
  updated(el) {
    ref2.value = el;
  },
  beforeUnmount() {
    ref2.value = null;
  }
});
function findFirstLegitChild(node) {
  if (!node)
    return null;
  for (const child of node) {
    if (typeof child === "object") {
      switch (child.type) {
        case Comment:
          continue;
        case Text:
          break;
        case Fragment:
          return findFirstLegitChild(child.children);
        default:
          if (typeof child.type === "string")
            return child;
          return child;
      }
    }
    return h("span", child);
  }
}
var VirtualItem = defineComponent({
  props: {
    class: {}
  },
  emits: ["resize"],
  setup(props, { attrs, slots, emit }) {
    let resizeObserver;
    const root2 = ref();
    watch(root2, (value) => {
      resizeObserver == null ? void 0 : resizeObserver.disconnect();
      if (!value)
        return;
      resizeObserver = new ResizeObserver(dispatchSizeChange);
      resizeObserver.observe(value);
    });
    function dispatchSizeChange() {
      if (!root2.value)
        return;
      const marginTop = +getComputedStyle(root2.value).marginTop.slice(0, -2);
      emit("resize", root2.value.offsetHeight + marginTop);
    }
    const directive = useRefDirective(root2);
    return () => {
      var _a;
      const head = findFirstLegitChild((_a = slots.default) == null ? void 0 : _a.call(slots, attrs));
      return withDirectives(head, [[directive]]);
    };
  }
});
var item_default = VirtualItem;

// node_modules/@satorijs/components/src/virtual/index.ts
import VirtualList from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@satorijs/components/src/virtual/list.vue";

// node_modules/@koishijs/client/client/components/index.ts
var loading = ElLoading.service;
var message = ElMessage;
var messageBox = ElMessageBox;
function components_default(app) {
  app.use(installer);
  app.use(common_default);
  app.use(src_default);
  app.use(icons_exports);
  app.use(layout_default);
  app.use(notice_default);
  app.component("k-slot", slot_default);
}

// node_modules/@koishijs/client/client/index.ts
import Overlay from "C:/Users/28648/OneDrive/U/node/myrtus/node_modules/@koishijs/client/client/components/chat/overlay.vue";

// node_modules/cordis/lib/index.mjs
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField2 = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function isBailed(value) {
  return value !== null && value !== false && value !== void 0;
}
__name(isBailed, "isBailed");
var Lifecycle = class {
  constructor(root2, config2) {
    __publicField(this, "isActive", false);
    __publicField(this, "_tasks", /* @__PURE__ */ new Set());
    __publicField(this, "_hooks", {});
    this.root = root2;
    this.config = config2;
    defineProperty(this, Context.current, root2);
    const dispose = this.on("internal/hook", function(name, listener, prepend) {
      const method = prepend ? "unshift" : "push";
      const { state } = this[Context.current];
      const { runtime, disposables } = state;
      if (name === "ready" && this.isActive) {
        this.queue(listener());
      } else if (name === "dispose") {
        disposables[method](listener);
        defineProperty(listener, "name", "event <dispose>");
        return () => remove(disposables, listener);
      } else if (name === "fork") {
        runtime.forkables[method](listener);
        return state.collect("event <fork>", () => remove(runtime.forkables, listener));
      }
    });
    defineProperty(dispose, Context.static, true);
  }
  queue(value) {
    const task = Promise.resolve(value).catch((reason) => this.root.emit("internal/warning", reason)).then(() => this._tasks.delete(task));
    this._tasks.add(task);
  }
  async flush() {
    while (this._tasks.size) {
      await Promise.all(Array.from(this._tasks));
    }
  }
  *getHooks(name, thisArg) {
    const hooks = this._hooks[name] || [];
    for (const [context, callback] of hooks.slice()) {
      const filter = thisArg == null ? void 0 : thisArg[Context.filter];
      if (filter && !filter.call(thisArg, context))
        continue;
      yield callback;
    }
  }
  async parallel(...args) {
    const thisArg = typeof args[0] === "object" ? args.shift() : null;
    const name = args.shift();
    await Promise.all([...this.getHooks(name, thisArg)].map(async (callback) => {
      try {
        await callback.apply(thisArg, args);
      } catch (error) {
        this.root.emit("internal/warning", error);
      }
    }));
  }
  emit(...args) {
    this.parallel(...args);
  }
  async serial(...args) {
    const thisArg = typeof args[0] === "object" ? args.shift() : null;
    const name = args.shift();
    for (const callback of this.getHooks(name, thisArg)) {
      const result = await callback.apply(thisArg, args);
      if (isBailed(result))
        return result;
    }
  }
  bail(...args) {
    const thisArg = typeof args[0] === "object" ? args.shift() : null;
    const name = args.shift();
    for (const callback of this.getHooks(name, thisArg)) {
      const result = callback.apply(thisArg, args);
      if (isBailed(result))
        return result;
    }
  }
  register(label, hooks, listener, prepend) {
    if (hooks.length >= this.config.maxListeners) {
      this.root.emit("internal/warning", `max listener count (${this.config.maxListeners}) for ${label} exceeded, which may be caused by a memory leak`);
    }
    const caller = this[Context.current];
    const method = prepend ? "unshift" : "push";
    hooks[method]([caller, listener]);
    return caller.state.collect(label, () => this.unregister(hooks, listener));
  }
  unregister(hooks, listener) {
    const index = hooks.findIndex(([context, callback]) => callback === listener);
    if (index >= 0) {
      hooks.splice(index, 1);
      return true;
    }
  }
  on(name, listener, prepend = false) {
    var _a;
    const result = this.bail(this, "internal/hook", name, listener, prepend);
    if (result)
      return result;
    const hooks = (_a = this._hooks)[name] || (_a[name] = []);
    const label = typeof name === "string" ? `event <${name}>` : "event (Symbol)";
    return this.register(label, hooks, listener, prepend);
  }
  once(name, listener, prepend = false) {
    const dispose = this.on(name, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, prepend);
    return dispose;
  }
  off(name, listener) {
    return this.unregister(this._hooks[name] || [], listener);
  }
  async start() {
    this.isActive = true;
    for (const callback of this.getHooks("ready")) {
      this.queue(callback());
    }
    delete this._hooks.ready;
    await this.flush();
  }
  async stop() {
    this.isActive = false;
    this.root.state.clear(true);
  }
};
__name(Lifecycle, "Lifecycle");
__publicField2(Lifecycle, "methods", ["on", "once", "off", "before", "after", "parallel", "emit", "serial", "bail", "start", "stop"]);
function isConstructor(func) {
  if (!func.prototype)
    return false;
  if (func.prototype.constructor !== func)
    return false;
  return true;
}
__name(isConstructor, "isConstructor");
function resolveConfig(plugin, config2) {
  if (config2 === false)
    return;
  if (config2 === true)
    config2 = void 0;
  config2 != null ? config2 : config2 = {};
  const schema = plugin["Config"] || plugin["schema"];
  if (schema && plugin["schema"] !== false)
    config2 = schema(config2);
  return config2;
}
__name(resolveConfig, "resolveConfig");
var State = class {
  constructor(parent, config2) {
    __publicField(this, "uid");
    __publicField(this, "runtime");
    __publicField(this, "ctx");
    __publicField(this, "context");
    __publicField(this, "disposables", []);
    this.parent = parent;
    this.config = config2;
    this.uid = parent.registry ? parent.registry.counter : 0;
    this.ctx = this.context = parent.extend({ state: this });
  }
  collect(label, callback) {
    const dispose = __name(() => {
      remove(this.disposables, dispose);
      return callback();
    }, "dispose");
    this.disposables.push(dispose);
    defineProperty(dispose, "name", label);
    return dispose;
  }
  init() {
    if (this.runtime.using.length) {
      const dispose = this.context.on("internal/service", (name) => {
        if (!this.runtime.using.includes(name))
          return;
        this.restart();
      });
      defineProperty(dispose, Context.static, true);
    }
  }
  check() {
    return this.runtime.using.every((name) => this.context[name]);
  }
  clear(preserve = false) {
    this.disposables = this.disposables.splice(0, Infinity).filter((dispose) => {
      if (preserve && dispose[Context.static])
        return true;
      dispose();
    });
  }
};
__name(State, "State");
var Fork = class extends State {
  constructor(parent, config2, runtime) {
    super(parent, config2);
    __publicField(this, "dispose");
    this.runtime = runtime;
    this.dispose = parent.state.collect(`fork <${parent.runtime.name}>`, () => {
      this.uid = null;
      this.clear();
      const result = remove(runtime.disposables, this.dispose);
      if (remove(runtime.children, this) && !runtime.children.length) {
        runtime.dispose();
      }
      this.context.emit("internal/fork", this);
      return result;
    });
    defineProperty(this.dispose, Context.static, true);
    runtime.children.push(this);
    runtime.disposables.push(this.dispose);
    this.context.emit("internal/fork", this);
    if (runtime.isReusable)
      this.init();
    this.restart();
  }
  restart() {
    this.clear(true);
    if (!this.check())
      return;
    for (const fork of this.runtime.forkables) {
      fork(this.context, this.config);
    }
  }
  update(config2) {
    const oldConfig = this.config;
    const resolved = resolveConfig(this.runtime.plugin, config2);
    this.config = resolved;
    this.context.emit("internal/update", this, config2);
    if (this.runtime.isForkable) {
      this.restart();
    } else if (this.runtime.config === oldConfig) {
      this.runtime.config = resolved;
      this.runtime.restart();
    }
  }
};
__name(Fork, "Fork");
var Runtime = class extends State {
  constructor(registry2, plugin, config2) {
    super(registry2[Context.current], config2);
    __publicField(this, "runtime", this);
    __publicField(this, "schema");
    __publicField(this, "using", []);
    __publicField(this, "forkables", []);
    __publicField(this, "children", []);
    __publicField(this, "isReusable");
    __publicField(this, "apply", (context, config2) => {
      if (typeof this.plugin !== "function") {
        this.plugin.apply(context, config2);
      } else if (isConstructor(this.plugin)) {
        const instance = new this.plugin(context, config2);
        const name = instance[Context.immediate];
        if (name) {
          context[name] = instance;
        }
        if (instance["fork"]) {
          this.forkables.push(instance["fork"].bind(instance));
        }
      } else {
        this.plugin(context, config2);
      }
    });
    this.registry = registry2;
    this.plugin = plugin;
    registry2.set(plugin, this);
    if (plugin)
      this.init();
  }
  get isForkable() {
    return this.forkables.length > 0;
  }
  get name() {
    if (!this.plugin)
      return "root";
    const { name } = this.plugin;
    return !name || name === "apply" ? "anonymous" : name;
  }
  fork(parent, config2) {
    return new Fork(parent, config2, this);
  }
  dispose() {
    this.uid = null;
    this.clear();
    if (this.plugin) {
      this.context.emit("internal/runtime", this);
      return true;
    }
  }
  init() {
    this.schema = this.plugin["Config"] || this.plugin["schema"];
    this.using = this.plugin["using"] || [];
    this.isReusable = this.plugin["reusable"];
    this.context.emit("internal/runtime", this);
    if (this.isReusable) {
      this.forkables.push(this.apply);
    } else {
      super.init();
    }
    this.restart();
  }
  restart() {
    this.clear(true);
    if (!this.check())
      return;
    if (!this.isReusable) {
      this.apply(this.context, this.config);
    }
    for (const fork of this.children) {
      fork.restart();
    }
  }
  update(config2) {
    if (this.isForkable) {
      this.context.emit("internal/warning", `attempting to update forkable plugin "${this.plugin.name}", which may lead to unexpected behavior`);
    }
    const oldConfig = this.config;
    const resolved = resolveConfig(this.runtime.plugin, config2);
    this.config = resolved;
    for (const fork of this.children) {
      if (fork.config !== oldConfig)
        continue;
      fork.config = resolved;
      this.context.emit("internal/update", fork, config2);
    }
    this.restart();
  }
};
__name(Runtime, "Runtime");
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
__name(isApplicable, "isApplicable");
var Registry = class extends Map {
  constructor(root2, config2) {
    super();
    __publicField(this, "_counter", 0);
    this.root = root2;
    this.config = config2;
    defineProperty(this, Context.current, root2);
    root2.state = new Runtime(this, null, config2);
  }
  get counter() {
    return ++this._counter;
  }
  resolve(plugin) {
    return plugin && (typeof plugin === "function" ? plugin : plugin.apply);
  }
  get(plugin) {
    return super.get(this.resolve(plugin));
  }
  has(plugin) {
    return super.has(this.resolve(plugin));
  }
  set(plugin, state) {
    return super.set(this.resolve(plugin), state);
  }
  delete(plugin) {
    plugin = this.resolve(plugin);
    const runtime = this.get(plugin);
    if (!runtime)
      return false;
    super.delete(plugin);
    return runtime.dispose();
  }
  using(using, callback) {
    return this.plugin({ using, apply: callback, name: callback.name });
  }
  plugin(plugin, config2) {
    if (typeof plugin !== "function" && !isApplicable(plugin)) {
      throw new Error('invalid plugin, expect function or object with an "apply" method');
    }
    config2 = resolveConfig(plugin, config2);
    if (!config2)
      return;
    const context = this[Context.current];
    const duplicate = this.get(plugin);
    if (duplicate) {
      if (!duplicate.isForkable) {
        this.root.emit("internal/warning", `duplicate plugin detected: ${plugin.name}`);
      }
      return duplicate.fork(context, config2);
    }
    const runtime = new Runtime(this, plugin, config2);
    return runtime.fork(context, config2);
  }
  dispose(plugin) {
    return this.delete(plugin);
  }
};
__name(Registry, "Registry");
__publicField2(Registry, "methods", ["using", "plugin", "dispose"]);
var _Context = class {
  constructor(config2) {
    __publicField(this, "options");
    const attach = __name((internal) => {
      if (!internal)
        return;
      attach(Object.getPrototypeOf(internal));
      for (const key of Object.getOwnPropertySymbols(internal)) {
        this[key] = new internal[key](this, this.options);
      }
    }, "attach");
    this.root = this;
    this.mapping = /* @__PURE__ */ Object.create(null);
    this.options = resolveConfig(Object.getPrototypeOf(this).constructor, config2);
    attach(this[_Context.internal]);
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `Context <${this.runtime.name}>`;
  }
  extend(meta = {}) {
    return Object.assign(Object.create(this), meta);
  }
  isolate(names) {
    const mapping = Object.create(this.mapping);
    for (const name of names) {
      mapping[name] = Symbol(name);
    }
    return this.extend({ mapping });
  }
};
var Context = _Context;
__name(Context, "Context");
__publicField2(Context, "events", Symbol("events"));
__publicField2(Context, "static", Symbol("static"));
__publicField2(Context, "filter", Symbol("filter"));
__publicField2(Context, "source", Symbol("source"));
__publicField2(Context, "current", Symbol("current"));
__publicField2(Context, "internal", Symbol("internal"));
__publicField2(Context, "immediate", Symbol("immediate"));
((Context22) => {
  function mixin(name, options) {
    for (const key of options.methods || []) {
      defineProperty(Context22.prototype, key, function(...args) {
        return this[name][key](...args);
      });
    }
    for (const key of options.properties || []) {
      Object.defineProperty(Context22.prototype, key, {
        configurable: true,
        get() {
          return this[name][key];
        },
        set(value) {
          this[name][key] = value;
        }
      });
    }
  }
  Context22.mixin = mixin;
  __name(mixin, "mixin");
  function service(name, options = {}) {
    const privateKey = typeof name === "symbol" ? name : Symbol(name);
    Object.defineProperty(this.prototype, name, {
      configurable: true,
      get() {
        const key = this.mapping[name] || privateKey;
        const value = this.root[key];
        if (!value)
          return;
        defineProperty(value, Context22.current, this);
        return value;
      },
      set(value) {
        const key = this.mapping[name] || privateKey;
        const oldValue = this.root[key];
        if (oldValue === value)
          return;
        this.root[key] = value;
        if (value && typeof value === "object") {
          defineProperty(value, Context22.source, this);
        }
        if (typeof name !== "string")
          return;
        const self = /* @__PURE__ */ Object.create(null);
        self[Context22.filter] = (ctx) => {
          return this.mapping[name] === ctx.mapping[name];
        };
        this.emit(self, "internal/service", name);
      }
    });
    if (isConstructor(options)) {
      const internal = ensureInternal(this.prototype);
      internal[privateKey] = options;
    }
    mixin(name, options);
  }
  Context22.service = service;
  __name(service, "service");
  function ensureInternal(prototype) {
    if (Object.prototype.hasOwnProperty.call(prototype, Context22.internal)) {
      return prototype[Context22.internal];
    }
    const parent = ensureInternal(Object.getPrototypeOf(prototype));
    return prototype[Context22.internal] = Object.create(parent);
  }
  __name(ensureInternal, "ensureInternal");
})(Context || (Context = {}));
Context.prototype[Context.internal] = /* @__PURE__ */ Object.create(null);
Context.service("registry", Registry);
Context.service("lifecycle", Lifecycle);
Context.mixin("state", {
  properties: ["runtime", "collect"]
});
var Service = class {
  constructor(ctx, name, immediate) {
    this.ctx = ctx;
    Object.getPrototypeOf(ctx.root).constructor.service(name);
    defineProperty(this, Context.current, ctx);
    if (immediate) {
      this[Context.immediate] = name;
    }
    ctx.on("ready", async () => {
      await Promise.resolve();
      await this.start();
      ctx[name] = this;
    });
    ctx.on("dispose", async () => {
      ctx[name] = null;
      await this.stop();
    });
  }
  start() {
  }
  stop() {
  }
  get caller() {
    return this[Context.current];
  }
};
__name(Service, "Service");

// node_modules/@koishijs/client/client/index.ts
var client_default = components_default;
var views = reactive({});
var router = createRouter({
  history: createWebHistory(config.uiPath),
  linkActiveClass: "active",
  routes: []
});
var extensions = reactive({});
var routes = ref([]);
function getValue(computed) {
  return typeof computed === "function" ? computed() : computed;
}
var Context2 = class extends Context {
  addView(options) {
    return this.slot(options);
  }
  addPage(options) {
    return this.page(options);
  }
  slot(options) {
    var _a, _b;
    (_a = options.order) != null ? _a : options.order = 0;
    markRaw(options.component);
    const list = views[_b = options.type] || (views[_b] = []);
    const index = list.findIndex((a) => a.order < options.order);
    if (index >= 0) {
      list.splice(index, 0, options);
    } else {
      list.push(options);
    }
    return this.state.collect("view", () => remove(list, options));
  }
  page(options) {
    const { path, name, component, badge, fields = [], ...rest } = options;
    const dispose = router.addRoute({
      path,
      name,
      component,
      meta: {
        order: 0,
        authority: 0,
        position: "top",
        fields,
        badge: badge ? [badge] : [],
        ...rest
      }
    });
    routes.value = router.getRoutes();
    return this.state.collect("page", () => {
      dispose();
      routes.value = router.getRoutes();
      return true;
    });
  }
};
var root = new Context2();
root.on("activity", (options) => {
  return !options.fields.every((key) => store[key]);
});
root.slot({
  type: "global",
  component: Overlay
});
function defineExtension(callback) {
  return callback;
}
async function loadExtension(path) {
  if (extensions[path])
    return;
  if (path.endsWith(".css")) {
    extensions[path] = root.plugin((ctx) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = path;
      document.head.appendChild(link);
      ctx.on("dispose", () => {
        document.head.removeChild(link);
      });
    });
    return;
  }
  const exports = await import(
    /* @vite-ignore */
    path
  );
  extensions[path] = root.plugin(exports.default);
  const { redirect } = router.currentRoute.value.query;
  if (typeof redirect === "string") {
    const location = router.resolve(redirect);
    if (location.matched.length) {
      router.replace(location);
    }
  }
}
var initTask = new Promise((resolve) => {
  watch(() => store.entry, async (newValue, oldValue) => {
    newValue || (newValue = []);
    for (const path in extensions) {
      if (newValue.includes(path))
        continue;
      extensions[path].dispose();
      delete extensions[path];
    }
    await Promise.all(newValue.map((path) => {
      return loadExtension(path).catch(console.error);
    }));
    if (!oldValue)
      resolve();
  }, { deep: true });
});
router.beforeEach(async (to, from) => {
  var _a;
  if (to.matched.length)
    return;
  if (from === START_LOCATION_NORMALIZED) {
    await initTask;
    to = router.resolve(to);
    if (to.matched.length)
      return to;
  }
  const routes2 = router.getRoutes().filter((item) => item.meta.position === "top").sort((a, b) => b.meta.order - a.meta.order);
  const path = ((_a = routes2[0]) == null ? void 0 : _a.path) || "/blank";
  return {
    path,
    query: { redirect: to.fullPath }
  };
});
var Card2;
((Card3) => {
  function create(render, fields = []) {
    return defineComponent({
      render: () => fields.every((key) => store[key]) ? render() : null
    });
  }
  Card3.create = create;
  function numeric({ type, icon, fields, title, content }) {
    if (!type) {
      return defineComponent(() => () => {
        if (!fields.every((key) => store[key]))
          return;
        return h(resolveComponent("k-numeric"), { icon, title }, () => content(store));
      });
    }
    return defineComponent(() => () => {
      if (!fields.every((key) => store[key]))
        return;
      let value = content(store);
      if (isNullable(value))
        return;
      if (type === "size") {
        if (value >= (1 << 20) * 1e3) {
          value = (value / (1 << 30)).toFixed(1) + " GB";
        } else if (value >= (1 << 10) * 1e3) {
          value = (value / (1 << 20)).toFixed(1) + " MB";
        } else {
          value = (value / (1 << 10)).toFixed(1) + " KB";
        }
      }
      return h(resolveComponent("k-numeric"), { icon, title }, () => [value]);
    });
  }
  Card3.numeric = numeric;
})(Card2 || (Card2 = {}));

// dep:@koishijs_client
var koishijs_client_default = client_default;
export {
  Card2 as Card,
  ChatImage,
  ChatInput,
  Context2 as Context,
  Dropdown,
  IconExternal,
  IconEye,
  IconEyeSlash,
  MessageContent,
  Popper,
  lib_default as Schema,
  Time,
  Tooltip,
  item_default as VirtualItem,
  VirtualList,
  camelCase,
  camelize,
  capitalize,
  clone,
  config,
  connect,
  contain,
  createStorage,
  deduplicate,
  deepEqual,
  koishijs_client_default as default,
  defineExtension,
  defineProperty,
  difference,
  extensions,
  getChoices,
  getFallback,
  getValue,
  config as global,
  hasTitle,
  hyphenate,
  icons_exports as icons,
  inferFallback,
  injections,
  intersection,
  isLeftAsideOpen,
  isNullable,
  isObjectSchema,
  isPlainObject,
  loading,
  makeArray,
  message,
  messageBox,
  noop,
  omit,
  paramCase,
  pick,
  receive,
  remove,
  root,
  router,
  routes,
  sanitize,
  send,
  snakeCase,
  socket,
  store,
  trimSlash,
  uncapitalize,
  union,
  validate,
  valueMap,
  views
};
//# sourceMappingURL=@koishijs_client.js.map
