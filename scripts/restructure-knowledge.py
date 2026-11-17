"""One-time, lossless IA migration. Run from the repository root with python3 -I.
The persistent manifest powers later content-retention checks; no original body is rewritten.
"""
from pathlib import Path
import hashlib
import json
import re
import posixpath

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
MANIFEST = ROOT / 'scripts/content-migration.json'
if MANIFEST.exists():
    raise SystemExit('Migration already applied. Use catalog:check to validate it.')

nav_path = DOCS / '.vitepress/navigation.ts'
nav_text = nav_path.read_text()
tree = json.loads(nav_text.split('export const noteCategories: NoteCategory[] = ', 1)[1].split('\n];', 1)[0] + '\n]')
originals = {p.relative_to(DOCS).as_posix(): p.read_text() for p in DOCS.rglob('*.md') if '.vitepress' not in p.parts and 'catalog' not in p.parts}
resources = [{'path': p.relative_to(DOCS).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size} for p in sorted(DOCS.rglob('*')) if p.is_file() and p.suffix != '.md' and '.vitepress' not in p.parts and 'catalog' not in p.parts and p.name != '.DS_Store']

def route(file):
    return '/' + (file[:-8] if file.endswith('index.md') else file[:-3])

old_nodes = {}
def visit(nodes):
    for node in nodes:
        if node.get('link'):
            old_nodes[node['link']] = node
        visit(node.get('items', []))
for cat in tree: visit(cat['items'])

