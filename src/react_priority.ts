import {
  unstable_IdlePriority as IdlePriority,
  unstable_LowPriority as LowPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_UserBlockingPriority as UserBlockingPriorpriority,
  unstable_ImmediatePriority as ImmediatePriorpriority,
  //取消当前执行的回调任务
  unstable_cancelCallback as cancelCallback,
  //调度高优先级任务
  unstable_scheduleCallback as scheduleCallback,
  //获取当前执行的任务回调
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  unstable_shouldYield as shouldYield,
  //当前执行的任务
  CallbackNode
} from 'scheduler';

type Priority =
  | typeof IdlePriority
  | typeof LowPriority
  | typeof NormalPriority
  | typeof UserBlockingPriorpriority
  | typeof ImmediatePriorpriority;

interface Work {
  count: number;
  priority: Priority;
}

/*
  1、初始化全局变量
*/
const workList: Work[] = [];
let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;

/*
  2、schedule调度方法
*/
function schedule() {
  //1、取出当前正在调度的工作回调
  const cbNode = getFirstCallbackNode();

  //调度算法
  //2、取出当前的高优先级任务
  const curWork = workList.sort((a, b) => a.priority - b.priority)[0];

  //策略逻辑
  //3、判断当前时候还有执行的任务，没有则取消上次的任务回调
  if (!curWork) {
    curCallback = null;
    cbNode && cancelCallback(cbNode);
    return;
  }

  //4、对当前任务的优先级判断，如果和上次一样不需要中断，因为优先级一样
  const { priority: curPriority } = curWork;
  if (curPriority === prevPriority) {
    return;
  }

  //5、如果是高优先级的任务，需要中断上一次正在执行的任务，开始调度高优先级的任务
  cbNode && cancelCallback(cbNode);
  curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

/*
  3、perform为reconcile协调方法模拟
*/
function perform(work: Work, didTimeout?: boolean): any {
  //1、是否需要同步执行
  const needSync = work.priority === ImmediatePriorpriority || didTimeout;

  // 2、执行reconcile
  while ((needSync || !shouldYield) && work.count) {
    work.count--;
    insertItem(work.priority);
  }

  // 3、记录上一次调度任务的优先级、并判断当前任务是否执行完毕，完毕这从任务队列中移除该任务
  prevPriority = work.priority;
  //当前的work已经执行完成，从worklist中剔除改work
  if (!work.count) {
    const workIndex = workList.indexOf(work);
    workList.splice(workIndex, 1);
    prevPriority = IdlePriority;
  }

  //4、判断两次正在执行的回调是否是同一个任务，如果是说明当前任务没有执行完毕，则同步执行当前高优先级的任务
  const prevCallback = curCallback;
  schedule();
  const newCallback = curCallback;

  //同一个callback则同步调用

  //5、小循环同步执行该优先级的任务
  if (newCallback && prevCallback === newCallback) {
    return perform.bind(null, work);
  }
}

/*
  4、触发任务的方法
*/

const contentBox = document.querySelector('#content');
const priority2UserList: Priority[] = [
  ImmediatePriorpriority,
  UserBlockingPriorpriority,
  NormalPriority,
  LowPriority,
  IdlePriority
];
const priority2Name = [
  'noop',
  'ImmediatePriorpriority',
  'UserBlockingPriorpriority',
  'NormalPriority',
  'LowPriority',
  'IdlePriority'
];
priority2UserList.forEach(priority => {
  const btn = document.createElement('button');
  contentBox?.appendChild(btn);
  btn.innerText = priority2Name[priority];
  btn.onclick = () => {
    const newWork: Work = { count: 100, priority };
    workList.push(newWork);
    schedule();
  };
});
function insertItem(priority: Priority) {
  const ele = document.createElement('span');
  ele.innerText = `${priority}`;
  ele.className = `pri-${priority}`;

  let len = 100000;
  let result = 0;
  while (len--) {
    result += len;
  }

  contentBox?.appendChild(ele);
}
