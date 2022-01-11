import WalletConnector  from '../WalletConnection/WalletConnector'
import logo from '../../assets/yyprime_logo.svg';
// import MobileLogo from '../../assets/steak.png';
import {
    NavLink
  } from "react-router-dom";

export default function Header(){
  return (
    <nav className="container w-full mx-auto flex flex-row items-center justify-between my-5">
        <div className="flex flex-row">
            <NavLink exact={true} to="/">
              <img className="hidden md:block h-auto w-20" alt="Desktop yyprime Logo" src={logo}/>
            </NavLink>
            <NavLink exact={true} to="/">
              <img className="block md:hidden h-auto w-8" alt="Mobile yyprime Logo" src={logo}/>
            </NavLink>
        </div>
        {/* <ul className="hidden lg:flex flex-row justify-around table-bg w-56 container mx-auto p-3 my-5 rounded-lg text-base font-semibold">
            <NavLink exact={true} activeClassName="is-activeLink" to="/">Market Simulator</NavLink>
        </ul> */}
        <div className="flex flex-row justify-between">
            <WalletConnector/>
        </div>
    </nav>
  );
};