# Semantic English names, not translated dates or opaque sequence numbers.
SLUGS = '''
图片类型及选择=image-formats
浏览器渲染模式=rendering-modes
微格式=microformats
替换元素=replaced-elements
css选择器=selectors
盒模型=box-model
css单位=units
css优先级=specificity
弹性布局=flexbox
盒子居中的方式=centering
瀑布流=masonry
隐藏元素的方式=hiding-elements
图片有间隙=image-gaps
移动端适配方案=responsive-design
css隔离方案=style-isolation
css预处理和后处理器=preprocessors-postprocessors
行内样式和TailwindCSS以及手写css=inline-tailwind-css
判断数据类型=type-checking
数据转换=type-conversion
==&===区别=equality-operators
包装对象=wrapper-objects
运算符=operators
值和引用=values-references
this指向=this-binding
es6新特性=es6-features
作用域和作用域链=scope-chain
闭包=closures
执行栈和执行上下文=execution-context
垃圾回收和内存泄漏=garbage-collection
原型和原型链=prototype-chain
promise(all)=promise-all
取消操作=cancellation
Set-Map-WeakSet-WeakMap=collections
map和weakMap的区别=map-weakmap
set和weakSet区别=set-weakset
深拷贝浅拷贝=copying
字符串常用方法=string-methods
数组常用方法=array-methods
object常用方法=object-methods
lodash常用方法=lodash-methods
柯里化函数=currying
防抖节流=debounce-throttle
ESM静态结构-CJS动态结构=esm-static-cjs-dynamic
ESM与CJS的值拷贝与引用=module-bindings
ts模块判断=module-detection
浏览器组成=components
浏览器架构=multiprocess-architecture
浏览器的渲染进程=rendering-process
浏览器内核一览=engines
阻塞渲染=render-blocking
回流重绘=reflow-repaint
浏览器的事件循环=event-loop
DOM事件流=dom-events
DOM尺寸和位置属性=dom-geometry
DocumentFragment=document-fragment
WebApis=dom-bom
Storage-cookie=storage-cookies
indexedDB=indexeddb
FileReader=file-reader
webworkers=web-workers
独立标签页通信=tab-communication
SSE=server-sent-events
输入URL后=url-lifecycle
DNS解析=dns
HTTP-HTTPS=http-https
HTTP演进=http-evolution
GET-POST=get-post
readyState&响应状态码=xhr-states-status
HTTP请求与流式通信=http-streaming
HTTP缓存=http-cache
强缓存&哈希值=cache-content-hashing
缓存位置=cache-storage
CS架构缓存体系=client-server-caching
跨域=cors
JSONP=jsonp
JWT=jwt
鉴权方案=authentication
加密算法=cryptography
网络安全攻击=web-security
TLS=tls
CA=certificate-authorities
TCP=tcp
TCP可靠的原因-UDP=tcp-reliability-udp
TCP粘包与拆包=tcp-framing
websocket握手=websocket-handshake
数据通信的基础模式=communication-patterns
文件上传=file-upload
文件下载=file-download
断点续传=resumable-transfer
nginx配置详解=nginx
负载均衡=load-balancing
RESTful与RPC=rest-rpc
代理TUN与fake-IP=proxy-tun-fake-ip
SSH远程连接=ssh
ELB=elastic-load-balancing
vue3项目搭建指南=project-setup
环境变量=environment-variables
composition-api-options-api=composition-options-api
setup函数=setup
vue2-vue3差异=vue2-vue3
vueuse库=vueuse
vue中hook=composables
ref和reactive=ref-reactive
ref和reactive回答=reactivity-answer
ref-reactive=ref-reactive-notes
响应式机制=reactivity-mechanism
数组响应式原理=array-reactivity
computed-watch=computed-watch
computed如何实现双向绑定=computed-two-way-binding
虚拟DOM=virtual-dom
状态变化到UI渲染流程=state-to-ui
nextTick=next-tick
vue发请求的时机=request-timing
生命周期中写异步函数是否阻塞组件的挂载和渲染=async-lifecycle-rendering
vue3-h-function=render-function
vue编译器的实现原理=compiler
vue生命周期=lifecycle
2和3生命周期=lifecycle-comparison
动态绑定class和style=class-style
v-for中的key=list-keys
v2-model=v-model-vue2
v3-model原理=v-model-vue3
scope原理=scoped-css
组件间通信方式=component-communication
组件间通信方式2=component-communication-notes
vue.use()=plugin-installation
keep-alive原理=keep-alive
keep-alive常见坑=keep-alive-pitfalls
keep-alive滚动位置丢失=keep-alive-scroll
路由模式=router-modes
Vue路由=vue-router
vuex&pinia=vuex-pinia
前端性能优化=frontend-performance
首屏加载慢如何解决=initial-load
骨架屏=skeleton-screen
网络性能优化=network-performance
拖拽组件=drag-component
组件封装=component-design
组件封装主题色=component-theming
全局loading=global-loading
render函数动态vnode渲染=dynamic-vnode
懒加载=lazy-loading
上拉加载=infinite-scroll
长列表=virtual-list
动态路由与权限=dynamic-routing
RBAC动态路由=rbac-routing
流式响应=streaming-response
响应顺序导致渲染错位=response-ordering
自定义栈逻辑页面切换效果=stack-navigation
跳转特效=navigation-animation
人类行为验证=human-verification
IOS-app跳转=ios-share-navigation
AI对话复制=chat-copy
前端学习路线=learning-roadmap
Agent的模块构成=agent-modules
Subagent与多Agent协作及通信机制=collaboration-communication
Harness的模块构成=harness-modules
MCP系统性知识=mcp-fundamentals
Pi-Agent-MCP=pi-agent-mcp
MCP平台自研方案=platform-design
mcpServer工具如何变成agentTool=server-tools-to-agent-tools
RAG=rag-basics
提示词工程=prompt-engineering
模型训练过程=model-training
异步流处理=async-streams
map和redis=map-vs-redis
原子扣费=atomic-billing
skill模版=skill-template
概念=extension-concepts
针对面试=project-interview
算法=practice-tracker
前端面试=frontend-interview-prompt
复习记录=review-journal
设计模式=design-patterns
BFF=bff
Web渲染策略=web-rendering-strategies
前端渲染模式=frontend-rendering-modes
静态server&动态server=static-dynamic-servers
关系型数据库和文档型数据库=relational-document-databases
Node事件循环机制=event-loop
模块判断=module-system
Observable=nestjs-observable
前端工程化的理解=engineering-principles
前端工程化=toolchain-overview
Monorepo=monorepo
模块化规范=module-standards
ESM-vs-CJS=esm-vs-cjs
CDN工作原理=cdn
webpack打包流程=webpack-pipeline
Plugin和Loader的区别=plugins-loaders
提升webpack打包速度=webpack-performance
项目打包后体积优化=bundle-size
TreeShaking=tree-shaking
vite为啥快=vite-performance
webpack&vite=webpack-vite
HMR原理和机制=hot-module-replacement
vite配置文件解读=vite-config
npm-vs-pnpm=npm-vs-pnpm
pnpm-npm=package-manager-notes
eslint-prettier配置=eslint-prettier
husky-lint-stage=husky-lint-staged
单元测试=unit-testing
CICD=ci-cd
本地测试生产模式对比=development-production
团队协作组件复用=team-component-reuse
文档档案对照=document-types
lodash库=lodash-overview
计算机网络五层模型=five-layer-model
正向代理&反向代理=forward-reverse-proxy
分支开发流程=branch-workflow
git语法=git-basics
执行shell的方式=execution-methods
shell配置文件读取顺序=startup-files
'''
slugs = dict(line.rsplit('=', 1) for line in SLUGS.strip().splitlines())

