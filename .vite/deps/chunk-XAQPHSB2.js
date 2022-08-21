// node_modules/cosmokit/lib/index.mjs
function noop() {
}
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function valueMap(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function clone(source) {
  if (!source || typeof source !== "object")
    return source;
  if (Array.isArray(source))
    return source.map(clone);
  if (source instanceof Date)
    return new Date(source.valueOf());
  if (source instanceof RegExp)
    return new RegExp(source.source, source.flags);
  return valueMap(source, clone);
}
function pick(source, keys, forced) {
  if (!keys)
    return { ...source };
  const result = {};
  for (const key of keys) {
    if (forced || key in source)
      result[key] = source[key];
  }
  return result;
}
function omit(source, keys) {
  if (!keys)
    return { ...source };
  const result = { ...source };
  for (const key of keys) {
    Reflect.deleteProperty(result, key);
  }
  return result;
}
function defineProperty(object, key, value) {
  Object.defineProperty(object, key, { writable: true, value });
}
function contain(array1, array2) {
  return array2.every((item) => array1.includes(item));
}
function intersection(array1, array2) {
  return array1.filter((item) => array2.includes(item));
}
function difference(array1, array2) {
  return array1.filter((item) => !array2.includes(item));
}
function union(array1, array2) {
  return Array.from(/* @__PURE__ */ new Set([...array1, ...array2]));
}
function deduplicate(array) {
  return [...new Set(array)];
}
function remove(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
    return true;
  }
}
function makeArray(source) {
  return Array.isArray(source) ? source : isNullable(source) ? [] : [source];
}
function capitalize(source) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}
function uncapitalize(source) {
  return source.charAt(0).toLowerCase() + source.slice(1);
}
function camelCase(source) {
  return source.replace(/[_-][a-z]/g, (str) => str.slice(1).toUpperCase());
}
function paramCase(source) {
  return uncapitalize(source).replace(/_/g, "-").replace(new RegExp("(?<!^)[A-Z]", "g"), (str) => "-" + str.toLowerCase());
}
function snakeCase(source) {
  return uncapitalize(source).replace(/-/g, "_").replace(new RegExp("(?<!^)[A-Z]", "g"), (str) => "_" + str.toLowerCase());
}
var camelize = camelCase;
var hyphenate = paramCase;
function trimSlash(source) {
  return source.replace(/\/$/, "");
}
function sanitize(source) {
  if (!source.startsWith("/"))
    source = "/" + source;
  return trimSlash(source);
}
var Time;
((Time2) => {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = new Date().getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date = new Date(), offset) {
    if (typeof date === "number")
      date = new Date(date);
    if (offset === void 0)
      offset = timezoneOffset;
    return Math.floor((date.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date = new Date(value * Time2.day);
    if (offset === void 0)
      offset = timezoneOffset;
    return new Date(+date + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture)
      return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date) {
    const parsed = parseTime(date);
    if (parsed) {
      date = Date.now() + parsed;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${new Date().toLocaleDateString()}-${date}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${new Date().getFullYear()}-${date}`;
    }
    return date ? new Date(date) : new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) {
      return Math.round(ms / Time2.day) + "d";
    } else if (abs >= Time2.hour - Time2.minute / 2) {
      return Math.round(ms / Time2.hour) + "h";
    } else if (abs >= Time2.minute - Time2.second / 2) {
      return Math.round(ms / Time2.minute) + "m";
    } else if (abs >= Time2.second) {
      return Math.round(ms / Time2.second) + "s";
    }
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// node_modules/schemastery/lib/index.mjs
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_src = __commonJS({
  "packages/schemastery/packages/core/src/index.ts"(exports, module) {
    var kSchema = Symbol.for("schemastery");
    var Schema = __name(function(options) {
      const schema = __name(function(data) {
        return Schema.resolve(data, schema)[0];
      }, "schema");
      if (options.refs) {
        const refs2 = valueMap(options.refs, (options2) => new Schema(options2));
        const getRef = __name((uid) => refs2[uid], "getRef");
        for (const key in refs2) {
          const options2 = refs2[key];
          options2.sKey = getRef(options2.sKey);
          options2.inner = getRef(options2.inner);
          options2.list = options2.list && options2.list.map(getRef);
          options2.dict = options2.dict && valueMap(options2.dict, getRef);
        }
        return refs2[options.uid];
      }
      Object.assign(schema, options);
      Object.defineProperty(schema, "uid", { value: index++ });
      Object.setPrototypeOf(schema, Schema.prototype);
      schema.meta || (schema.meta = {});
      return schema;
    }, "Schema");
    var index = 0;
    Schema.prototype = Object.create(Function.prototype);
    Schema.prototype[kSchema] = true;
    var refs;
    Schema.prototype.toJSON = __name(function toJSON() {
      var _a, _b;
      if (refs) {
        (_b = refs[_a = this.uid]) != null ? _b : refs[_a] = JSON.parse(JSON.stringify({ ...this }));
        return this.uid;
      }
      refs = { [this.uid]: { ...this } };
      refs[this.uid] = JSON.parse(JSON.stringify({ ...this }));
      const result = { uid: this.uid, refs };
      refs = void 0;
      return result;
    }, "toJSON");
    Schema.prototype.set = __name(function set(key, value) {
      this.dict[key] = value;
      return this;
    }, "set");
    Schema.prototype.push = __name(function push(value) {
      this.list.push(value);
      return this;
    }, "push");
    for (const key of ["required", "hidden"]) {
      Object.assign(Schema.prototype, {
        [key](value = true) {
          const schema = Schema(this);
          schema.meta = { ...schema.meta, [key]: value };
          return schema;
        }
      });
    }
    Schema.prototype.pattern = __name(function pattern(regexp) {
      const schema = Schema(this);
      const pattern2 = pick(regexp, ["source", "flags"]);
      schema.meta = { ...schema.meta, pattern: pattern2 };
      return schema;
    }, "pattern");
    for (const key of ["default", "role", "link", "comment", "description", "max", "min", "step"]) {
      Object.assign(Schema.prototype, {
        [key](value) {
          const schema = Schema(this);
          schema.meta = { ...schema.meta, [key]: value };
          return schema;
        }
      });
    }
    var resolvers = {};
    Schema.extend = __name(function extend(type, resolve) {
      resolvers[type] = resolve;
    }, "extend");
    Schema.resolve = __name(function resolve(data, schema, strict) {
      if (!schema)
        return [data];
      if (isNullable(data)) {
        if (schema.meta.required)
          throw new TypeError(`missing required value`);
        const fallback = schema.meta.default;
        if (isNullable(fallback))
          return [data];
        data = clone(fallback);
      }
      const callback = resolvers[schema.type];
      if (callback)
        return callback(data, schema, strict);
      throw new TypeError(`unsupported type "${schema.type}"`);
    }, "resolve");
    Schema.from = __name(function from(source) {
      if (isNullable(source)) {
        return Schema.any();
      } else if (["string", "number", "boolean"].includes(typeof source)) {
        return Schema.const(source).required();
      } else if (source[kSchema]) {
        return source;
      } else if (typeof source === "function") {
        switch (source) {
          case String:
            return Schema.string().required();
          case Number:
            return Schema.number().required();
          case Boolean:
            return Schema.boolean().required();
          case Function:
            return Schema.function().required();
          default:
            return Schema.is(source).required();
        }
      } else {
        throw new TypeError(`cannot infer schema from ${source}`);
      }
    }, "from");
    Schema.natural = __name(function natural() {
      return Schema.number().step(1).min(0);
    }, "natural");
    Schema.percent = __name(function percent() {
      return Schema.number().step(0.01).min(0).max(1).role("slider");
    }, "percent");
    Schema.date = () => Schema.union([
      Schema.is(Date),
      Schema.transform(Schema.string().role("datetime"), (value) => {
        const date = new Date(value);
        if (isNaN(+date))
          throw new TypeError(`invalid date "${value}"`);
        return date;
      })
    ]);
    Schema.extend("any", (data) => {
      return [data];
    });
    Schema.extend("never", (data) => {
      throw new TypeError(`expected nullable but got ${data}`);
    });
    Schema.extend("const", (data, { value }) => {
      if (data === value)
        return [value];
      throw new TypeError(`expected ${value} but got ${data}`);
    });
    function checkWithinRange(data, meta, description) {
      const { max = Infinity, min = -Infinity } = meta;
      if (data > max)
        throw new TypeError(`expected ${description} <= ${max} but got ${data}`);
      if (data < min)
        throw new TypeError(`expected ${description} >= ${min} but got ${data}`);
    }
    __name(checkWithinRange, "checkWithinRange");
    Schema.extend("string", (data, { meta }) => {
      if (typeof data !== "string")
        throw new TypeError(`expected string but got ${data}`);
      if (meta.pattern) {
        const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
        if (!regexp.test(data))
          throw new TypeError(`expect string to match regexp ${regexp}`);
      }
      checkWithinRange(data.length, meta, "string length");
      return [data];
    });
    Schema.extend("number", (data, { meta }) => {
      var _a;
      if (typeof data !== "number")
        throw new TypeError(`expected number but got ${data}`);
      checkWithinRange(data, meta, "number");
      const { step } = meta;
      if (step) {
        const quotient = Math.abs(data - ((_a = meta.min) != null ? _a : 0)) % step;
        if (quotient >= Number.EPSILON && quotient < step - Number.EPSILON) {
          throw new TypeError(`expected number multiple of ${step} but got ${data}`);
        }
      }
      return [data];
    });
    Schema.extend("boolean", (data) => {
      if (typeof data === "boolean")
        return [data];
      throw new TypeError(`expected boolean but got ${data}`);
    });
    Schema.extend("bitset", (data, { bits }) => {
      if (typeof data === "number")
        return [data];
      if (!Array.isArray(data))
        throw new TypeError(`expected array but got ${data}`);
      let result = 0;
      for (const value of data) {
        if (typeof value !== "string")
          throw new TypeError(`expected string but got ${value}`);
        if (!(value in bits))
          throw new TypeError(`unknown value ${value}`);
        result |= bits[value];
      }
      return [result, result];
    });
    Schema.extend("function", (data) => {
      if (typeof data === "function")
        return [data];
      throw new TypeError(`expected function but got ${data}`);
    });
    Schema.extend("is", (data, { callback }) => {
      if (data instanceof callback)
        return [data];
      throw new TypeError(`expected ${callback.name} but got ${data}`);
    });
    function property(data, key, schema) {
      const [value, adapted] = Schema.resolve(data[key], schema);
      if (!isNullable(adapted))
        data[key] = adapted;
      return value;
    }
    __name(property, "property");
    Schema.extend("array", (data, { inner, meta }) => {
      if (!Array.isArray(data))
        throw new TypeError(`expected array but got ${data}`);
      checkWithinRange(data.length, meta, "array length");
      return [data.map((_, index2) => property(data, index2, inner))];
    });
    Schema.extend("dict", (data, { inner, sKey }, strict) => {
      if (!isPlainObject(data))
        throw new TypeError(`expected object but got ${data}`);
      const result = {};
      for (const key in data) {
        let rKey;
        try {
          rKey = Schema.resolve(key, sKey)[0];
        } catch (error) {
          if (strict)
            continue;
          throw error;
        }
        result[rKey] = property(data, key, inner);
        data[rKey] = data[key];
        if (key !== rKey)
          delete data[key];
      }
      return [result];
    });
    Schema.extend("tuple", (data, { list }, strict) => {
      if (!Array.isArray(data))
        throw new TypeError(`expected array but got ${data}`);
      const result = list.map((inner, index2) => property(data, index2, inner));
      if (strict)
        return [result];
      result.push(...data.slice(list.length));
      return [result];
    });
    function merge(result, data) {
      for (const key in data) {
        if (key in result)
          continue;
        result[key] = data[key];
      }
    }
    __name(merge, "merge");
    Schema.extend("object", (data, { dict }, strict) => {
      if (!isPlainObject(data))
        throw new TypeError(`expected object but got ${data}`);
      const result = {};
      for (const key in dict) {
        const value = property(data, key, dict[key]);
        if (!isNullable(value) || key in data) {
          result[key] = value;
        }
      }
      if (!strict)
        merge(result, data);
      return [result];
    });
    Schema.extend("union", (data, { list, toString }) => {
      const messages = [];
      for (const inner of list) {
        try {
          return Schema.resolve(data, inner);
        } catch (error) {
        }
      }
      throw new TypeError(`expected ${toString()} but got ${JSON.stringify(data)}`);
    });
    Schema.extend("intersect", (data, { list, toString }, strict) => {
      let result;
      for (const inner of list) {
        const value = Schema.resolve(data, inner, true)[0];
        if (isNullable(value))
          continue;
        if (isNullable(result)) {
          result = value;
        } else if (typeof result !== typeof value) {
          throw new TypeError(`expected ${toString()} but got ${JSON.stringify(data)}`);
        } else if (typeof value === "object") {
          result = { ...result, ...value };
        } else if (result !== value) {
          throw new TypeError(`expected ${toString()} but got ${JSON.stringify(data)}`);
        }
      }
      if (!strict && isPlainObject(data))
        merge(result, data);
      return [result];
    });
    Schema.extend("transform", (data, { inner, callback }) => {
      const [result, adapted = data] = Schema.resolve(data, inner, true);
      if (isPlainObject(data)) {
        const temp = {};
        for (const key in result) {
          if (!(key in data))
            continue;
          temp[key] = data[key];
          delete data[key];
        }
        Object.assign(data, callback(temp));
        return [callback(result)];
      } else {
        return [callback(result), callback(adapted)];
      }
    });
    function defineMethod(name, keys, format) {
      Object.assign(Schema, {
        [name](...args) {
          const schema = new Schema({ type: name });
          schema.toString = format.bind(null, schema);
          keys.forEach((key, index2) => {
            var _a;
            switch (key) {
              case "sKey":
                schema.sKey = (_a = args[index2]) != null ? _a : Schema.string();
                break;
              case "inner":
                schema.inner = Schema.from(args[index2]);
                break;
              case "list":
                schema.list = args[index2].map(Schema.from);
                break;
              case "dict":
                schema.dict = valueMap(args[index2], Schema.from);
                break;
              case "bits": {
                schema.bits = {};
                for (const key2 in args[index2]) {
                  if (typeof args[index2][key2] !== "number")
                    continue;
                  schema.bits[key2] = args[index2][key2];
                }
                break;
              }
              default:
                schema[key] = args[index2];
            }
          });
          if (name === "object" || name === "dict") {
            schema.meta.default = {};
          } else if (name === "array" || name === "tuple") {
            schema.meta.default = [];
          } else if (name === "bitset") {
            schema.meta.default = 0;
          }
          return schema;
        }
      });
    }
    __name(defineMethod, "defineMethod");
    defineMethod("is", ["callback"], ({ callback }) => callback.name);
    defineMethod("any", [], () => "any");
    defineMethod("never", [], () => "never");
    defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
    defineMethod("string", [], () => "string");
    defineMethod("number", [], () => "number");
    defineMethod("boolean", [], () => "boolean");
    defineMethod("bitset", ["bits"], () => "bitset");
    defineMethod("function", [], () => "function");
    defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
    defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
    defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
    defineMethod("object", ["dict"], ({ dict }) => {
      if (Object.keys(dict).length === 0)
        return "{}";
      return `{ ${Object.entries(dict).map(([key, inner]) => {
        return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
      }).join(", ")} }`;
    });
    defineMethod("union", ["list"], ({ list }, inline) => {
      const result = list.map(({ toString: format }) => format()).join(" | ");
      return inline ? `(${result})` : result;
    });
    defineMethod("intersect", ["list"], ({ list }) => {
      return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
    });
    defineMethod("transform", ["inner", "callback"], ({ inner }, isInner) => inner.toString(isInner));
    module.exports = Schema;
  }
});
var lib_default = require_src();

export {
  noop,
  isNullable,
  isPlainObject,
  valueMap,
  clone,
  pick,
  omit,
  defineProperty,
  contain,
  intersection,
  difference,
  union,
  deduplicate,
  remove,
  makeArray,
  capitalize,
  uncapitalize,
  camelCase,
  paramCase,
  snakeCase,
  camelize,
  hyphenate,
  trimSlash,
  sanitize,
  Time,
  lib_default
};
//# sourceMappingURL=chunk-XAQPHSB2.js.map
