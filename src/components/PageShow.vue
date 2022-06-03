<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header" height="90px">
        <p><b>请求调页存储管理方式模拟</b></p>
        <el-button
          type="success"
          plain
          :disabled="
            this.exe_num == this.instruction_num || this.run_continuously
          "
          @click="exe_next"
          >单步执行</el-button
        >
        <el-button type="success" plain @click="this.flash">重置</el-button>
        <el-button
          type="success"
          plain
          :disabled="
            this.exe_num == this.instruction_num || this.run_continuously
          "
          @click="run_auto"
          >自动执行</el-button
        >
        <el-input-number
          v-model="this.interval"
          :precision="2"
          :step="0.1"
          :max="2"
          :min="0.1"
          controls-position="right"
        />
        <label> s/条</label>
      </el-header>
      <el-container>
        <el-aside class="aside">
          <span><b>内存</b></span>
          <div class="memoryboard">
            <div v-for="memory in this.physical_memory" :key="memory.id">
              <span class="buttonbox">
                <label class="buttonlabel">{{ memory.id }}</label>
                <el-button type="success" disabled class="m_button">{{
                  memory.content
                }}</el-button>
                <label class="buttonlabel"
                  >start_addr: {{ memory.start_addr }}</label
                >
              </span>
            </div>
          </div>
          <div class="info">
            <table>
              <tr>
                <th>已执行条数</th>
                <th>缺页数</th>
                <th>当前缺页率</th>
              </tr>
              <tr>
                <td>{{ this.exe_num }}</td>
                <td>{{ this.page_miss }}</td>
                <td>{{ MissRate }}</td>
              </tr>
            </table>
          </div>
          <el-scrollbar id="scheInfo">
            <el-table :data="this.schedule_record" height="293">
              <el-table-column prop="page_in" label="调入逻辑页" />
              <el-table-column prop="dst_block" label="调至内存块" />
              <el-table-column prop="page_out" label="调出逻辑页" />
            </el-table>
          </el-scrollbar>
        </el-aside>
        <el-main class="main">
          <el-scrollbar>
            <el-table :data="this.instruction_record" height="500">
              <el-table-column prop="cur_id" label="指令id" />
              <el-table-column prop="process_page" label="逻辑页号" />
              <el-table-column prop="inMemory" label="所在内存块号" />
              <el-table-column prop="memory_addr" label="所在内存地址" />
              <el-table-column prop="next_id" label="下一条指令id" />
            </el-table>
          </el-scrollbar>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import linklist from "../linklist";
