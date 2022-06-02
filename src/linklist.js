class linklist {
    constructor() {
        this.item = 0; //头结点显示当前列表长度
        this.next = null;
    }
    length() {
        return this.item;
    }
    //在链表末尾添加结点
    append(item) {
        let cur_p = this;
        while (cur_p.next != null) {
            cur_p = cur_p.next;
        }
        //此时到达最后一个结点中
        cur_p.next = new linklist();
        cur_p.next.item = item;
        this.item++; //链表长度+1
    }
    //删除链表末尾结点
    deleteLast() {
        if (this.length() == 0) {
            return;
        }
        let cur_p = this;
        while (cur_p.next.next != null) {
            cur_p = cur_p.next;
        }
        //此时到达倒数第二个结点
        cur_p.next = null;
        this.item--;
    }
    //寻找元素是否在链表中，若存在则返回相应位置（头结点位置为0），若不存在则返回-1
    findIndex(item) {
        let cur_p = this.next;
        for (let i = 1; cur_p != null; ++i) {
            if (cur_p.item == item) {
                return i;
            }
            cur_p = cur_p.next;
        }
        return -1;
    }
    //将指定位置元素移至链表头（头结点后第一个）——成功返回true，失败返回false
    movetoHead(index) {
        if (index > this.length() || index == 0) {
            return false;
        }
        let cur_p = this;
        for (let i = 0; i < index - 1; i++) {
            cur_p = cur_p.next;
        }
        //此时到达要移动的结点的前一个结点处
        let tem = cur_p.next; //要移动的结点
        cur_p.next = tem.next;
        tem.next = this.next;
        this.next = tem;
        return true;
    }
    //在链表首位插入元素
    insertHead(item) {
        let tmp = this.next;
        this.next = new linklist();
        this.next.item = item;
        this.next.next = tmp;
        this.item++;
    }
}

export default  linklist;