# Preserve old topic grouping, but give every real group an independent entry.
GROUP_DIRS = {
 'frontend': ['html','css','javascript','typescript','browser','network','vue','performance','practice'],
 'ai': ['llm','prompt-engineering','rag','agent'],
 'engineering': ['architecture','nodejs','backend-frameworks','fullstack-frameworks','toolchain','practice'],
 'computer-science': ['networking','algorithms',None],
 'interview': ['frontend','ai','system-design','algorithms','question-bank'],
 'tools': ['git','shell','developer-tools'],
}
AGENT_DIRS = ['architecture','multi-agent','harness','mcp','extensions','ecosystem']
CHILD_SLUGS = {
 'CSS': ['basics','layout','engineering'],
 'JavaScript': ['basics','scope','prototypes','async','collections','apis','modules'],
 '浏览器': ['architecture','rendering','dom','storage','web-apis'],
 '网络': ['http','caching','authentication','security','transport','realtime','files','server-interaction'],
 'Vue': ['basics','reactivity','rendering','lifecycle','templates','components','keep-alive','routing'],
 '前端业务实践': ['components','loading','routing','streaming','typewriter','interaction'],
 '工程化': ['concepts','build','quality','collaboration','documentation'],
}

for cat in tree:
 if cat['id'] == 'interviews': cat['id'] = 'interview'
 cat['link'] = '/' + cat['id'] + '/'
 for idx,node in enumerate(cat['items']):
  subdir = GROUP_DIRS[cat['id']][idx]
  if subdir:
   node['directory'] = cat['id'] + '/' + subdir
   node['indexLink'] = '/' + node['directory'] + '/'
   if node['text'] == 'Agent Engineering':
    for i,child in enumerate(node['items']):
     child['directory'] = node['directory'] + '/' + AGENT_DIRS[i]
     child['indexLink'] = '/' + child['directory'] + '/'

