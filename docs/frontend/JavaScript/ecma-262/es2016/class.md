# Class 类

## 前置知识

### TS 中的类 VS ES2016 中的类

- 类 (Class)：TS 的类就是 ES2016 的类，但加了“访问控制”和“类型检查”。

  - ES2016：只有 constructor、方法、继承。
  - TypeScript：在 ES2016 基础上增加了：

    - 修饰符：public, private, protected, readonly (这些在 JS 运行时会被移除)。
    - 属性类型声明。
    - abstract (抽象类)。

- implements (实现接口)：TS 独有。

  - 为了在写代码时指明"对象长啥样"，用于定义契约（Contract）和形状（Shape）

## 一、面向对象编程（OOP）

### 含义

- 一种编程范式，将程序组织成一组相互作用的对象。
  - 数据（属性/状态）
  - 行为（方法/功能）

### 核心思想

1. 抽象：提取事物的本质特征，忽略无关细节
2. 封装：将数据和操作数据的方法绑定在一起，隐藏内部实现
3. 继承：子类可以继承父类的属性和方法，实现代码复用
4. 多态：同一个方法在不同对象上有不同的表现

### 优势

| 优势         | 说明                               |
| ------------ | ---------------------------------- |
| **代码复用** | 通过继承避免重复代码               |
| **易于维护** | 修改集中在类定义中                 |
| **模块化**   | 将复杂问题分解成小的、可管理的对象 |
| **贴近现实** | 用对象模拟现实世界的实体           |

## 二、Class 的基本语法

**语法结构：**

- `constructor()`
  - 构造方法，创建和初始化对象实例
  - 每个类只能有一个，不写默认为空`constructor() {}`
  - 默认返回 this（新创建的实例）
  - 创建实例时自动调用
- 方法定义不需要 `function` 关键字
- 方法之间不需要逗号分隔

---

### Class 的方法

#### 1.实例方法

```js
class Person {
  sayHello() {
    console.log(`Hello, my name is ${this.name}`);
  }
}
```

#### 2. 静态方法

`static` 关键字：

```js
class Person {
  static count = 0;
  static getCount() {
    return this.count; // this 指向类本身！！！
  }
}
```

#### 3. 私有方法

`#` 前缀：

```js
class Person {
  #privateMethod() {
    console.log("This is a private method");
  }
}
```

---

### Class 的属性

#### 1. 实例属性

- 在 constructor 中定义

```js
class Person {
  constructor(name) {
    this.name = name;
  }
}
```

- 类字段

```js
class Person {
  name = "John";
}
```

#### 2. 静态属性

`static` 关键字：

```js
class Person {
  static count = 0;
}
```

#### 3. 私有属性

`#` 前缀：

```js
class Person {
  #privateProperty = "private";
}
```

#### 4. 访问器属性

使用 `get` 和 `set` 关键字定义：

```js
class Person {
  constructor(name) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }
}
```

---

### 属性和方法的可访问性对比

| 类型         | 关键字/前缀 | 定义位置               | 访问方式（外部） | 访问方式（内部）                           | 说明                                             |
| :----------- | :---------- | :--------------------- | :--------------- | :----------------------------------------- | :----------------------------------------------- |
| **实例成员** | 无          | 类的顶层或 constructor | `instance.xxx`   | `this.xxx`                                 | 属于**每个实例对象**，可以被继承                 |
| **静态成员** | `static`    | 类的顶层               | `Class.xxx`      | `Class.xxx` 或 `this.xxx` (仅在静态方法中) | 属于**类本身**，不能通过实例访问                 |
| **私有成员** | `#`         | 类的顶层               | ❌ 不可访问      | `this.#xxx`                                | 只能在**类定义的内部**访问，实例和子类都无法访问 |

---

### Class 的继承

#### 1. `super` 作为函数调用（在 constructor 中）

- 调用父类的构造函数
- 必须在使用 `this` 之前调用，因为子类没有自己的 this，必须先调用父类的构造函数创建 this，子类才能使用 this
- 只能在子类的 constructor 中使用

```js
class Student extends Person {
  constructor(name, age) {
    super(name); // 相当于：Person.constructor(name)
    this.age = age;
  }
}
```

#### 2. `super` 作为对象使用

```js
class Father {
  cook() {
    return "番茄炒蛋"; // 爸爸的做法
  }

  static getFamily() {
    return "张家";
  }
}
```

- 在普通方法中：`super` 指向父类的原型对象

```js
class Son extends Father {
  cook() {
    const fatherCook = super.cook();
    return `${fatherCook} + 鸡蛋`;
  }
}
```

- 在静态方法中：`super` 指向父类

```js
class Son extends Father {
  // 静态方法中调用父类静态方法
  static getFamily() {
    return super.getFamily() + "的儿子";
  }
}
```

#### 3. 注意

- 子类可以覆盖父类方法
- 子类可以直接继承父类方法

```js
class Animal {
  eat() {
    console.log("Animal is eating");
  }
  sleep() {
    console.log("Animal is sleeping");
  }
}

class Dog extends Animal {
  // 1. 覆盖 (Override)：重写父类方法
  eat() {
    console.log("Dog is eating bones");
  }
  // 2. 继承 (Inherit)：什么都不写，直接拥有 sleep 方法
}

const dog = new Dog();
dog.eat(); // "Dog is eating bones" (子类自己的)
dog.sleep(); // "Animal is sleeping"  (从父类借来的)
```

## 三、参考资源

- **MDN Web Docs**：[Classes - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- **ECMAScript 规范**：[ECMAScript® 2015 Language Specification](https://262.ecma-international.org/6.0/)
- **JavaScript.info**：[Classes](https://javascript.info/classes)
