import { Menu, Row } from 'antd';
import React, { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import logo from '../assets/knot.svg';

const Wrapper = styled.div`
  background-color: #0d1017;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 0px 30px;
  flex-wrap: wrap;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  color: #e76e3c;
  font-weight: bold;
  cursor: pointer;
  img {
    height: 30px;
    margin-right: 8px;
  }
`;

export default function TopBar() {
  const history = useHistory();
  const handleClick = useCallback(
    (e) => {
      history.push(e.key);
    },
    [history]
  );

  const location = useLocation();

  return (
    <>
      <Wrapper>
        <LogoWrapper>
          <img src={logo} alt="" />
          {"YY'X"}
        </LogoWrapper>
        <Menu
          mode="horizontal"
          onClick={handleClick}
          selectedKeys={[location.pathname]}
          style={{
            borderBottom: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            flex: 1,
            color: '#dd3232',
          }}
        >
          <Menu.Item key={'/market/btc/usdc'} style={{ margin: '0 10px 0 20px' }}>
            BTC/USDC
          </Menu.Item>
          <Menu.Item key={'/market/eth/usdc'} style={{ margin: '0 10px 0 20px' }}>
            ETH/USDC
          </Menu.Item>
          <Menu.Item key={'/market/sol/usdc'} style={{ margin: '0 10px 0 20px' }}>
            SOL/USDC
          </Menu.Item>
          <Menu.Item key={'/pools'} style={{ margin: '0 10px 0 20px' }}>
            LIQUIDITY POOLS
          </Menu.Item>
        </Menu>
        <div>
          <Row
            align="middle"
            style={{ paddingLeft: 5, paddingRight: 5 }}
            gutter={16}
          >
          </Row>
        </div>
      </Wrapper>
    </>
  );
}
