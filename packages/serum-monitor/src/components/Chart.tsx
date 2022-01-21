import React, { useContext } from "react";
import Chart from "react-apexcharts";
import { PythContext } from "../contexts/pyth";

export const RealTimeChart = ({range,dataList}) => {
  const options = {
    chart: {
      zoom: {
        enabled: false,
      },
      animations: {
        easing: "linear",
        dynamicAnimation: {
          speed: 500,
        },
      }
    },
    colors: ["#41C77A", "#F23B69"],
    tooltip: {
      x: {
        format: "yyyy/MM/dd HH:mm:ss.f",
      },
    },
    xaxis: {
      type: "numeric",
      offsetX: 5,
      range: range,
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toFixed(0),
      },
      title: { text: "Value" },
    },
  };
  // @ts-ignore
  return <Chart height="300" width="1000" type="line" options={options} series={dataList} />;
};

const TIME_RANGE_IN_MILLISECONDS = 30 * 1000;
const ADDING_DATA_INTERVAL_IN_MILLISECONDS = 1000;
const ADDING_DATA_RATIO = 0.8;

export const PriceChart = () => {
  const nameList = ["Pyth Price", "Serum Price"];
  const defaultDataList = nameList.map((name) => ({
    name: name,
    data: [],
  }));

  const [productInfoState, _, subscribe] = useContext(PythContext);

  const [dataList, setDataList] = React.useState(defaultDataList);

  React.useEffect(() => {
    // if(!productInfoState.historicalPythPrice || productInfoState.historicalSerumPrice) return
    const data = [{name: "Pyth Price", data: productInfoState.historicalPythPrice}, {name: "Serum Price", data: productInfoState.historicalSerumPrice}]
    console.log(data, "sdata")
    setDataList(data)
    // const addDataRandomly = (data) => {
    //   if (Math.random() < 1 - ADDING_DATA_RATIO) {
    //     return data;
    //   }
    //   return [
    //     ...data,
    //     {
    //       x: new Date(),
    //       y: data.length * Math.random(),
    //     },
    //   ];
    // };
    // const interval = setInterval(() => {
    //   setDataList(
    //     dataList.map((val) => {
    //       return {
    //         name: val.name,
    //         data: addDataRandomly(val.data),
    //       };
    //     })
    //   );
    // }, ADDING_DATA_INTERVAL_IN_MILLISECONDS);

    // return () => clearInterval(interval);

  }, [productInfoState.historicalPythPrice, productInfoState.historicalSerumPrice]);

  return (
    <div>
      <RealTimeChart
        dataList={dataList}
        range={10}
      />

    </div>
  );
};
