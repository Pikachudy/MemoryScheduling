<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <div><br />请求调页存储管理方式模拟</div>
      </el-header>
      <el-container>
        <el-aside class="aside">
          <span>内存</span>
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
                <td>320</td>
                <td>20</td>
                <td>{{ (20 / 320) * 100 + "%" }}</td>
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
              <el-table-column prop="inMemory" label="位于内存" />
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
      LRUlist: new linklist(),//LRU算法辅助链表
      exe_order:[],//指令执行顺序

      mem_block_num: 4, //内存块数
      process_page_num: 32, //进程页数
      instruction_num: 320, //指令数
      physical_memory: [], //内存信息
      page_table: [], //页表信息

      instruction_record: [], //指令记录
      /*指令记录中的每一项内容*/
      cur_instruction: {
        cur_id: null, //指令id
        process_page: null, //指令在进程的哪一页——逻辑页
        inMemory: false, //指令是否在内存中
        memory_addr: null, //在内存中的地址
        next_id: null, //下一条指令序号
      },

      schedule_record: [], //调度记录
      /*调度记录中的每一项内容*/
      cur_schedule: {
        page_in: null, //要调入的逻辑块
        dst_block: null, //要调入至哪个位置
        page_out: null, //被替换出的逻辑页
      },
    };
  },
  methods: {
    memory_init() {
      let start = Math.floor(Math.random() * 5); //获取0-5的整数
      for (let i = 0; i < this.mem_block_num; ++i) {
        this.physical_memory.push({
          id: i,
          start_addr: i + start + "0",
          length: 10,
          content: "null",
        });
      }
    },
    pagetable_init() {
      for (let i = 0; i < this.process_page_num; ++i) {
        this.page_table.push({
          id: i,
          valid: false,
          memory_id: null,
        });
      }
    },
    //生成指令执行顺序
    order_init(){
        let randomOrder = Math.floor(Math.random()*this.instruction_num);//随机选取起始执行指令
        let i = 0;
        this.exe_order.push(randomOrder);
        i++;
        this.exe_order.push(randomOrder+1);//执行序号+1的指令
        i++;
        while(i<this.instruction_num){
            randomOrder = Math.floor(Math.random()*randomOrder);//跳转至前0 - m-1
            this.exe_order.push(randomOrder);
            i++;
            if(i==this.instruction_num){
                return;
            }
            this.exe_order.push(randomOrder+1);//执行序号+1的指令
            i++;
            if(i==this.instruction_num){
                return;
            }
            randomOrder=Math.floor(Math.random()*(this.instruction_num-randomOrder)+randomOrder+1);//跳转至后 m+2 - 319
             this.exe_order.push(randomOrder);
            i++;
            if(i==this.instruction_num){
                return;
            }
            this.exe_order.push(randomOrder+1);//执行序号+1的指令
            i++;
            if(i==this.instruction_num){
                return;
            }
        }
    }
    
  },
  created() {
    //初始化内存
    this.memory_init();
    //初始化页表
    this.pagetable_init();
    //生成指令序列
    this.order_init();
    console.log(this.exe_order.length);
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
.buttonbox {
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
