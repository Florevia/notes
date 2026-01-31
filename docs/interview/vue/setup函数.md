# setup 函数

## setup() 函数写法

```vue
<script>
import { ref, computed } from "vue";

export default {
  props: ["title"],
  emits: ["update:title"],
  setup(props, context) {
    // props - 响应式的 props
    // context - 包含 attrs, slots, emit, expose

    const count = ref(0);
    const double = computed(() => count.value * 2);

    function increment() {
      count.value++;
      context.emit("update:title", count.value);
    }

    // 必须 return 暴露给模板的内容
    return { count, double, increment };
  },
};
</script>
```

## `<script setup>` 语法糖

```vue
<script setup>
import { ref, computed } from "vue";

// 编译宏，不需要 import
const props = defineProps(['title'])
const emit = defineEmits(['update'])

const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value++
  emit('update:title', count.value)
}
// 不需要 return，顶层变量自动暴露给模板
```
