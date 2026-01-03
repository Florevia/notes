# TypeScript

---

- 静态类型语言：编译时进行类型检查

- 强类型语言：不允许隐式类型转换

## 一、类型注解方法

### flow

1. 安装包

```sh
pnpm add flow-bin --save-dev
```

2. 配置文件

```sh
pnpm flow init
```

3. 运行检查

```sh
pnpm flow
```

---

### typescript

1. 安装包

```sh
pnpm add typescript --save-dev
# 带来 tsc（TypeScript 编译器）和 tsserver（给编辑器提供智能提示的服务）
```

2. 配置文件

```sh
pnpm tsc --init
```

3. 运行检查

```sh
# 自动读取 tsconfig.json
pnpm tsc
```

---

#### module 字段

输出模块类型

1. commonjs

当`module`字段设置为`commonjs`时，输出 commonjs 模块。

2. nodenext

让 TypeScript 的编译行为与 Node.js 运行时的模块解析逻辑保持完全一致。

- `.mts`/`.cts` 分别输出为 ES 模块 / commonjs 模块

- `.ts` 的输出根据 `package.json` 文件中的 `type` 字段来判断

  - `"type": "module"` -> 输出 ES 模块

  - `"type"` 没配置则输出 commonjs 模块

3. esnext

---

#### moduleDetection 字段

如何判断一个文件是什么类型的模块 还是全局脚本

1. auto（默认值）

- 内容特征检查：如果文件包含 `import` 和 `export` 语句，则被视为模块，否则被视为全局脚本。

- 环境配置检查：

  - 前提：`module`字段必须为`nodenext`

  - 检查`package.json`中的`type`字段，如果为`module`，则被视为 ES 模块，否则为全局脚本，因为当`type`字段为`commonjs`时，它不会因为环境配置而自动将文件视为模块。这个时候一个文件的类型将取决于其内容：

    - 如果文件包含 `import` 和 `export` 语句，则被视为模块

    - 否则被视为全局脚本

2. force（强制模式）

- 强制将每一个非声明文件（即非 .d.ts 文件）都视为模块（全面模块化）

- 即使你的文件里一行 `import` 或 `export` 都没有，它依然拥有独立的作用域

  - 默认添加 `export {}`（即：默认当成 ES 模块处理）

3. legacy（传统模式）

- （严格依赖语句）它只看文件中是否出现了显式的 `import` 或 `export` 语句。

- 即使在 package.json 中声明了是 ESM 模块，只要代码里没写 `import/export`，也会被视为全局脚本。

---

#### 配置文件

```json
{
  "compilerOptions": {
    // 让 TypeScript 完全遵循 Node.js 原生的模块解析规则（包括对 ES Modules 和 CommonJS 的混合支持）。
    "module": "nodenext",
    // 编译后的 JavaScript 版本
    "target": "es5",
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    // Recommended Options
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    // 模块检测
    "moduleDetection": "force",
    // 跳过类型库检查
    "skipLibCheck": true
  }
}
```

## 二、代码编译

- 必要性：浏览器/Node 不认识 TS，直接运行会报错。

- 方法：在构建流程中使用工具将 TS 语法剥离（Strip），生成纯净的 JavaScript 代码。

### flow

1. 安装包

```sh
pnpm add flow-remove-types --save-dev
```

2. 运行

保留空格（保留源文件的代码布局）：

```sh
pnpm flow-remove-types [src] -d [dist]
```

标准代码：

```sh
pnpm flow-remove-types [src] -d [dist] --pretty
```

### babel

1. 安装包

```sh
pnpm add @babel/core @babel/cli @babel/preset-flow --save-dev
```

2. 配置文件

`.babelrc`

```json
{
  "presets": ["@babel/preset-flow"]
}
```

3. 运行

有配置文件：

```sh
pnpm babel [src] -d [dist]
```

手动指定插件：

```sh
pnpm babel [src] -d [dist] --presets @babel/preset-flow
```

## 三、注解类型分类

### flow

#### 1. 基本类型

- `boolean`: true 或 false
- `number`: 包含 NaN 和 Infinity
- `string`: 字符串
- `null`: null 值
- `void`: undefined 值 (注意：在 Flow 中 void 专门指 undefined)
- `mixed`: 类似于 TS 的 unknown。表示任意类型，但使用前必须进行**类型细化（Refinement）**检查。
- `any`: 类似于 TS 的 any。表示任意类型，不安全，跳过类型检查。