# Map every original article. Use one semantic English slug per old body, retain variants.
entries = []
for old,text in sorted(originals.items()):
 if old == 'index.md': continue
 oldroute = route(old)
 node = old_nodes.get(oldroute)
 title = node['text'] if node else (re.search(r'^# (.+)$', text, re.M).group(1) if re.search(r'^# (.+)$', text, re.M) else Path(old).stem)
 stem = Path(old).stem
 slug = slugs.get(stem, 'streaming-typewriter' if stem=='流式打字机' else 'archive' if old.startswith('superpowers/') else stem.lower())
 if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*', slug):
  raise SystemExit(f'Missing semantic slug: {old}')
 folder = ''
 if old.startswith('AI/'):
  if stem in ['Agent的模块构成']: folder='ai/agent/architecture'
  elif stem.startswith('Subagent'): folder='ai/agent/multi-agent'
  elif stem in ['Harness的模块构成','deepseek-harness']: folder='ai/agent/harness'
  elif stem in ['MCP系统性知识','Pi-Agent-MCP','MCP平台自研方案','mcpServer工具如何变成agentTool']: folder='ai/agent/mcp'
  elif stem=='openclaw': folder='ai/agent/ecosystem'
  elif stem=='RAG': folder='ai/rag'
  elif stem=='提示词工程': folder='ai/prompt-engineering'
  elif stem=='模型训练过程': folder='ai/llm'
  elif stem in ['异步流处理','map和redis','原子扣费']: folder='engineering/architecture'
  elif stem=='流式打字机': folder='frontend/practice'; slug='streaming-typewriter'
  elif stem in ['skill模版','概念']: folder='ai/agent/extensions'
  elif stem=='算法': folder='interview/algorithms'
  elif stem=='针对面试': folder='interview/question-bank'
 elif old.startswith('408/'): folder='computer-science/networking'
 elif old.startswith('git/'): folder='tools/git'
 elif old.startswith('tools/'): folder='tools/developer-tools' if stem=='debug' else 'tools/shell'
 elif old.startswith('skill/'): folder='ai/agent/extensions'; slug='skill'
 elif old.startswith('rule/'): folder='ai/agent/extensions'; slug='rule'
 elif old.startswith('prompt/'): folder='interview/question-bank' if stem=='复习记录' else 'ai/prompt-engineering'
 elif old.startswith('superpowers/'):
  folder='engineering/practice'; slug='search-implementation-plan' if '/plans/' in old else 'search-design-spec'; title='站内搜索实施计划（历史记录）' if '/plans/' in old else '站内搜索设计方案（历史记录）'
 elif old.startswith('interview/html/'):
  folder='frontend/browser' if stem=='浏览器渲染模式' else 'frontend/html'
 elif old.startswith('interview/css/'):
  folder='frontend/browser' if stem=='canvas' else 'frontend/css'
  if stem=='canvas': slug='canvas-drawing'
 elif old.startswith('interview/js/'): folder='frontend/javascript'
 elif old.startswith('interview/浏览器/'): folder='frontend/browser'
 elif old.startswith('interview/网络/'):
  if stem in ['TCP','TCP可靠的原因-UDP','TCP粘包与拆包','DNS解析','数据通信的基础模式']: folder='computer-science/networking'
  elif stem=='SSH远程连接': folder='tools/shell'
  elif stem=='代理TUN与fake-IP': folder='tools/developer-tools'
  elif stem in ['nginx配置详解','负载均衡','ELB','RESTful与RPC']: folder='engineering/architecture'
  elif stem=='网络性能优化': folder='frontend/performance'
  else: folder='frontend/network'
 elif old.startswith('interview/vue/'):
  folder='interview/frontend' if stem=='ref和reactive回答' else 'frontend/vue'
 elif old.startswith('interview/性能优化/'): folder='frontend/performance'
 elif old.startswith('interview/业务场景/'):
  folder='frontend/practice'
  if stem=='index': slug='loading-practice-notes'; title='列表与加载综合实践'
 elif old.startswith('interview/前端工程化/'):
  folder='engineering/toolchain'
  if stem in ['设计模式','BFF','Web渲染策略','前端渲染模式','静态server&动态server','关系型数据库和文档型数据库']: folder='engineering/architecture'
  if stem in ['ESM-vs-CJS','模块化规范','lodash库']: folder='frontend/javascript'
  if stem=='ESM-vs-CJS': slug='esm-vs-cjs-engineering-notes'
 elif old.startswith('interview/node/'):
  folder='engineering/backend-frameworks' if stem=='Observable' else 'engineering/nodejs'
 elif old.startswith('frontend/HTML/'):
  folder='frontend/html'
  if stem=='index': slug='html-overview'
 elif old.startswith('frontend/CSS/'):
  folder='frontend/css'
  if stem=='index': slug='css-original-overview'; title='CSS 原始概览（简记）'
 elif old.startswith('frontend/JavaScript/frontend-frameworks/vue3/'):
  folder='frontend/vue'
  if stem in ['nextTick','scope原理','动态绑定class和style','slot']: slug += '-notes'
 elif old.startswith('frontend/JavaScript/JavaScript-Flavours/'):
  folder='frontend/typescript'
  if stem=='TypeScript': slug='typescript-overview'
 elif old.startswith('frontend/JavaScript/backend-frameworks/'):
  folder='engineering/fullstack-frameworks' if '/nextjs/' in old else 'engineering/backend-frameworks'
  if stem=='index':
   slug='nextjs' if '/nextjs/' in old else 'express' if '/express/' in old else 'backend-original-overview'
 elif old.startswith('frontend/JavaScript/'):
  folder='frontend/javascript'
  if stem=='index': slug='javascript-original-overview'; title='JavaScript 原始概览（简记）'
 elif old.startswith('frontend/'): folder='frontend/practice' if stem=='AI对话复制' else 'frontend'
 if not folder: raise SystemExit('Unclassified: '+old)
 doc_type='interview' if folder.startswith('interview/') else 'comparison' if any(w in slug for w in ['vs','comparison','-notes','bindings']) else 'architecture' if any(w in slug for w in ['architecture','modules','pipeline','design','harness','communication','compiler']) else 'concept'
 if old.startswith('superpowers/'): doc_type='archive'
 if stem=='skill模版': doc_type='template'
 status = 'planned' if not text.strip() else node.get('status') if node else None
 if status is None and len(text.strip())<120: status='outline'
 entries.append({'oldPath':old,'newPath':folder+'/'+slug+'.md','oldRoute':oldroute,'route':'/'+folder+'/'+slug,'title':title,'slug':slug,'category':folder.split('/')[0],'topic':'/'+folder+'/','docType':doc_type,'status':status,'sha256':hashlib.sha256(text.encode()).hexdigest(),'bytes':len(text.encode())})

