# 内存管理——请求调页存储管理方式模拟

[TOC]

### 开发环境

开发语言：Javascript+html+css

开发框架：Vue.js 3.0+Element-plus

开发工具：Vue-cli、Vue-devtools、VScode、Edge

### 实现方法

引入Element-plus组件作为UI，采用Vue3框架进行组件化开发

采用 JS 模拟内存管理调页请求逻辑，使用 Vue3 开发单页面应用，便于实时渲染、信息实时显示

使用链表来辅助实现LRU算法

### 提交文件说明

**dist.zip**: 项目构建后的发布版本

**MemoryScheduling**: 源代码，其中

+ ./src/App.vue

+ ./src/components/PageShow.vue

+ ./src/linklist.js

  为主要实现代码

### 项目浏览

+ 联网进入[memoryscheduling (pikachudy.github.io)](https://pikachudy.github.io/OS_MemoryScheduling/)在线浏览

+ 解压**dist**文件，在根目录下找到 **index.html** ,使用浏览器打开即可本地浏览

+ 解压**MemoryScheduling.zip**文件在根目录打开终端

  > 环境配置：
  >
  > 若未安装Node.js，需要先安装Node.js [下载 | Node.js (nodejs.org)](https://nodejs.org/zh-cn/download/)
  >
  > 若未安装Vue cli，在终端输入 `npm install -g @vue/cli` 

  运行 `npm install` 安装项目依赖包

  运行`npm run build` 构建发布版本

  在根目录下会出现**dist**文件夹，使用浏览器打开其中的 **index.html** 即可浏览

### 界面展示&UI说明

![image-20220603122830501](C:\Users\焦佳宇\AppData\Roaming\Typora\typora-user-images\image-20220603122830501.png)

#### 页面UI说明

+ 左栏：

  + 上部分为内存块信息，包含块序号、块内存放页的页号（若没有则为 null）、块起始地址（每次重置时随机给出）

  + 中间为当前已执行指令条数、当前缺页数、当前缺页率
  + 下部分为调页信息表，记录了目前为止每次调度的相关信息，包括调入的逻辑页、调至的块号、被替换出的逻辑页（若无则为 null）
  + 支持滚动条滚动翻阅所有信息

+ 右栏：

  + 记录每次指令执行的相关信息，包括指令id、指令位于的逻辑页号、包含指令的页当前在那一块内存块中（若不在内存中则为 null）、指令在内存中的地址（若不在内存中则为 null ），下一条指令的 id
  + 当指令不在内存中时，会**先显示指令缺页信息**，在缺页请求调度完成后，会**再次打印本条指令**调度后信息
  + 支持滚动条滚动翻阅所有信息

+ 顶栏：

  + 单步执行按钮：点击后执行一条指令，若发生缺页则完成缺页请求调度后**再次打印本条指令信息**
  + 自动执行按钮：通过右侧输入框设置合适的指令执行速度，点击自动执行按钮，会根据设置的执行速度自动执行指令，直到单击重置按钮或320条指令全部执行完毕
  + 重置按钮：点击后恢复到初始状态



### 源码文件功能介绍

本次的页面较为简单，实现功能的主要文件为**Pageshow.vue**及**linklist.js**

#### 文件预览

| 文件名称     | 负责内容                          | 子组件       |
| ------------ | --------------------------------- | ------------ |
| App.vue      | 页面根组件                        | PageShow.vue |
| PageShow.vue | 实现页面UI展示、整体逻辑          | null         |
| linklist.js  | 实现链表数据结构，便于实现LRU算法 | -            |

#### 主要文件源码变量介绍

##### PageShow.vue

###### 维护变量

```javascript
data() {
    return {
      run_continuously: false, //是否自动执行——与按钮相关
      interval: 0.5, //自动运行间隔
      timer: null, //存储定时器返回的对象以控制

      exe_num: 0, //已执行条数
      page_miss: 0, //缺页数
      LRUlist: new linklist(), //LRU算法辅助链表
      exe_order: [], //指令执行顺序
      mem_block_num: 4, //内存块数
      process_page_num: 32, //进程页数
      instruction_num: 320, //指令数
        
      physical_memory: [], //内存信息
      page_table: [], //页表信息
      instruction_record: [], //指令记录
      schedule_record: [], //调度记录
    };
```

###### 基本介绍

组件内部维护了请求调页存储管理的所有信息，除了基本的内存块数、进程页数、进程指令总数等参数外，还用了对象数组**physical_memory**, **page_table** 来存储各个内存块信息、页表信息，以此模拟内存管理中相应的数据结构；并设置了**instruction_record** 及**schedule_record** 来记录每次指令执行相关信息、调度相关信息以便于在表格中展示。

###### 主要对象属性介绍

**physical_memory** 数组中的内存对象包含以下属性：

+ id：内存块号
+ start_addr:  起始地址
+ length：内存地址长度——**以一个指令长为单位**
+ content：内存块中存放的信息的逻辑页号，若无则为 null

初始化函数代码：

```javascript
	memory_init() {
      let start = Math.floor(Math.random() * 5); //随机获取0-5的整数
      for (let i = 0; i < this.mem_block_num; ++i) {
        this.physical_memory.push({
          id: i, //内存号
          start_addr: i + start + "0",
          length: 10,
          content: "null", //内存块存放内容
        });
      }
    },
```



**page_table** 数组中的各个页信息包含以下属性：

+ id：逻辑页号
+ valid：有效位——标识是否在内存块中
+ memory_id：若位于内存块中，则此处记录位于的内存块号，否则为 null

初始化函数代码：

```javascript
	pagetable_init() {
      for (let i = 0; i < this.process_page_num; ++i) {
        this.page_table.push({
          id: i, //逻辑页号
          valid: false, //是否有效——是否在内存中
          memory_id: null, //位于主存块号
        });
      }
    },
```



##### linklist.js

###### 主要变量

```js
class linklist {
    constructor() {
        this.item = 0; //头结点显示当前列表长度
        this.next = null;
    }
    ...
}
```

###### 主要成员函数（方法）

```javascript
class linklist {
    ...
    //在链表末尾添加结点
    append(item) {
       ...
    }
    //删除链表末尾结点——返回被删除的结点的内容
    deleteLast() {
       ...
    }
    //寻找元素是否在链表中，若存在则返回相应位置（头结点位置为0），若不存在则返回-1
    findIndex(item) {
       ...
    }
    //将指定位置元素移至链表头（头结点后第一个）——成功返回true，失败返回false
    movetoHead(index) {
       ...
    }
    //在链表首位插入元素
    insertHead(item) {
       ...
    }
}
```



### 算法设计及实现

#### 随机指令生成算法

设指令id为0-319，共320条：

1. 在**0－318**条指令之间，随机选取一个起始执行指令，如序号为m

   ```javascript
    let randomOrder = Math.floor(Math.random() * (this.instruction_num - 1)); //随机选取起始执行指令
         let i = 0;
         this.exe_order.push(randomOrder);
         i++;
   ```

2. 顺序执行下一条指令，即序号为**m+1**的指令

   ```javascript
   	  this.exe_order.push(randomOrder + 1); //执行序号+1的指令
         i++;
   ```

3. 通过随机数，跳转到前地址部分**0－m-1**中的某个指令处，其序号为**m~1~**

   ```javascript
   	  randomOrder = Math.floor(Math.random() * randomOrder); //跳转至前0 - m-1
         this.exe_order.push(randomOrder);
         i++;
   ```

4. 顺序执行下一条指令，即序号为**m~1~+1**的指令

   ```javascript
         this.exe_order.push(randomOrder + 1); //执行序号+1的指令
         i++;
   ```

5. 通过随机数，跳转到后地址部分**m~1~+2~318**中的某条指令处，其序号为**m~2~**

   ```javascript
   	  randomOrder = Math.floor(
           Math.random() * (this.instruction_num - randomOrder - 4) + randomOrder + 2
         ); //跳转至后 m+2 - 319
         this.exe_order.push(randomOrder);
         i++;
   ```

6. 顺序执行下一条指令，即**m~2~+1**处的指令

   ```javascript
         this.exe_order.push(randomOrder + 1); //执行序号+1的指令
         i++;
   ```

7. 重复跳转到前地址部分、顺序执行、跳转到后地址部分、顺序执行的过程，直到执行完毕



#### LRU算法

LRU算法要求替换最近最少使用的块，可以用链表来实现，链表中结点值为**存有页项**的内存块号，相当于一个内存块链表。

采用以下规则确定根据LRU算法应该被替换出的块：

1. 当访问后未发生缺页时，将访问的页所在的内存块移动至链表首结点处；

   ```javascript
   	//页表处于内存中
   	this.LRUlist.movetoHead(this.LRUlist.findIndex(page.memory_id)); //将页表所在块移至链表头
   	this.instruct_record_update(insturction_id); //更新记录
   ```

2. 当访问后发生了缺页：

   1. 若内存块未被占满（即链表长度小于内存总块数），则新建结点，结点值为页刚刚放入的内存块号，并将该结点插至链表顶端；

      ```javascript
      	if (this.LRUlist.length() < this.mem_block_num) {
              //若内存块中有剩余空间则将该页直接放入内存块，将对应的内存块插至链表首位置
              for (let i = 0; i < this.mem_block_num; ++i) {
                if (this.physical_memory[i].content == "null") {
                  //将页放入内存
                  this.physical_memory[i].content = page_in.id;
                  //将内存块号插至链表首位
                  this.LRUlist.insertHead(i);
                  return {
                    page_in: page_in.id,
                    dst_block: i,
                    page_out: "null",
                  };
                }
              }
            } 
      	 ...
      ```

      

   2. 若内存块已被占满（即链表长度等于内存总块数），则链表末尾的结点对应的内存块应当是要发生替换的块，将其从链表中删除，则转换成了上一种情况；

      ```javascript
      	...	
      	 else {
              //若内存中无剩余空间
              let dst_block_id = this.LRUlist.deleteLast(); //删除链尾元素，确定替换的块号
              let page_out_id = this.physical_memory[dst_block_id].content; //被调出的页号
              this.physical_memory[dst_block_id].content = page_in.id; //将新页调入
              //将内存块号插至首位
              this.LRUlist.insertHead(dst_block_id);
              return {
                page_in: page_in.id,
                dst_block: dst_block_id,
                page_out: page_out_id,
              };
            }
      ```

      

#### 请求调页存储管理算法

1. 在执行一条新指令时，根据其id（逻辑地址）获取其相应的逻辑页号，再通过查询页表获取该页对象，其包含相关信息——是否位于内存中，位于哪一个内存块等

   ```javascript
   	  let insturction_id = this.exe_order[this.exe_num]; //获取对应的指令id
         let page_id = Math.floor(insturction_id / 10); //对应页号
         let page = this.page_table[page_id]; //获取页表对应项
   ```

2. 判断该页是否位于内存中，即是否发生缺页：

   1. 若发生缺页，则根据LRU算法选择被替换块，进行替换、修改页表对应项，并记录相关信息

      ```javascript
            if (page.valid == false) {
              this.instruct_record_update(insturction_id); //更新记录
              //若页表不在内存中
              this.page_miss++;
              let cur_schedule = this.LRU(page); //利用LRU算法进行调度，返回调度信息
              this.schedule_record.push(cur_schedule); //记录调度信息
              //修改页表内容
              //修改调入页信息
              this.page_table[page_id].valid = true;
              this.page_table[page_id].memory_id = cur_schedule.dst_block;
              this.instruct_record_update(insturction_id); //更新记录
              //修改调出页信息
              if (cur_schedule.page_out != "null") {
                this.page_table[cur_schedule.page_out].valid = false;
                this.page_table[cur_schedule.page_out].memory_id = "null";
              }
            } 
            ...
      ```

   2. 若未发生缺页，则将页表调入空闲内存块，调整LRU辅助链表，记录相关信息

      ```javascript
      	  ...
            else {
              //页表处于内存中
              this.LRUlist.movetoHead(this.LRUlist.findIndex(page.memory_id)); //将页表所在块移至链表头
              this.instruct_record_update(insturction_id); //更新记录
            }
      ```

3. 执行下一条指令