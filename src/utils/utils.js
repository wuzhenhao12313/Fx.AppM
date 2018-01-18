import moment from 'moment';
import dynamic from 'dva/dynamic';
import {IQueryable} from '../utils/rs/Linq';

function recursionNav(originData, targetData, pid = 'parentID', mid = 'menuID') {
  if (targetData.length > 0) {
    targetData.forEach(nav => {
      const childrenData = IQueryable(originData).Where(x => x[pid] === nav[mid]).OrderBy("showIndex").ToList();
      if (childrenData.length !== 0) {
        nav.children = nav.children || [];
        nav.children = nav.children.concat(recursionNav(originData, childrenData));
      }
    });
    return targetData;
  }
  return [];
}

function recursionTree(originData, targetData, id, pid = 'parentID', order) {
  if (targetData.length > 0) {
    targetData.forEach(nav => {
      const childrenData = IQueryable(originData).Where(x => x[pid] === nav[id])
      if (order) {
        childrenData.OrderBy(order);
      }
      if (childrenData.ToList().length !== 0) {
        nav.children = nav.children || [];
        nav.children = nav.children.concat(recursionTree(originData, childrenData.ToList(), id, order));
      }
    });
    return targetData;
  }
  return [];
}

function recursionTreeData(originData, targetData, order) {
  if (targetData.length > 0) {
    targetData.forEach(data => {
      const childrenData = IQueryable(originData).Where(x => x['parentID'].toString() === data['value']);
      if (order) {
        childrenData.OrderBy(order);
      }
      if (childrenData.ToList().length !== 0) {
        data.children = data.children || [];
        data.children = data.children.concat(recursionTreeData(originData, childrenData.ToList(), order));
      }
    });
    return targetData;
  }
  return [];
}

function getRelation(str1, str2) {
  if (str1 === str2) {
    console.warn('Two path are equal!');  // eslint-disable-line
  }
  const arr1 = str1.split('/');
  const arr2 = str2.split('/');
  if (arr2.every((item, index) => item === arr1[index])) {
    return 1;
  } else if (arr1.every((item, index) => item === arr2[index])) {
    return 2;
  }
  return 3;
}

export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

export function createNav(data, pid = 'parentID', mid = 'menuID') {
  data = data || [];
  const navData = IQueryable(data).Where(x => x[pid] === 0).OrderBy("showIndex").ToList();
  return recursionNav(data, navData, pid, mid);
}

export function createTree(data, id, pid = 'parentID', order) {
  data = data || [];
  const treeData = IQueryable(data).Where(x => x['parentID'] === 0);
  if (order) {
    treeData.OrderBy(order);
  }
  return recursionTree(data, treeData.ToList(), id, pid, order);
}

export function createTreeData(data, labelColumn, valueColumn, order) {
  data = data || [];
  const _data = [];
  data.forEach(x => {
    const result = {
      label: x[labelColumn],
      value: x[valueColumn].toString(),
      key: x[valueColumn].toString(),
      parentID: x.parentID,
    };
    _data.push(result);
  });
  const treeData = IQueryable(_data).Where(x => x['parentID'] === 0);
  if (order) {
    treeData.OrderBy(order);
  }
  return recursionTreeData(_data, treeData.ToList(), order);
}

export function getTimeDistance(type) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  if (type === 'today') {
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    return [moment(now), moment(now.getTime() + (oneDay - 1000))];
  }

  if (type === 'week') {
    let day = now.getDay();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if (day === 0) {
      day = 6;
    } else {
      day -= 1;
    }

    const beginTime = now.getTime() - (day * oneDay);

    return [moment(beginTime), moment(beginTime + ((7 * oneDay) - 1000))];
  }

  if (type === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const nextDate = moment(now).add(1, 'months');
    const nextYear = nextDate.year();
    const nextMonth = nextDate.month();

    return [moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`), moment(moment(`${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`).valueOf() - 1000)];
  }

  if (type === 'year') {
    const year = now.getFullYear();

    return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)];
  }
}

export function getPlainNode(nodeList, parentPath = '') {
  const arr = [];
  nodeList.forEach((node) => {
    const item = node;
    item.path = `${parentPath}/${item.path || ''}`.replace(/\/+/g, '/');
    item.exact = true;
    if (item.children && !item.component) {
      arr.push(...getPlainNode(item.children, item.path));
    } else {
      if (item.children && item.component) {
        item.exact = false;
      }
      arr.push(item);
    }
  });
  return arr;
}

export function digitUppercase(n) {
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟'],
  ];
  let num = Math.abs(n);
  let s = '';
  fraction.forEach((item, index) => {
    s += (digit[Math.floor(num * 10 * (10 ** index)) % 10] + item).replace(/零./, '');
  });
  s = s || '整';
  num = Math.floor(num);
  for (let i = 0; i < unit[0].length && num > 0; i += 1) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j += 1) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }

  return s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
}

export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(routePath =>
  routePath.indexOf(path) === 0 && routePath !== path);
  routes = routes.map(item => item.replace(path, ''));
  // let renderArr = [];
  // renderArr.push(routes[0]);
  // for (let i = 1; i < routes.length; i += 1) {
  //   let isAdd = false;
  //   isAdd = renderArr.every(item => getRelation(item, routes[i]) === 3);
  //   renderArr = renderArr.filter(item => getRelation(item, routes[i]) !== 1);
  //   renderArr.push(routes[i]);
  // }
  const renderRoutes = routes.map((item) => {
    const exact = !routes.some(route => route !== item && getRelation(route, item) === 1);
    return {
      key: `${path}${item}`,
      path: `${path}${item}`,
      component: routerData[`${path}${item}`].component,
      exact: true,
    };
  });
  return renderRoutes;
}