by_old = {e['oldPath']:e for e in entries}
by_route = {e['oldRoute']:e for e in entries}
assert len({e['newPath'] for e in entries})==len(entries), 'Duplicate destination'

# Record links at exact offsets; integrity checks replay replacements from right to left.
# Only inline Markdown links outside fenced code are changed.
link_re = re.compile(r'(!?\[[^\]\n]*\]\()([^\n]*?)(\))')

def migrate_links(old,text):
 replacements=[]
 fenced=False; fence_char=''; offset=0
 for line in text.splitlines(keepends=True):
  fence=re.match(r'^\s*(`{3,}|~{3,})',line)
  if fence:
   if not fenced: fenced=True; fence_char=fence.group(1)[0]
   elif fence.group(1)[0]==fence_char: fenced=False
   offset+=len(line); continue
  if not fenced:
   for m in link_re.finditer(line):
    target=m.group(2)
    if re.match(r'^(?:[a-zA-Z]+:|#)',target): continue
    path,sep,hashpart=target.partition('#')
    if path=='协议本身的知识笔记': resolved='AI/MCP系统性知识.md'
    else: resolved=posixpath.normpath(posixpath.join(posixpath.dirname(old),path)) if not path.startswith('/') else path.lstrip('/')
    if not Path(resolved).suffix: resolved=resolved.rstrip('/')+'/index.md' if resolved.rstrip('/')+'/index.md' in by_old else resolved+'.md'
    if resolved in by_old: new=by_old[resolved]['route']+(sep+hashpart if sep else '')
    elif resolved.startswith('public/') or (DOCS/resolved).is_file():
     # Public files already have stable browser paths; non-public images get copied below.
     new='/'+resolved.removeprefix('public/') if resolved.startswith('public/') else '/assets/knowledge/'+resolved
    else: continue
    if new!=target: replacements.append({'offset':offset+m.start(2),'old':target,'new':new})
  offset+=len(line)
 for change in reversed(replacements):
  i=change['offset']; text=text[:i]+change['new']+text[i+len(change['old']):]
 return text,replacements