export default {
  name: "PageShow",
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
      // /*指令记录中的每一项内容*/
      // cur_instruction: {
      //   cur_id: null, //指令id
      //   process_page: null, //指令在进程的哪一页——逻辑页
      //   inMemory: false, //指令是否在内存中
      //   memory_addr: null, //在内存中的地址
      //   next_id: null, //下一条指令序号
      // },

      schedule_record: [], //调度记录
      // /*调度记录中的每一项内容*/
      // cur_schedule: {
      //   page_in: null, //要调入的逻辑块
      //   dst_block: null, //要调入至哪个位置
      //   page_out: null, //被替换出的逻辑页
      // },
    };
  },
  computed: {
    MissRate() {
      if (this.exe_num == 0) {
        return 0 + "%";
      } else {
        return ((this.page_miss / this.exe_num) * 100).toFixed(2) + "%";
      }
    },
  },
  methods: {
    //重置
    flash() {
      this.run_continuously = false;
      this.interval = 0.5;
      if (this.timer != null) {
        clearInterval(this.timer);
      }
      this.timer = null;
      this.exe_num = 0;
      this.page_miss = 0;
      this.LRUlist = new linklist();
      this.exe_order = [];
      this.physical_memory = [];
      this.page_table = [];
      this.instruction_record = [];
      this.schedule_record = [];
      //初始化内存
      this.memory_init();
      //初始化页表
      this.pagetable_init();
      //生成指令序列
      this.order_init();
    },
    memory_init() {
      let start = Math.floor(Math.random() * 5); //获取0-5的整数
      for (let i = 0; i < this.mem_block_num; ++i) {
        this.physical_memory.push({
          id: i, //内存号
          start_addr: i + start + "0",
          length: 10,
          content: "null", //内存块存放内容
        });
      }
    },
    pagetable_init() {
      for (let i = 0; i < this.process_page_num; ++i) {
        this.page_table.push({
          id: i, //逻辑页号
          valid: false, //是否有效——是否在内存中
          memory_id: null, //位于主存块号
        });
      }
    },
    //生成指令执行顺序
    order_init() {
      let randomOrder = Math.floor(Math.random() * (this.instruction_num - 1)); //随机选取起始执行指令
      let i = 0;
      this.exe_order.push(randomOrder);
      i++;
      this.exe_order.push(randomOrder + 1); //执行序号+1的指令
      i++;
      while (i < this.instruction_num) {
        randomOrder = Math.floor(Math.random() * randomOrder); //跳转至前0 - m-1
        this.exe_order.push(randomOrder);
        i++;
        if (i == this.instruction_num) {
          return;
        }
        this.exe_order.push(randomOrder + 1); //执行序号+1的指令
        i++;
        if (i == this.instruction_num) {
          return;
        }
        randomOrder = Math.floor(
          Math.random() * (this.instruction_num - randomOrder - 4) +
            randomOrder +
            2
        ); //跳转至后 m+2 - 319
        this.exe_order.push(randomOrder);
        i++;
        if (i == this.instruction_num) {
          return;
        }
        this.exe_order.push(randomOrder + 1); //执行序号+1的指令
        i++;
        if (i == this.instruction_num) {
          return;
        }
      }
    },
    //更新指令记录
    instruct_record_update(cur_id) {
      let page_id = Math.floor(cur_id / 10); //对应页号
      let valid = this.page_table[page_id].valid;
      if (valid == false) {
        this.instruction_record.push({
          cur_id,
          process_page: page_id,
          inMemory: "null",
          memory_addr: "null",
          next_id: this.exe_order[this.exe_num + 1],
        });
      } else {
        let block_id = this.page_table[page_id].memory_id; //所在内存号
        let addr =
          parseInt(this.physical_memory[block_id].start_addr, 10) +
          (cur_id % 10); //计算内存地址
        this.instruction_record.push({
          cur_id,
          process_page: page_id,
          inMemory: block_id,
          memory_addr: addr,
          next_id: this.exe_order[this.exe_num + 1],
        });
      }
    },
    //自动执行
    run_auto() {
      if (this.run_continuously == true) {
        if (this.exe_num == this.instruction_num) {
          this.run_continuously = false;
          if (this.timer != null) {
            clearInterval(this.timer); //清除定时器
            this.timer = null;
          }
          return;
        } else {
          this.exe_next();
        }
      } else {
        this.run_continuously = true; //禁用单步执行
        this.timer = setInterval(this.run_auto, this.interval * 1000);
      }
    },
    //执行下一条指令
    exe_next() {
      let insturction_id = this.exe_order[this.exe_num]; //获取对应的指令id
      let page_id = Math.floor(insturction_id / 10); //对应页号
      let page = this.page_table[page_id]; //获取页表对应项
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
      } else {
        //页表处于内存中
        this.LRUlist.movetoHead(this.LRUlist.findIndex(page.memory_id)); //将页表所在块移至链表头
        this.instruct_record_update(insturction_id); //更新记录
      }
      this.exe_num++;
    },

    //根据LRU算法，将页调入内存,返回一条调度记录对象
    LRU(page_in) {
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
      } else {
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
    },
  },
  created() {
    //初始化内存
    this.memory_init();
    //初始化页表
    this.pagetable_init();
    //生成指令序列
    this.order_init();
  },
};
</script>

<style scoped>
.header {
  background-color: #d1edc4;
}
.aside {
  background-color: #e1f3d8;
  width: "200px";
}
.main {
  background-color: #f0f9eb;
  text-align: center;
}
.memoryboard {
  margin-top: 10px;
  margin-bottom: 10px;
}
.buttonlabel {
  padding-right: 15px;
  padding-left: 15px;
}
.m_button {
  border-radius: 0px;
  border-color: #d1edc4;
  width: 75px;
}
.info {
  margin-left: 38px;
  margin-bottom: 10px;
}
.info td {
  text-align: center;
}
#scheInfo {
  height: 300px;
  width: 95%;
  left: 2.5%;
}
</style>
