import React from 'react';
import PropTypes from 'prop-types';
import {Layout, Icon} from 'antd';
import DocumentTitle from 'react-document-title';
import {connect} from 'dva';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {Route, Redirect, Switch} from 'dva/router';
import {ContainerQuery} from 'react-container-query';
import classNames from 'classnames';
import {enquireScreen} from 'enquire-js';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import SiderMenu from '../components/SiderMenu';
import NotFound from '../routes/Exception/404';
import {getRoutes} from '../utils/utils';
import {getMenuData} from '../common/menu';
import {Config} from '../utils/rs/';


/**
 * 根据菜单取得重定向地址.
 */
const redirectData = [];
const getRedirect = (item) => {
  if (item && item.children) {
    if (item.children[0] && item.children[0].path) {
      redirectData.push({
        from: `/${item.path}`,
        to: `/${item.children[0].path}`,
      });
      item.children.forEach((children) => {
        getRedirect(children);
      });
    }
  }
};
getMenuData().forEach(getRedirect);

const {Content} = Layout;
const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
};

let isMobile;
let lastHref;
enquireScreen((b) => {
  isMobile = b;
});

class BasicLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
  }

  state = {
    isMobile,
  };

  getChildContext() {
    const {location, routerData} = this.props;
    return {
      location,
      breadcrumbNameMap: routerData,
    };
  }

  componentDidMount() {
    enquireScreen((b) => {
      this.setState({
        isMobile: !!b,
      });
    });
  }

  getPageTitle() {
    const {routerData, location} = this.props;
    const {pathname} = location;
    let title = Config.title;
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - ${Config.title}`;
    }
    return title;
  }

  render() {

    const {
      currentUser, collapsed, fetchingNotices, notices, routerData, match, location, dispatch, loading,
    } = this.props;
    let {hash} = location;
    hash = hash.startsWith('#/') ? hash : `#/${hash}`;
    const href = window.location.href;
    if (lastHref !== href) {
      NProgress.start();
      if (!loading.global) {
        NProgress.done();
        lastHref = href;
      }
      setTimeout(() => {
        NProgress.done();
      }, 10000);
    }
    const layout = (
      <Layout>
        <SiderMenu
          collapsed={collapsed}
          location={location}
          dispatch={dispatch}
          isMobile={this.state.isMobile}
        />
        <Layout>
          <GlobalHeader
            currentUser={currentUser}
            fetchingNotices={fetchingNotices}
            notices={notices}
            collapsed={collapsed}
            dispatch={dispatch}
            isMobile={this.state.isMobile}
          />
          <Content style={{margin: '24px 24px 0', height: '100%'}}>
            <div style={{minHeight: 'calc(100vh - 260px)'}}>
              <Switch>
                {
                  redirectData.map(item =>
                    <Redirect key={item.from} exact from={item.from} to={item.to}/>
                  )
                }
                {
                  getRoutes(match.path, routerData).map(item => (
                    <Route
                      key={item.key}
                      path={item.path}
                      component={item.component}
                      exact={item.exact}
                    />
                  ))
                }
                <Redirect exact from="/" to="/app/list"/>
                <Route render={NotFound}/>
              </Switch>
            </div>
            {/*<GlobalFooter*/}
              {/*links={[{*/}
                {/*title: 'Erp 首页',*/}
                {/*href: 'http://erp.polelong.com',*/}
                {/*blankTarget: true,*/}
              {/*}, {*/}
                {/*title: 'PoleCS 首页',*/}
                {/*href: 'http://polecs.polelong.com/#/home/desktop',*/}
                {/*blankTarget: true,*/}
              {/*}, {*/}
                {/*title: 'OA 首页',*/}
                {/*href: 'http://oa.polelong.com/#/dashboard/workplace',*/}
                {/*blankTarget: true,*/}
              {/*}]}*/}
              {/*copyright={*/}
                {/*<div>*/}
                  {/*Copyright <Icon type="copyright"/> 2018 破浪电子信息技术有限公司技术部*/}
                {/*</div>*/}
              {/*}*/}
            {/*/>*/}
          </Content>
        </Layout>
      </Layout>
    );

    return (
      <DocumentTitle title={this.getPageTitle()}>
        <ContainerQuery query={query}>
          {params => <div className={classNames(params)}>{layout}</div>}
        </ContainerQuery>
      </DocumentTitle>
    );
  }
}

export default connect(state => ({
  currentUser: state.user.currentUser,
  collapsed: state.global.collapsed,
  fetchingNotices: state.global.fetchingNotices,
  notices: state.global.notices,
  loading: state.loading,
}))(BasicLayout);