# Transform old tree links, preserve stable IDs, but replace history-derived ownership.
def rewrite(nodes):
 for node in nodes:
  if node.get('link') in by_route: node['link']=by_route[node['link']]['route']
  for ref in node.get('references',[]):
   if ref['link'] in by_route: ref['link']=by_route[ref['link']]['route']
  rewrite(node.get('items',[]))
for cat in tree: rewrite(cat['items'])

# Move misclassified direct entries; secondary indexes only reference their primary owner.
def detach(nodes,wanted):
 for n in list(nodes):
  if n.get('link') in wanted:
   nodes.remove(n); return n
  found=detach(n.get('items',[]),wanted)
  if found: return found

def find_group(cat_id,text):
 cat=next(c for c in tree if c['id']==cat_id)
 def find(nodes):
  for n in nodes:
   if n['text']==text and 'items' in n: return n
   result=find(n.get('items',[]))
   if result: return result
 return find(cat['items'])
for e in entries:
 cat=next(c for c in tree if c['id']==e['category'])
 owner=next((c for c in tree if any(n.get('link')==e['route'] for n in [])),None)
 # Locate existing owner and move across categories or corrected browser grouping.
 def has(nodes): return any(n.get('link')==e['route'] or has(n.get('items',[])) for n in nodes)
 old_owner=next((c for c in tree if has(c['items'])),None)
 needs_move=old_owner and (old_owner['id']!=e['category'] or e['oldPath']=='interview/html/浏览器渲染模式.md' or e['oldPath']=='interview/css/canvas.md')
 if needs_move:
  node=detach(old_owner['items'],{e['route']})
  # Maintain useful cross-domain relationships as references, never duplicate primary articles.
  fallback=old_owner['items'][0]
  fallback.setdefault('references',[]).append({'text':e['title'],'link':e['route']})
  node.pop('id',None)
 elif not old_owner:
  node={'text':e['title'],'link':e['route']}
 else: continue
 candidates=[]
 def groups(nodes):
  for n in nodes:
   if n.get('directory') and e['newPath'].startswith(n['directory']+'/'): candidates.append(n)
   groups(n.get('items',[]))
 groups(cat['items'])
 if candidates: parent=max(candidates,key=lambda n:len(n['directory']))
 else:
  parent=find_group(cat['id'],'前端业务实践') if e['category']=='frontend' else cat['items'][0]
 # Browser fixes belong to a meaningful group, not a random last leaf.
 if e['oldPath']=='interview/html/浏览器渲染模式.md': parent=find_group('frontend','浏览器渲染原理')
 if e['oldPath']=='interview/css/canvas.md': parent=find_group('frontend','Web API')
 parent.setdefault('items',[]).append(node)
 if e['status']: node['status']=e['status']

# Remove leaf-only outline directories from the menu; future directions live in entry guidance.
for cat in tree:
 cat['items']=[n for n in cat['items'] if not (n['text']=='计算机组成与操作系统')]
 for node in cat['items']:
  # Group links and original article links have separate purposes.
  if node.get('directory'):
   node.setdefault('description',cat['description'])

# Build clean node IDs, and use index routes/anchors for subsection groups (max filesystem depth 4).
def assign_ids(cat,nodes,parent_dir):
 used=set()
 for i,n in enumerate(nodes):
  seed=n.get('id') or (n.get('link','').rsplit('/',1)[-1] or 'section')
  if seed in used: seed += '-'+str(i+1)
  used.add(seed); n['id']=seed
  own_dir=n.get('directory',parent_dir)
  if n.get('items') and not n.get('indexLink'):
   n['indexLink']='/'+parent_dir+'/#'+n['id']
  assign_ids(cat,n.get('items',[]),own_dir)
for cat in tree: assign_ids(cat,cat['items'],cat['id'])

# Stable compatibility routes, generated only in build output (never duplicated in search).
aliases={}
for e in entries:
 if e['oldRoute']!=e['route']:
  aliases[e['oldRoute']]=e['route']
  if e['oldRoute'].endswith('/'):
   aliases[e['oldRoute']+'index']=e['route']
   aliases[e['oldRoute']+'index.html']=e['route']
  else: aliases[e['oldRoute']+'.html']=e['route']