```ts
// any 和 mixed 的区别
function foo(arg: any) {
  arg.toUpperCase(); // 编译时不报错
}

function bar(arg: mixed) {
  // 类型细化
  if (typeof arg === "string") {
    arg.toUpperCase();
  }
  if (typeof arg === "number") {
    arg.toFixed(2);
  }
}
```

#### 2. 复杂数据类型

- 数组

  - `number[]`
  - `Array<number>`

- 对象

  - `{ name: string, age: number }`
  - `{ name?: string, age: number }` name 可有可无
  - `{ [string]: string }` 新增属性键值对类型限制
  - `{| name: string |}` 对象密封性 (Exact Object Types): 竖线语法

- 函数
  - `(name: string) => void`

#### 3. 字面量类型

- `let a: 2 = 2`
- `let b: "hello" = "hello"`
- `const type: 'success' | 'warning' | 'danger' = 'success'` 一般配合联合类型使用

#### 4. Maybe 类型

- ?Type (问号前缀)：该类型可以是 Type，或者是 null，或者是 undefined。等价于 TS 中的`Type | null | undefined`
- `let a: ?number = 1`

#### 5. 类型别名

- `type MyType = number | string`
- `let a: MyType = 1`

#### 6. 联合与交叉

- 联合类型 (Union): string | number
- 交叉类型 (Intersection): A & B

---

### typescript

#### 1. 基本类型

- `boolean`: true / false
- `number`: 所有数字（包括浮点数、NaN、Infinity）
- `string`: 字符串
- `null`
- `undefined`
- `void`: 通常用于无返回值的函数
- `any`: 任意类型
- `unknown`: 安全版的 any（使用前必须进行**类型判断/收窄**）
- `never`: 永远不存在的值（例如抛出异常的函数返回值）

any 与 unknown 的区别：

```ts
// any: 错了也不管
const value: string = "lilin";
value.toFixed(); // 不报错
value = 123; // 不报错
value.foo(); // 不报错
```

```ts
// unknown: 先证明类型再操作
const value: unknown = "lilin";
// ❌ 报错：Type 'unknown' is not assignable to type 'string'.
value.toFixed();

// ✅ 正确做法：类型收窄 (Type Narrowing)
if (typeof value === "string") {
  value.toFixed(); // ok
  let value: string = "hello"; // ok
}
```

#### 2. 下一代 JS 类型

- `bigint`: 大整数（ES2020）
- `symbol`: 唯一标识

#### 3. 复杂数据类型

- 数组

  - `number[]`（推荐）
  - `Array<number>`（泛型写法）

- 元组

  - `[string, number]`：固定 长度、位置类型 的数组
  - `let x: [string, number] = ["hello", 10];`

- 对象

  - `{ name: string, age: number }`
  - `{ name?: string }`：可选属性
  - `{ readonly id: number }`：只读属性
  - `Record<string, number>`

    - 构建一个对象，它的 key 的类型是 string，value 的类型是 number

    ```ts
    const obj: Record<string, number> = {
      a: 1,
      b: 2,
    };
    ```

- 函数

  - `const add = (x: number, y: number) => number`
  - `function add(x: number): void {}`

- 枚举

  - 定义一组命名的常量。让代码更易读，意图更清晰。

```ts
// 默认从 0 开始，后续成员自动加 1
enum Color {
  Red, // 0
  Green, // 1
  Blue, // 2
}
// 或手动赋值，默认加一
enum Color2 {
  Red = 11,
  Green = 12,
  Blue = 13,
}

let c: Color = Color.Green;
console.log(c); // 输出: 1
```

- **原理**：编译后的 JS 代码其实生成了一个双向查找的对象

```ts
// 编译后的 JS
var Color;
(function (Color) {
  Color[(Color["Red"] = 0)] = "Red";
  Color[(Color["Green"] = 1)] = "Green";
  // ...
})(Color || (Color = {}));
```

#### 4. 高级类型 / 组合类型

- 联合类型 / 交叉类型

  - `string | number`
  - `A & B`

- 字面量类型

  - 把一个具体的值当作类型来使用
  - `let dir: "up" | "down";`

- 类型别名

  - 类型长，需复用
  - 区分 interface 和 type

```ts
type UserID = string; // 把 string 叫做 UserID
let id: UserID = "user_123";

// 给函数类型起别名
type Callback = (arg: string) => void;
function fn(cb: Callback) {
  cb("lilin");
}
```

- 接口

  - 专门用于定义“对象”的形状
  - 面向对象编程概念的延伸，主要用来描述“物体长什么样”以及“类应该实现什么行为”

```ts
interface User {
  name: string;
}

const user: User = {
  name: "lilin",
};
```

