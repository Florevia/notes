# FileReader API

- 浏览器提供的原生API
- 用于读取文件内容
- 允许Web应用程序异步读取存储在用户计算机上的文件（或原始数据缓冲区）的内容
- 可以将文件转换为不同的格式，如文本、二进制、Base64编码等
  
## 基本用法

```js
//创建FileReader对象
const reader = new FileReader();
// 监听读取完成事件
//参数 e：事件对象，包含读取完成后的文件内容
reader.onload = function(e) {
  console.log('文件内容:', e.target.result);
  // 读取完成后，处理文件内容
};
// 监听读取错误事件
reader.onerror = function() {
  console.error('读取文件时发生错误');
};
// 读取文件
reader.readAsText(file);
// 读取完成后，文件内容会存储在reader.result属性中
```

## 主要方法

| 方法 | 描述 |
|------|------|
| `readAsText(file, encoding)` | 以文本形式读取文件，默认编码为UTF-8 |
| `readAsDataURL(file)` | 读取文件并将结果表示为data: URL格式的字符串 |
| `readAsBinaryString(file)` | 读取文件并将结果表示为二进制字符串 |
| `readAsArrayBuffer(file)` | 读取文件并将结果表示为ArrayBuffer对象 |

## dataURL

- 以data: URL格式表示的文件内容
- 可以直接在HTML中使用，如作为图片的src属性值
- 格式为`data:[<mime-type>][;base64],<data>`
  - `<mime-type>`：文件的MIME类型，如`image/jpeg`、`text/plain`等
  - `;base64`：可选参数，指示数据是否以Base64编码
  - `<data>`：文件的实际内容，已编码为Base64（如果指定了`;base64`）或直接表示为文本

### 1. 读取文本文件

```js
// 监听文件选择事件
const fileInput = document.getElementById('fileInput');
const reader = new FileReader();

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0]; // 获取用户选择的第一个文件
  // 检查文件是否存在
  if (!file) {
    console.error('请选择一个文件');
    return;
  }
  // 监听读取完成事件，e.target.result 包含读取的结果
  reader.onload = function(e) {
    console.log('文件内容:', e.target.result);
  };
  // 监听读取错误事件
  reader.onerror = function() {
    console.error('读取文件时发生错误');
  };
  
  // 读取文件内容
  reader.readAsText(file);
});
```

### 2. 读取图片并预览

```js
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const reader = new FileReader();
// 监听文件选择事件
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0]; // 获取用户选择的第一个文件
  // 检查文件是否存在
  if (!file) {
    console.error('请选择一个文件');
    return;
  }
  // 监听读取完成事件
  reader.onload = function(e) {
    // 读取完成后，将dataURL赋值给图片元素的src属性，实现预览
    imagePreview.src = e.target.result;
  };
  // 监听读取错误事件
  reader.onerror = function() {
    console.error('读取文件时发生错误');
  };
  
  // 读取文件内容
  reader.readAsDataURL(file);
});
```

### 3. 读取文件进度显示

```javascript
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');
const reader = new FileReader();

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  
  reader.onprogress = function(e) {
    if (e.lengthComputable) {
      const percentLoaded = Math.round((e.loaded / e.total) * 100);
      progressBar.value = percentLoaded;
    }
  };
  
  reader.onload = function(e) {
    console.log('文件读取完成');
  };
  
  reader.readAsArrayBuffer(file);
});
```

## FileReader与Blob的关系

FileReader主要用于读取Blob或File对象的内容。

- Blob（Binary Large Object）表示不可变的、原始数据的类文件对象。
- File继承自Blob，并添加了文件相关的属性如name、lastModified等。

```js
// 从Blob创建File对象，参数分别为：Blob数组、文件名、MIME类型
const blob = new Blob(['Hello, world!'], { type: 'text/plain' });
const file = new File([blob], 'hello.txt', { type: 'text/plain' });

// 使用FileReader读取
const reader = new FileReader();
reader.onload = function(e) {
  console.log(e.target.result); // 输出: Hello, world!
};
reader.readAsText(file);
```

## 注意事项

1. **安全性限制**：由于安全原因，FileReader只能读取用户明确选择的文件，不能随意访问用户文件系统。

2. **内存占用**：大文件读取会占用较多内存，建议分块读取或使用流式API（如Streams API）。

3. **异步操作**：FileReader的所有读取操作都是异步的，不会阻塞主线程。

4. **错误处理**：始终应该添加错误处理逻辑，以应对文件读取失败的情况。

5. **浏览器兼容性**：FileReader在现代浏览器中广泛支持，但在IE9及以下版本不支持。

## 与其他API的配合

### 与URL.createObjectURL()的对比

```js
// 使用FileReader
const reader = new FileReader();
reader.onload = function(e) {
  img.src = e.target.result; // data: URL格式
};
reader.readAsDataURL(file);

// 使用URL.createObjectURL()
const objectURL = URL.createObjectURL(file);
img.src = objectURL;
// 使用完毕后释放URL
URL.revokeObjectURL(objectURL);
```

- FileReader.readAsDataURL()会读取整个文件并转换为Base64编码，适合小文件
- URL.createObjectURL()只是创建一个引用，不读取文件内容，适合大文件

### 文件拖放上传

```javascript
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  handleFiles(files);
});

function handleFiles(files) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // 处理文件内容
  };
  
  // 读取第一个文件
  if (files.length > 0) {
    reader.readAsText(files[0]);
  }
}
```

### 多文件处理

```javascript
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      console.log(`文件 ${index + 1} 内容:`, e.target.result);
    };
    
    // 根据文件类型选择合适的读取方法
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
});
```

## 常见问题与解决方案

### 1. 读取大文件导致内存问题

```javascript
// 使用分块读取（需要结合File.slice()）
function readFileInChunks(file, chunkSize = 1024 * 1024) {
  let offset = 0;
  
  function readNextChunk() {
    const chunk = file.slice(offset, offset + chunkSize);
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // 处理当前块
      processChunk(e.target.result);
      
      offset += chunkSize;
      if (offset < file.size) {
        readNextChunk();
      } else {
        console.log('文件读取完成');
      }
    };
    
    reader.readAsArrayBuffer(chunk);
  }
  
  readNextChunk();
}
```

### 2. 处理不同编码的文本文件

```javascript
function readTextFile(file, encoding = 'UTF-8') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      resolve(e.target.result);
    };
    
    reader.onerror = function() {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, encoding);
  });
}

// 使用示例
readTextFile(file, 'GBK')
  .then(content => console.log(content))
  .catch(error => console.error(error));
```

## 总结

FileReader API是Web开发中处理文件读取的重要工具，它提供了多种读取方法和事件处理机制，可以满足不同场景下的文件读取需求。合理使用FileReader及其相关API，可以实现丰富的文件处理功能，提升用户体验。