for idx,cat in enumerate(tree):
 oldid='interviews' if cat['id']=='interview' else cat['id']
 aliases['/catalog/'+oldid+'/']=cat['link']
 aliases['/catalog/'+oldid+'/index.html']=cat['link']
 # Old category anchors point to new topic indexes where a route exists.
 def add_anchor(nodes):
  for n in nodes:
   aliases['/catalog/'+oldid+'/#'+n['id']]=n.get('indexLink') or n.get('link') or cat['link']
   add_anchor(n.get('items',[]))
 add_anchor(cat['items'])

manifest={'version':1,'originalMarkdownCount':len(originals),'originalMarkdownBytes':sum(len(t.encode()) for t in originals.values()),'homepageSha256':hashlib.sha256(originals['index.md'].encode()).hexdigest(),'articles':entries,'resources':resources}

# Snapshot first; remove old Markdown only after all original bodies are in memory.
for old in originals:
 if old!='index.md': (DOCS/old).unlink()
for e in entries:
 oldtext=originals[e['oldPath']]
 text,changes=migrate_links(e['oldPath'],oldtext)
 e['linkChanges']=changes
 # Keep original frontmatter in place, including Skill template fields.
 front=''
 if text.startswith('---\n'):
  end=text.find('\n---',4)
  if end>=0:
   front=text[4:end]+'\n'; text=text[end+4:].lstrip('\n')
 # Record exact original frontmatter/body handling for later byte-for-byte verification.
 transformed=migrate_links(e['oldPath'],oldtext)[0]
 e['originalContentPrefix']=transformed[:len(transformed)-len(text)] if front else ''
 e['originalFrontmatter']=bool(front)
 fields={'title':e['title'],'description':e['title']+'：'+next(c['description'] for c in tree if c['id']==e['category']),'tags':[next(c['text'] for c in tree if c['id']==e['category'])], 'docType':e['docType'],'knowledgeTopic':e['topic'],'migrationSource':e['oldPath']}
 if e['status']: fields['status']=e['status']
 metadata=''.join(k+': '+json.dumps(v,ensure_ascii=False)+'\n' for k,v in fields.items() if not re.search(r'^'+re.escape(k)+r':',front,re.M))
 e['metadataPrefix']='---\n'+front+metadata+'---\n\n'
 e['migratedBodySha256']=hashlib.sha256(text.encode()).hexdigest()
 e['transformedOriginalSha256']=hashlib.sha256(migrate_links(e['oldPath'],oldtext)[0].encode()).hexdigest()
 dest=DOCS/e['newPath']; dest.parent.mkdir(parents=True,exist_ok=True); dest.write_text(e['metadataPrefix']+text)

# Keep all original resources; publish exact copies of referenced diagrams and standalone examples.
from shutil import copyfile
for r in resources:
 if r['path'].startswith('public/'): continue
 if Path(r['path']).suffix.lower() in ['.png','.jpg','.jpeg','.svg','.gif','.webp']:
  dest=DOCS/'public/assets/knowledge'/r['path']; dest.parent.mkdir(parents=True,exist_ok=True); copyfile(DOCS/r['path'],dest)
 elif Path(r['path']).suffix.lower() in ['.js','.ts','.html','.yaml']:
  dest=DOCS/'public/examples'/r['path']; dest.parent.mkdir(parents=True,exist_ok=True); copyfile(DOCS/r['path'],dest)
  r['publicRoute']='/examples/'+r['path']

MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(DOCS/'.vitepress/legacy-routes.json').write_text(json.dumps(aliases,ensure_ascii=False,indent=2)+'\n')
(DOCS/'.vitepress/knowledge-tree.json').write_text(json.dumps(tree,ensure_ascii=False,indent=2)+'\n')
print(f'Migrated {len(entries)} original articles; preserved {len(resources)} resources. Homepage retained.')