- 泛型

  - 为类型提供参数化，让类型更加灵活

```ts
function identity<T>(arg: T, name: string): T {
  console.log(name);
  return arg;
}

identity<string>("lilin", "name");
```

## 四、严格模式和非严格模式

### 严格模式

1. 开启

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

该选项实际上开启了一系列其他选项，包括：

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionCalls`
- `strictPropertyInitialization`
- `noImplicitOverride`
- `noPropertyAccessFromIndexSignature`
- `strictBindCallApply`
- `strictFunctionReturn`
- `strictNullChecks`

2. null 和 undefined 是独立类型。不能把它们赋值给其他类型（除非显式声明为联合类型）。

```js
// 严格模式下 ❌ 编译报错
let name: string = undefined; // Error: Type 'undefined' is not assignable to type 'string'.

// 必须显式声明
let name2: string | undefined = undefined; // ✅ 正确

// 使用前必须判空
if (name2) {
  name2.toLowerCase(); // ✅ TS 知道这里一定有值
}
```

3. 如果 TS 无法推断类型，直接报错，强迫你必须给它加一个类型注解（哪怕是显式地写 : any 也可以，但不能什么都不写。

### 非严格模式

1. null 和 undefined 是所有类型的子类型。你可以把它们赋值给 number、string 等任意类型。

```js
// 非严格模式下 ✅ 不报错
let name: string = undefined;
let age: number = null;
let obj: object = null;

name.toLowerCase(); // 运行时报错：Cannot read property 'toLowerCase' of undefined
```

2. 如果 TS 无法推断出一个变量的类型，它会由默认为 any 类型，且不报错。

## 五、类型断言 (Type Assertion)

类型断言只在编译阶段起作用，不影响运行时的行为。

### `as` 语法

```ts
let someValue: unknown = "this is a string";
let strLength: number = (someValue as string).length;
```

```ts
const value: string | number = "hello";
(value as number).toFixed(2);
```

### 非空断言 (Non-null Assertion)

当你确定一个值绝不可能是 `null` 或 `undefined` 时，可以用 `!` 排除空值。

```ts
function liveDangerously(x?: number | null) {
  // 此时 x 可能是 number | null | undefined

  console.log(x!.toFixed()); //x 一定有值
}
```

## 六、接口与类

- interface 定义形状（Shape）
- class 定义具体实现（Implementation）

### interface

#### 核心特性

1. 可选属性：使用 ? 表示。

2. 只读属性：使用 readonly 修饰。

3. 声明合并：同名的接口会自动合并成员，这是接口与类型别名（Type）的主要区别。

#### demo

```ts
// 定义接口
interface Person {
  name: string;
  readonly gender: string; // 只读属性
  address?: string; // 可选属性

  alert(): void;
}

// 一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的子集。
interface Student {
  [keyName: string]: number; // 任意属性
  name: number;
}

// 类实现接口
class Man implements Person {
  name: "lilin";
  gender: "male";
  alert() {
    console.log("alert");
  }
}
```

### class

#### 核心特性

1. 访问修饰符：

- public（默认）：到处可访问。
- private：仅在当前类内部访问。
- protected：在当前类及其子类中访问。

2. 静态成员：使用 static 定义，通过类名直接访问。

3. 抽象类：使用 abstract 关键字，不能被实例化，只能被继承

#### demo

```ts
// 定义类
class Person {
  public name: string; // 公共属性
  private age: number; // 私有属性，只有自己可以访问
  protected gender: string; // 受保护的属性，只有自己和子类可以访问

  constructor(name: string, gender: string) {
    this.name = name;
    this.age = 18;
    this.gender = gender;
  }

  sayHello() {
    console.log(`Hello, I'm ${this.age} years old`); // 向外暴露方法 访问私有属性
    console.log(this.gender); // 向外暴露方法 访问受保护属性
  }
}
// 继承：子类继承了父类所有public和protected的属性和方法
class Student extends Person {
  constructor(name: string, gender: string) {
    super(name, gender);
  }
  study() {
    console.log("study");
    console.log(this.name);
    console.log(this.gender);
  }

  test() {
    this.name; // ✅ OK
    this.gender; // ✅ OK (因为是子类，继承了受保护属性)
  }
}

// 实例化
const tom = new Student("lilin", "male");
tom.sayHello();
tom.study();
tom.age; // ❌ Error (父类的 private，子类也无权访问)
tom.gender; // ❌ Error (Property 'gender' is protected...)
tom.name; // ✅ OK
```
