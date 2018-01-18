import React, {PureComponent} from 'react';
import {
  Icon,
  Menu,
  Dropdown,
  Popconfirm,
} from 'antd';

export default class extends React.Component {
  render() {
    const {items, text = '更多', type = 'drop'} = this.props;
    const menu = (
      <Menu>
        {items.map((item, idx) => {
          if (!item.hide) {
            if (item.pop) {
              return (
                <Menu.Item key={idx}>
                  <Popconfirm
                    placement="left"
                    title={'确定要删除吗，操作后将无法撤回。'}
                    onConfirm={e => item.submit()}
                    {...item.pop}>
                    <a>{item.label}</a>
                  </Popconfirm>
                </Menu.Item>
              );
            }
            return (
              <Menu.Item key={idx}>
                <a onClick={e => item.submit()}>{item.label}</a>
              </Menu.Item>
            );
          }
        })}
      </Menu>
    );
    let content;
    if (type === 'drop') {
      content = (
        <a>
          {text}<Icon type="down"/>
        </a>
      );
    } else if (type === 'ellipsis') {
      content = (
        <a>...</a>
      );
    }
    return (
      <Dropdown overlay={menu} trigger={['click']}>
        {content}
      </Dropdown>
    );
  }
}
