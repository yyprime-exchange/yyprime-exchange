import "../App.css";
import Header from "../components/Navigation/header";
import { PriceStatus } from "@pythnetwork/client";
import sigFigs from "../utils/sigFigs";
import { Button, Col, Row, Table } from "antd";
import { useContext, useEffect, useMemo } from "react";
import usePyth from "../hooks/usePyth";
import { PythContext } from "../contexts/pyth";

const columns = [
  { title: "Symbol", dataIndex: ["symbol"] },
  // { title: "Asset Type", dataIndex: ["product", "asset_type"] },
  // {
  //   title: "Status",
  //   dataIndex: ["price", "status"],
  //   render: (value: number) => PriceStatus[value],
  // },
  // {
  //   title: "Valid Slot",
  //   dataIndex: ["price", "validSlot"],
  //   render: (value: BigInt) => value.toString(),
  // },
  {
    title: "Price",
    dataIndex: ["price"],
    align: "right" as "right",
    render: (value: number) => `$${sigFigs(value)}`,
  },
  // {
  //   title: "Confidence",
  //   dataIndex: ["price", "confidence"],
  //   align: "right" as "right",
  //   render: (value: number) => `\xB1$${sigFigs(value)}`,
  // },
];
function Simulator() {
  const {} = usePyth();

  const [priceState, _] = useContext(PythContext);

  useEffect(() => {
    console.log("price changed");
  }, [priceState.pricingMap]);

  return (
    // <div className='max-h bg-gray-600'>
    <div id="simulator" className="pb-20">
      <Header />

      <div className="grid grid-cols-1 container mx-auto max-w-4xl">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Symbol
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price(USD)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceState.pricingMap &&
                    Object.keys(priceState.pricingMap).map((key) => (
                      <tr key = {key}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10"></div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {key}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sigFigs(priceState.pricingMap[key])}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulator;
