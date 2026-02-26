# this指向

this 的指向，是在函数 **被调用的时候确定的（运行时绑定）**，而不是在定义的时候确定的。 **只有箭头函数除外**。

- 4种标准规则
- 1种特殊规则

## 4种标准规则

### 1. 默认绑定

- 在全局作用域下调用函数
- 在非严格模式下，this指向window
- 在严格模式下，this指向undefined

```js
function foo() {
  console.log(this);
}

foo(); // window
```

### 2. 隐式绑定

- 在对象的方法中调用函数
- this指向调用该方法的对象

```js
const obj = {
  name: "obj",
  foo: function () {
    console.log(this.name);
  },
};

obj.foo(); // obj
```

### 3. 显式绑定

- 使用 call、apply、bind 方法调用函数
- this指向传入的对象

```js
function foo() {
  console.log(this.name);
}

const obj = {
  name: "obj",
};

foo.call(obj); // obj
foo.apply(obj); // obj
foo.bind(obj)(); // obj
```

### 4. new 绑定

- 使用 new 关键字调用函数
- this指向新创建的对象

```js
function Person(name) {
  this.name = name;
}

const person = new Person("person");
console.log(person.name); // person
```

## 1种特殊规则

### 箭头函数

- 箭头函数没有自己的this
- 箭头函数的this指向定义时的this

```js
const obj = {
  name: "obj",
  foo: function () {
    const arrowFunc = () => {
      console.log(this.name);
    };
    arrowFunc();
  },
};

obj.foo(); // obj
```

## 优先级

new 绑定 > 显式绑定 (call/apply/bind) > 隐式绑定 (obj.method) > 默认绑定

> 注：箭头函数优先级最高，因为它根本不走这套绑定流程，它是词法作用域层面的
